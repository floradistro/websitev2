import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * POST - Create new vendor
 * Used during onboarding flow
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const formData = await request.json();
    const supabase = getServiceSupabase();

    // Validate required fields
    if (!formData.store_name || !formData.slug || !formData.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: store_name, slug, email",
        },
        { status: 400 },
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", formData.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Slug already taken. Please choose a different URL.",
        },
        { status: 409 },
      );
    }

    // Create vendor
    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert({
        store_name: formData.store_name,
        slug: formData.slug,
        email: formData.email,
        store_tagline: formData.store_tagline || "",
        vendor_type: formData.vendor_type || "retail",
        status: "pending", // Will change to 'active' after generation
        brand_colors: formData.brand_colors || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating vendor:", error);
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Vendor creation error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal error" },
      { status: 500 },
    );
  }
}
