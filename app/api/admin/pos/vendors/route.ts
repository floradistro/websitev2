import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/middleware";
/**
 * GET - Get all vendors with their POS status
 */
export async function GET(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = getServiceSupabase();

    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("id, store_name, slug, logo_url, email, status, pos_enabled")
      .order("store_name");

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching vendors:", error);
      }
      return NextResponse.json(
        { success: false, error: "Failed to fetch vendors" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      vendors,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Get vendors error:", err);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH - Update vendor POS status
 */
export async function PATCH(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { vendorId, pos_enabled } = body;

    if (!vendorId || typeof pos_enabled !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor ID and pos_enabled (boolean) are required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: vendor, error } = await supabase
      .from("vendors")
      .update({ pos_enabled, updated_at: new Date().toISOString() })
      .eq("id", vendorId)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error updating vendor POS status:", error);
      }
      return NextResponse.json(
        { success: false, error: "Failed to update vendor POS status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
      message: `POS ${pos_enabled ? "enabled" : "disabled"} for ${vendor.store_name}`,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Update vendor POS error:", err);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
