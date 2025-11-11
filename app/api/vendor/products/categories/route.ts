import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get categories with product counts for this vendor
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select(`
        id,
        name,
        slug,
        products!products_primary_category_id_fkey(id)
      `)
      .eq("products.vendor_id", vendorId)
      .order("name");

    if (categoriesError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching vendor categories:", categoriesError);
      }
      return NextResponse.json(
        { success: false, error: categoriesError.message },
        { status: 500 },
      );
    }

    // Transform to include product count
    const categories = (categoriesData || [])
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: Array.isArray(cat.products) ? cat.products.length : 0,
      }))
      .filter((cat) => cat.count > 0); // Only show categories with products

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Error in categories API:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
