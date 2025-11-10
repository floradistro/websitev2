import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { productId, mediaFilePath } = body;

    if (!productId || !mediaFilePath) {
      return NextResponse.json(
        { error: "Product ID and media file path required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Update product with featured image
    const { error: updateError } = await supabase
      .from("products")
      .update({
        featured_image_storage: mediaFilePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("vendor_id", vendorId);

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Link error:", updateError);
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Product image linked successfully",
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Unlink product image
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error: updateError } = await supabase
      .from("products")
      .update({
        featured_image_storage: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("vendor_id", vendorId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Product image unlinked",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
