import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const productName = searchParams.get("name") || "101 Runtz";

    const supabase = getServiceSupabase();

    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, featured_image_storage, image_gallery_storage")
      .eq("vendor_id", vendorId)
      .eq("name", productName)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product,
      debug: {
        hasFeaturedImage: !!product?.featured_image_storage,
        featuredImageValue: product?.featured_image_storage,
        galleryImages: product?.image_gallery_storage,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
