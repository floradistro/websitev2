import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Vendor ID is required" }, { status: 400 });
    }

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching vendor:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("GET /api/vendors/[id] error:", error);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
