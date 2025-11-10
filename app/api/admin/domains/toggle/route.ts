import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// POST - Toggle domain active status (admin)
export async function POST(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { domainId, isActive } = body;

    if (!domainId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("vendor_domains")
      .update({ is_active: isActive })
      .eq("id", domainId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Domain ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error toggling domain:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
