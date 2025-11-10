import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, customer_id, cart_total, product_ids = [] } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Get coupon
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !coupon) {
      return NextResponse.json({
        valid: false,
        error: "Coupon not found",
      });
    }

    // Validate coupon
    const now = new Date();
    const errors = [];

    // Check if active
    if (!coupon.is_active) {
      errors.push("Coupon is not active");
    }

    // Check dates
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      errors.push("Coupon not yet valid");
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      errors.push("Coupon has expired");
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      errors.push("Coupon usage limit reached");
    }

    // Check per-user usage limit
    if (customer_id && coupon.usage_limit_per_user) {
      const { data: usageData } = await supabase
        .from("coupon_usage")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("customer_id", customer_id);

      if (usageData && usageData.length >= coupon.usage_limit_per_user) {
        errors.push("You have already used this coupon");
      }
    }

    // Check minimum amount
    if (coupon.minimum_amount && cart_total < coupon.minimum_amount) {
      errors.push(`Minimum cart total of $${coupon.minimum_amount} required`);
    }

    // Check maximum amount
    if (coupon.maximum_amount && cart_total > coupon.maximum_amount) {
      errors.push(`Maximum cart total of $${coupon.maximum_amount} exceeded`);
    }

    // Check email restrictions
    if (
      coupon.allowed_emails &&
      coupon.allowed_emails.length > 0 &&
      customer_id
    ) {
      const { data: customer } = await supabase
        .from("customers")
        .select("email")
        .eq("id", customer_id)
        .single();

      if (customer && !coupon.allowed_emails.includes(customer.email)) {
        errors.push("This coupon is not valid for your email");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors,
      });
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.discount_type === "percentage") {
      discountAmount = (cart_total * coupon.discount_amount) / 100;
    } else if (coupon.discount_type === "fixed_cart") {
      discountAmount = coupon.discount_amount;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_amount: coupon.discount_amount,
        free_shipping: coupon.free_shipping,
      },
      discount_amount: discountAmount,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
