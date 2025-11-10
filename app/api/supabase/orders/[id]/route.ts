import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customer:customer_id(id, email, first_name, last_name, phone, billing_address, shipping_address),
        order_items(
          *,
          product:product_id(id, name, slug, featured_image, price),
          vendor:vendor_id(id, store_name, email)
        ),
        order_notes(*),
        order_status_history(*),
        order_refunds(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceSupabase();

    // Build update object
    const updates: any = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.payment_status !== undefined)
      updates.payment_status = body.payment_status;
    if (body.fulfillment_status !== undefined)
      updates.fulfillment_status = body.fulfillment_status;
    if (body.tracking_number !== undefined)
      updates.tracking_number = body.tracking_number;
    if (body.tracking_url !== undefined)
      updates.tracking_url = body.tracking_url;
    if (body.shipping_carrier !== undefined)
      updates.shipping_carrier = body.shipping_carrier;
    if (body.internal_notes !== undefined)
      updates.internal_notes = body.internal_notes;

    // Update status dates
    if (body.status === "completed" && updates.status) {
      updates.completed_date = new Date().toISOString();
    }
    if (body.payment_status === "paid" && updates.payment_status) {
      updates.paid_date = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: updated,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
