/**
 * API: Vendor Template Imports
 * GET - Get all templates imported by a vendor
import { requireAdmin } from "@/lib/auth/middleware";
 */

import { NextRequest, NextResponse } from "next/server";
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
    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: imports, error } = await supabase
      .from("vendor_template_imports")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("imported_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      imports: imports || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Get template imports error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch imports" },
      { status: 500 },
    );
  }
}
