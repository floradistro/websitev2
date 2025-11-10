import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET /api/display-groups/membership?device_id=xxx
 * Check if a device is part of a display group
 */
export async function GET(request: NextRequest) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Device ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if this device is part of a display group
    const { data: membershipData, error: memberError } = await supabase
      .from("tv_display_group_members")
      .select(
        `
        *,
        group:tv_display_groups(*)
      `,
      )
      .eq("device_id", deviceId);

    if (memberError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error checking group membership:", memberError);
      }
      return NextResponse.json({ success: false, error: memberError.message }, { status: 500 });
    }

    // Check if any results were returned
    if (!membershipData || membershipData.length === 0) {
      return NextResponse.json({
        success: true,
        isMember: false,
        group: null,
        member: null,
      });
    }

    // Return the first match
    const membership = membershipData[0];

    return NextResponse.json({
      success: true,
      isMember: true,
      group: membership.group,
      member: membership,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Group membership GET error:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
