import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Public API endpoint for TV displays to fetch vendor info
 * Uses service role to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendor_id required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("id, store_name, logo_url")
      .eq("id", vendorId)
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching vendor:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ TV Display vendor API error:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
