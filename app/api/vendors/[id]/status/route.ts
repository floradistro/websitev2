import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET - Check vendor generation status
 * Used by polling in "generating" page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const vendorId = id;
    const supabase = getServiceSupabase();

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select(
        "id, store_name, slug, status, storefront_generated, storefront_generated_at",
      )
      .eq("id", vendorId)
      .single();

    if (error || !vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        store_name: vendor.store_name,
        slug: vendor.slug,
        status: vendor.status,
        storefront_generated: vendor.storefront_generated || false,
        storefront_generated_at: vendor.storefront_generated_at,
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Status check error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal error" },
      { status: 500 },
    );
  }
}
