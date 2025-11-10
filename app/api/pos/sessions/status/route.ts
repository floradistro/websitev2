import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Fast session status check endpoint
 * Returns only id and status for minimal overhead
 * Used by POS for 2-second polling to detect closed sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: session, error } = await supabase
      .from("pos_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error checking session status:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in session status endpoint:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
