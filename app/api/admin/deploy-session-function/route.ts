import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Deploy atomic session management function to production
 *
 * This uses the service_role key to execute raw SQL
 */
export async function POST(request: NextRequest) {
  try {
    // Use service role client for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("📦 Deploying atomic session management function...");

    // Read the migration file
    const migrationPath = path.join(process.cwd(), "migrations", "001_enterprise_session_management.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split into individual statements
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    const results = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Use rpc to execute SQL
        const { data, error } = await supabase.rpc("exec_sql", {
          query: statement
        }).single();

        if (error) {
          // Try alternative: direct execution via REST API
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
              },
              body: JSON.stringify({ query: statement })
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          results.push({
            statement: i + 1,
            status: "success",
            method: "REST API"
          });
        } else {
          results.push({
            statement: i + 1,
            status: "success",
            method: "RPC",
            data
          });
        }

        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (err: any) {
        console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
        results.push({
          statement: i + 1,
          status: "error",
          error: err.message
        });
      }
    }

    // Verify function was created
    const { data: functionCheck, error: checkError } = await supabase.rpc(
      "exec_sql",
      {
        query: `
          SELECT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'get_or_create_session'
          ) as function_exists;
        `
      }
    );

    const functionExists = functionCheck?.[0]?.function_exists || false;

    return NextResponse.json({
      success: true,
      message: functionExists
        ? "✅ Atomic session function deployed successfully!"
        : "⚠️ Function may not have been created - please check manually",
      function_exists: functionExists,
      statements_executed: results.length,
      results,
      next_steps: [
        "1. Verify function exists in Supabase Dashboard",
        "2. Update frontend to use /api/pos/sessions/get-or-create",
        "3. Test concurrent session creation",
        "4. Delete /api/pos/sessions/open endpoint"
      ]
    });
  } catch (error: any) {
    console.error("❌ Deployment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to deploy atomic function",
        details: error.message,
        manual_deployment_required: true,
        instructions: {
          message: "Please deploy manually via Supabase Dashboard",
          url: "https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new",
          sql_file: "migrations/001_enterprise_session_management.sql"
        }
      },
      { status: 500 }
    );
  }
}
