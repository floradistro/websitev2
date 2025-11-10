import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const registerId = searchParams.get("registerId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId parameter" }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from("pos_sessions")
      .select(
        `
        id,
        session_number,
        status,
        opening_cash,
        total_sales,
        total_transactions,
        total_cash,
        total_card,
        walk_in_sales,
        pickup_orders_fulfilled,
        opened_at,
        last_transaction_at
      `,
      )
      .eq("location_id", locationId)
      .eq("status", "open");

    // Filter by register if provided
    if (registerId) {
      query = query.eq("register_id", registerId);
    }

    const { data: session, error } = await query
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching active session:", err);
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in active session endpoint:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
