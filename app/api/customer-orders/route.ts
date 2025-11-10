import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Get base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customer");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Fetch orders from Supabase
    const response = await fetch(
      `${getBaseUrl()}/api/supabase/orders?customer_id=${customerId}&per_page=100`,
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch orders");
    }

    // Map to expected format for dashboard
    const orders = data.orders.map((order: any) => ({
      id: order.id,
      number: order.order_number,
      status: order.status,
      total: order.total_amount.toString(),
      date_created: order.order_date,
      date_modified: order.updated_at,
      date_completed: order.completed_date,
      billing: order.billing_address,
      shipping: order.shipping_address,
      line_items: order.order_items.map((item: any) => ({
        id: item.id,
        name: item.product_name,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.line_total,
        image: item.product_image ? { src: item.product_image } : null,
        meta_data: item.meta_data || {},
        order_type: item.order_type || "delivery",
        tier_name: item.tier_name,
        pickup_location: item.pickup_location_name,
      })),
      shipping_lines: [],
      payment_method: order.payment_method,
      payment_method_title: order.payment_method_title,
      customer_note: order.customer_note,
      has_delivery: order.delivery_type === "delivery" || order.delivery_type === "mixed",
      has_pickup: order.delivery_type === "pickup" || order.delivery_type === "mixed",
      pickup_location: order.pickup_location_id,
    }));

    return NextResponse.json({
      success: true,
      orders,
      total: data.pagination?.total || orders.length,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Customer orders error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        orders: [],
        error: err.message,
      },
      { status: 500 },
    );
  }
}
