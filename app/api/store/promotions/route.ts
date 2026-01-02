import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET - List all promotions for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    // SECURITY: vendorId from JWT, query param ignored (Phase 4)

    const supabase = getServiceSupabase();

    const { data: promotions, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching promotions:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, promotions });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in GET promotions:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST - Create a new promotion
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const {
      vendor_id,
      name,
      description,
      promotion_type,
      discount_type,
      discount_value,
      target_product_ids,
      target_categories,
      target_tier_rules,
      start_time,
      end_time,
      days_of_week,
      time_of_day_start,
      time_of_day_end,
      badge_text,
      badge_color,
      show_original_price,
      priority,
      is_active,
    } = body;

    // SECURITY: vendorId from JWT, query param ignored (Phase 4)
    if (!name || !promotion_type || !discount_type || discount_value === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: promotion, error } = await supabase
      .from("promotions")
      .insert({
        vendor_id: vendorId,
        name,
        description: description || null,
        promotion_type,
        discount_type,
        discount_value,
        target_product_ids: target_product_ids || null,
        target_categories: target_categories || null,
        target_tier_rules: target_tier_rules || null,
        start_time: start_time || null,
        end_time: end_time || null,
        days_of_week: days_of_week || null,
        time_of_day_start: time_of_day_start || null,
        time_of_day_end: time_of_day_end || null,
        badge_text: badge_text || null,
        badge_color: badge_color || "red",
        show_original_price: show_original_price !== false,
        priority: priority || 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating promotion:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST promotion:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH - Update an existing promotion
 */
export async function PATCH(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Promotion ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: promotion, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error updating promotion:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in PATCH promotion:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE - Delete a promotion
 */
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Promotion ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase.from("promotions").delete().eq("id", id);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting promotion:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in DELETE promotion:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
