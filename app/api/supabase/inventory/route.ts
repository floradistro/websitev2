import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { inventoryCache, generateCacheKey } from "@/lib/cache-manager";

/**
 * Get inventory for a product or vendor
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const vendorId = searchParams.get("vendor_id");
    const locationId = searchParams.get("location_id");

    if (!productId && !vendorId) {
      return NextResponse.json(
        { error: "product_id or vendor_id required" },
        { status: 400 },
      );
    }

    // Generate cache key
    const cacheKey = generateCacheKey("inventory", {
      productId: productId || "none",
      vendorId: vendorId || "none",
      locationId: locationId || "none",
    });

    // Check cache
    const cached = inventoryCache.get(cacheKey);
    if (cached) {
      const duration = performance.now() - startTime;
      return NextResponse.json(cached, {
        headers: {
          "X-Cache-Status": "HIT",
          "X-Response-Time": `${duration.toFixed(2)}ms`,
        },
      });
    }

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase.from("inventory").select(`
        *,
        location:locations(id, name, city, state),
        product:products(id, name, featured_image_storage, image_gallery_storage)
      `);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data: inventory, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching inventory:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = {
      success: true,
      inventory: inventory || [],
    };

    // Cache the result
    inventoryCache.set(cacheKey, response);

    const duration = performance.now() - startTime;

    return NextResponse.json(response, {
      headers: {
        "X-Cache-Status": "MISS",
        "X-Response-Time": `${duration.toFixed(2)}ms`,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Inventory API error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
