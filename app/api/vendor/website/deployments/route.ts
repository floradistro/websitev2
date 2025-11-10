import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
/**
 * GET /api/vendor/website/deployments
 * Get recent deployments for vendor
 */
export async function GET(request: NextRequest) {
  try {
    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get recent deployments
    const { data: deployments, error } = await supabase
      .from("vendor_deployments")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching deployments:", error);
      }
      return NextResponse.json(
        { success: false, error: "Failed to fetch deployments" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: deployments || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in deployments endpoint:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch deployments",
      },
      { status: 500 },
    );
  }
}
