import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
/**
 * GET /api/schemas/presets
 * Get all style presets
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    const supabase = getServiceSupabase();

    let query = supabase
      .from("style_presets")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data: presets, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, presets });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching style presets:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/schemas/presets/apply
 * Apply a style preset to a vendor's section
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { preset_id, section_id, apply_globally } = await request.json();

    if (!preset_id) {
      return NextResponse.json({ error: "preset_id required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get the preset
    const { data: preset, error: presetError } = await supabase
      .from("style_presets")
      .select("*")
      .eq("id", preset_id)
      .single();

    if (presetError || !preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    if (apply_globally) {
      // Apply to all vendor sections
      const { data: sections } = await supabase
        .from("vendor_storefront_sections")
        .select("id")
        .eq("vendor_id", vendorId);

      if (sections) {
        for (const section of sections) {
          await supabase.from("vendor_applied_styles").upsert({
            vendor_id: vendorId,
            section_id: section.id,
            preset_id: preset_id,
          });
        }
      }
    } else if (section_id) {
      // Apply to specific section
      await supabase.from("vendor_applied_styles").upsert({
        vendor_id: vendorId,
        section_id: section_id,
        preset_id: preset_id,
      });
    }

    // Increment usage count
    await supabase
      .from("style_presets")
      .update({ usage_count: (preset.usage_count || 0) + 1 })
      .eq("id", preset_id);

    return NextResponse.json({
      success: true,
      message: "Style preset applied successfully",
      preset: preset,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error applying style preset:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
