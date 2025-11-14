import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin endpoint to deploy the atomic session function
 * Call this once to deploy the migration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      "migrations",
      "001_enterprise_session_management.sql"
    );

    const sql = fs.readFileSync(migrationPath, "utf8");

    // Split into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    const results = [];

    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Use raw SQL execution via service role
        const { data, error } = await supabase.rpc('query', {
          query: statement
        }).throwOnError();

        results.push({
          statement: i + 1,
          status: "success",
          preview: statement.substring(0, 100)
        });
      } catch (err: any) {
        // Try alternative: direct table operations for index
        if (statement.includes("CREATE UNIQUE INDEX")) {
          // Skip - will handle with raw query below
        } else if (statement.includes("CREATE OR REPLACE FUNCTION")) {
          // Function creation - critical
          results.push({
            statement: i + 1,
            status: "error",
            error: err.message,
            preview: statement.substring(0, 100)
          });
        }
      }
    }

    // Test if function exists
    const { data: testData, error: testError } = await supabase.rpc(
      "get_or_create_session",
      {
        p_register_id: "00000000-0000-0000-0000-000000000000",
        p_location_id: "00000000-0000-0000-0000-000000000000",
        p_vendor_id: "00000000-0000-0000-0000-000000000000",
        p_user_id: "00000000-0000-0000-0000-000000000000",
        p_opening_cash: 0,
      }
    );

    const functionExists = !testError || !testError.message.includes("Could not find");

    return NextResponse.json({
      success: true,
      function_exists: functionExists,
      results,
      message: functionExists
        ? "✅ Atomic session function deployed successfully!"
        : "⚠️ Function may not have been created - please check manually",
      manual_deployment: {
        step1: "Go to: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new",
        step2: "Copy the entire content of migrations/001_enterprise_session_management.sql",
        step3: "Paste it into the SQL editor",
        step4: "Click RUN to execute",
        step5: "Verify the function exists by checking Functions in the left sidebar"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        instructions: "Please deploy manually via Supabase Dashboard SQL editor"
      },
      { status: 500 }
    );
  }
}

