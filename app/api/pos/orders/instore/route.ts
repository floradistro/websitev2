import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
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

    // Get start of today in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch in-store (POS) orders for this location from today
    // POS sales have: delivery_type='pickup', fulfillment_status='fulfilled', and metadata.pos_sale=true
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
        billing_address,
        delivery_type,
        fulfillment_status,
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
      .eq("fulfillment_status", "fulfilled")
      .gte("created_at", todayISO)
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching in-store orders:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter to only POS sales (exclude online pickup orders that were fulfilled)
    const posOrders = (data || []).filter(
      (order: any) => order.metadata?.pos_sale === true || order.metadata?.walk_in === true,
    );

    // Debug: Log first order to see structure
    if (posOrders.length > 0) {
    }

    return NextResponse.json({ orders: posOrders });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in in-store orders endpoint:", error);
    }
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
