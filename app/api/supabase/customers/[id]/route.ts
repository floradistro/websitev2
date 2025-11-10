import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Require vendor authentication - Critical fix from Apple Assessment
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("customers")
      .select(
        `
        *,
        addresses:customer_addresses(*),
        notes:customer_notes(*),
        loyalty:loyalty_transactions(*)
      `,
      )
      .eq("id", id)
      .eq("vendor_id", vendorId) // SECURITY: Only return if customer belongs to this vendor
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: data,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Require vendor authentication - Critical fix from Apple Assessment
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceSupabase();

    // Build update object
    const updates: any = {};

    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.billing_address !== undefined) updates.billing_address = body.billing_address;
    if (body.shipping_address !== undefined) updates.shipping_address = body.shipping_address;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.marketing_opt_in !== undefined) updates.marketing_opt_in = body.marketing_opt_in;
    if (body.email_notifications !== undefined)
      updates.email_notifications = body.email_notifications;
    if (body.sms_notifications !== undefined) updates.sms_notifications = body.sms_notifications;

    const { data: updated, error: updateError } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .eq("vendor_id", vendorId) // SECURITY: Only update if customer belongs to this vendor
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customer: updated,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
