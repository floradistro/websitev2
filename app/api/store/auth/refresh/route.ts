import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { withErrorHandler } from "@/lib/api-handler";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Refresh vendor data from database (for updating logo, POS status, etc without re-login)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Vendor ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch fresh vendor data
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single();

    if (error || !vendor) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        store_name: vendor.store_name,
        slug: vendor.slug,
        email: vendor.email,
        vendor_type: vendor.vendor_type || "standard",
        wholesale_enabled: vendor.wholesale_enabled || false,
        logo_url: vendor.logo_url,
        pos_enabled: vendor.pos_enabled || false,
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Vendor refresh error:", err);
    }
    return NextResponse.json(
      { success: false, error: "Failed to refresh vendor data" },
      { status: 500 },
    );
  }
});
