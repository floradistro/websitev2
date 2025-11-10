import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";

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

export async function GET(request: NextRequest, {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
 params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch order from Supabase
    const response = await fetch(`${getBaseUrl()}/api/supabase/orders/${id}`);
    const data = await response.json();

    if (!data.success || !data.order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = data.order;

    // Format order data
    const formattedOrder = {
      id: order.id,
      number: order.order_number,
      status: order.status,
      total: order.total_amount.toString(),
      currency: order.currency || "USD",
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
      })),
      shipping_lines: [],
      payment_method: order.payment_method,
      payment_method_title: order.payment_method_title,
      customer_note: order.customer_note,
      tracking_number: order.tracking_number,
      shipping_carrier: order.shipping_carrier,
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Order detail error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
