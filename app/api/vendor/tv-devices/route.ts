import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET /api/vendor/tv-devices?vendor_id=xxx
 * List all TV devices for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Vendor ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: devices, error } = await supabase
      .from("tv_devices")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("tv_number");

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching TV devices:", err);
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      devices: devices || [],
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("TV devices GET error:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
