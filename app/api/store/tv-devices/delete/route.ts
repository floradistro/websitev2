import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { requireVendor } from "@/lib/auth/middleware";
export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Device ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Delete the device
    const { error } = await supabase.from("tv_devices").delete().eq("id", deviceId);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting device:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in delete device API:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
