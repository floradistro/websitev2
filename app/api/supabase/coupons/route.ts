import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const activeOnly = searchParams.get("active") === "true";

    const supabase = getServiceSupabase();

    let query = supabase.from("coupons").select("*");

    if (code) {
      query = query.eq("code", code.toUpperCase());
    }

    if (activeOnly) {
      query = query
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching coupons:", err);
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coupons: data || [],
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      code,
      description,
      discount_type,
      discount_amount,
      free_shipping = false,
      minimum_amount,
      maximum_amount,
      usage_limit,
      usage_limit_per_user = 1,
      individual_use = false,
      exclude_sale_items = false,
      start_date,
      end_date,
      allowed_products = [],
      excluded_products = [],
      allowed_categories = [],
      excluded_categories = [],
      allowed_emails = [],
    } = body;

    if (!code || !discount_type || discount_amount === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: code, discount_type, discount_amount",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .insert({
        code: code.toUpperCase(),
        description,
        discount_type,
        discount_amount: parseFloat(discount_amount),
        free_shipping,
        minimum_amount: minimum_amount ? parseFloat(minimum_amount) : null,
        maximum_amount: maximum_amount ? parseFloat(maximum_amount) : null,
        usage_limit: usage_limit ? parseInt(usage_limit) : null,
        usage_limit_per_user: parseInt(usage_limit_per_user),
        individual_use,
        exclude_sale_items,
        start_date,
        end_date,
        allowed_products,
        excluded_products,
        allowed_categories,
        excluded_categories,
        allowed_emails,
        is_active: true,
      })
      .select()
      .single();

    if (couponError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating coupon:", couponError);
      }
      return NextResponse.json({ error: couponError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
