import { getServiceSupabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20251027_wholesale_system.sql",
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split into individual statements (rough split, may need refinement)
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let successCount = 0;
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql_query: statement,
        });

        if (error) {
          // Try direct query if RPC doesn't work
          const directResult = await supabase.from("_raw").select("*").limit(0);
          // If that fails, log and continue
          if (process.env.NODE_ENV === "development") {
            logger.error(`Statement ${i + 1} error:`, error.message);
          }
          errors.push({ statement: i + 1, error: error.message });
        } else {
          successCount++;
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === "development") {
          logger.error(`Statement ${i + 1} exception:`, err.message);
        }
        errors.push({ statement: i + 1, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed: ${successCount}/${statements.length} statements successful`,
      successCount,
      totalStatements: statements.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Migration error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
