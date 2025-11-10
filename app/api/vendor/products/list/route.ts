import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // 'needs_images' | 'has_images' | 'all'
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const supabase = getServiceSupabase();

    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        sku,
        featured_image_storage,
        primary_category_id,
        categories!products_primary_category_id_fkey (
          id,
          name,
          slug
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .order("name", { ascending: true });

    // Apply filters
    if (filter === "needs_images") {
      query = query.or("featured_image_storage.is.null,featured_image_storage.eq.");
    } else if (filter === "has_images") {
      query = query.not("featured_image_storage", "is", null);
      query = query.not("featured_image_storage", "eq", "");
    }

    if (category) {
      query = query.eq("categories.slug", category);
    }

    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Products fetch error:", err);
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Transform to include category info
    const transformedProducts = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      featured_image_storage: p.featured_image_storage,
      category: p.categories
        ? {
            id: p.categories.id,
            name: p.categories.name,
            slug: p.categories.slug,
          }
        : null,
      has_image: !!(p.featured_image_storage && p.featured_image_storage !== ""),
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total: transformedProducts.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
