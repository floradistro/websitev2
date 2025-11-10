import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const vendorId = searchParams.get("vendor_id");

    const supabase = getServiceSupabase();

    let query = supabase.from("vendors").select("*").eq("status", "active");

    if (slug) {
      query = query.eq("slug", slug);
    } else if (vendorId) {
      query = query.eq("id", vendorId);
    }

    const { data, error } = slug || vendorId ? await query.single() : await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      vendors: slug || vendorId ? [data] : data,
      vendor: slug || vendorId ? data : null,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching vendors:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
