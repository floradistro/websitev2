import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const locationId = searchParams.get("locationId");

    // For location-based queries, get vendor from locations table
    let finalVendorId = vendorId;

    if (locationId && !vendorId) {
      const { data: location } = await supabase
        .from("locations")
        .select("vendor_id")
        .eq("id", locationId)
        .single();

      if (location?.vendor_id) {
        finalVendorId = location.vendor_id;
      }
    }

    if (!finalVendorId) {
      return NextResponse.json(
        { error: "Missing vendorId or locationId parameter" },
        { status: 400 },
      );
    }

    // Build query for shipping orders
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
        shipping_amount,
        payment_status,
        payment_method,
        fulfillment_status,
        created_at,
        shipped_date,
        tracking_number,
        tracking_url,
        shipping_carrier,
        shipping_address,
        shipping_method_title,
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
      .eq("vendor_id", finalVendorId)
      .eq("delivery_type", "delivery")
      .in("fulfillment_status", ["unfulfilled", "partial"])
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching shipping orders:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in shipping orders endpoint:", error);
    }
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
