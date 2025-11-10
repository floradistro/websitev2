import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Get base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

// Ultra-fast cached single product fetch with ALL data from Supabase
const getCachedProductComplete = unstable_cache(
  async (productId: string) => {
    try {
      const baseUrl = getBaseUrl();

      // Fetch ALL data in parallel from Supabase
      const [productRes, inventoryRes, locationsRes, reviewsRes, pricingRes] = await Promise.all([
        fetch(`${baseUrl}/api/supabase/products/${productId}`),
        fetch(`${baseUrl}/api/supabase/inventory?product_id=${productId}`),
        fetch(`${baseUrl}/api/supabase/locations`),
        fetch(`${baseUrl}/api/supabase/reviews?product_id=${productId}&status=approved`),
        fetch(`${baseUrl}/api/supabase/products/${productId}/pricing`).catch(() => ({ ok: false })),
      ]);

      const productData = await productRes.json();
      const inventoryData = await inventoryRes.json();
      const locationsData = await locationsRes.json();
      const reviewsData = await reviewsRes.json();

      // Handle pricing response - may be 404 or error
      let pricingData = { pricingTiers: [] };
      if (pricingRes.ok && "json" in pricingRes) {
        try {
          pricingData = await pricingRes.json();
        } catch (e) {
          pricingData = { pricingTiers: [] };
        }
      }

      // If product doesn't exist, return null
      if (!productData.success) {
        return null;
      }

      // Handle both single product response and array response
      const product = productData.product || productData.products?.[0];
      if (!product) {
        return null;
      }
      const locations = locationsData.locations || [];
      const inventory = inventoryData.inventory || [];

      // Map location names to inventory
      const locationMap = locations.reduce((acc: any, loc: any) => {
        acc[loc.id] = loc.name;
        return acc;
      }, {});

      // Enrich inventory with location names
      const enrichedInventory = inventory.map((inv: any) => ({
        ...inv,
        location_name: locationMap[inv.location_id] || null,
      }));

      // Calculate total stock
      const totalStock = enrichedInventory.reduce((sum: number, inv: any) => {
        return sum + parseFloat(inv.quantity || 0);
      }, 0);

      // Extract pricing tiers from Supabase vendor_pricing_tiers
      const pricingTiers =
        pricingData.pricingTiers || product.meta_data?._product_price_tiers || [];

      // Extract product fields from meta_data
      const transformedFields: any = {};
      if (product.meta_data) {
        Object.entries(product.meta_data).forEach(([key, value]) => {
          if (key.startsWith("_field_")) {
            const fieldName = key.replace("_field_", "");
            transformedFields[fieldName] = value;
          }
        });
      }

      return {
        product: {
          ...product,
          images: product.featured_image
            ? [{ src: product.featured_image, alt: product.name }]
            : [],
          gallery: product.image_gallery || [],
          total_sales: product.sales_count || 0,
        },
        inventory: enrichedInventory,
        locations: locations,
        pricingTiers: pricingTiers,
        productFields: {
          fields: transformedFields,
        },
        reviews: reviewsData.reviews || [],
        total_stock: totalStock,
        meta: {
          cached: true,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error(`Error fetching product ${productId}:`, err);
      }
      return null;
    }
  },
  ["product-complete-supabase"],
  { revalidate: 180, tags: ["product"] }, // 3 minutes cache
);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    // Get complete product data from cache
    const data = await getCachedProductComplete(id);

    if (!data) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    if (!err.message?.includes("404")) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Product API error:", err);
      }
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch product" },
      { status: 500 },
    );
  }
}
