/**
 * Database Health Check
 * Verifies Supabase database connectivity
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from("vendors")
      .select("id")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      throw error;
    }

    return NextResponse.json({
      success: true,
      status: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: "disconnected",
        error: error.message || "Database connection failed",
      },
      { status: 503 },
    );
  }
}
