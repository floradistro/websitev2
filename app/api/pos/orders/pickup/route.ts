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

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId parameter" }, { status: 400 });
    }

    // Fetch pickup orders for this location
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        customer_id,
        total_amount,
        subtotal,
        tax_amount,
        payment_status,
        payment_method,
        created_at,
        metadata,
        customers (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          line_total
        )
      `,
      )
      .eq("pickup_location_id", locationId)
      .eq("delivery_type", "pickup")
      .in("fulfillment_status", ["unfulfilled", "partial"])
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching pickup orders:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in pickup orders endpoint:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
