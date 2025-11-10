import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// This endpoint uses service role key to run migrations
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20251027_wholesale_system.sql",
    );
    const sql = readFileSync(migrationPath, "utf-8");

    // Execute the full SQL directly - Supabase will handle it
    const { data, error } = await supabase.rpc("exec_sql", { query: sql });

    if (error) {
      // If exec_sql doesn't exist, provide instructions
      return NextResponse.json(
        {
          success: false,
          error: "Direct SQL execution not available via JS client",
          instructions: [
            "1. Go to: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql",
            "2. Open file: supabase/migrations/20251027_wholesale_system.sql",
            "3. Copy all contents",
            "4. Paste into SQL Editor",
            '5. Click "Run"',
          ],
          migrationFile: migrationPath,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Migration executed successfully",
      data,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Migration error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        instructions: [
          "Please run the migration manually:",
          "1. Go to: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql",
          "2. Open file: supabase/migrations/20251027_wholesale_system.sql",
          "3. Copy all contents and paste into SQL Editor",
          '4. Click "Run"',
        ],
      },
      { status: 500 },
    );
  }
}
