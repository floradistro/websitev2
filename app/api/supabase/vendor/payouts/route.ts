import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = getServiceSupabase();

    let query = supabase.from("vendor_payouts").select("*").eq("vendor_id", vendorId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching payouts:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payouts: data || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
