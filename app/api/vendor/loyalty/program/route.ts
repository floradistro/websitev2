import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/vendor/loyalty/program
 * Get loyalty program settings for vendor
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  const supabase = getServiceSupabase();

  try {
    const { data: program, error } = await supabase
      .from("loyalty_programs")
      .select("*")
      .eq("vendor_id", vendorId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Failed to fetch loyalty program:", error);
      return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
    }

    return NextResponse.json({ program: program || null });
  } catch (error) {
    logger.error("Loyalty program fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/vendor/loyalty/program
 * Update loyalty program settings
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const {
      name,
      description,
      points_per_dollar,
      point_value,
      min_redemption_points,
      points_expiry_days,
      tiers,
      allow_points_on_discounted_items,
      points_on_tax,
      is_active,
    } = body;

    // Validate
    if (!name || points_per_dollar < 0 || point_value < 0) {
      return NextResponse.json({ error: "Invalid program settings" }, { status: 400 });
    }

    // Check if program exists
    const { data: existing } = await supabase
      .from("loyalty_programs")
      .select("id")
      .eq("vendor_id", vendorId)
      .single();

    if (existing) {
      // Update
      const { error: updateError } = await supabase
        .from("loyalty_programs")
        .update({
          name,
          description,
          points_per_dollar,
          point_value,
          min_redemption_points,
          points_expiry_days,
          tiers,
          allow_points_on_discounted_items,
          points_on_tax,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        logger.error("Failed to update loyalty program:", updateError);
        return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
      }
    } else {
      // Create
      const { error: createError } = await supabase.from("loyalty_programs").insert({
        vendor_id: vendorId,
        name,
        description,
        points_per_dollar,
        point_value,
        min_redemption_points,
        points_expiry_days,
        tiers,
        allow_points_on_discounted_items,
        points_on_tax,
        is_active,
      });

      if (createError) {
        logger.error("Failed to create loyalty program:", createError);
        return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Program updated successfully" });
  } catch (error) {
    logger.error("Loyalty program update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
