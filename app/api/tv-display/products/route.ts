import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Public API endpoint for TV displays to fetch products
 * Uses service role to bypass RLS
 * CRITICAL: NO CACHING - TV menus must be live and instant
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendor_id");
    const locationId = searchParams.get("location_id");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendor_id required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch products with all necessary relationships (simplified pricing)
    // NOTE: We fetch ALL inventory records and filter in JavaScript below
    // Using .eq('inventory.location_id') would exclude products without inventory records entirely
    const query = supabase
      .from("products")
      .select(
        `
        *,
        primary_category:categories!primary_category_id(
          id,
          name,
          slug,
          parent_id
        ),
        inventory!product_id(
          id,
          quantity,
          location_id
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .eq("status", "published")
      .order("name");

    const { data: products, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching TV display products:", err);
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    // Fetch parent categories for products that have a parent_id
    const parentIds = new Set(
      (products || [])
        .map((p: any) => p.primary_category?.parent_id)
        .filter((id: string | null) => id !== null),
    );

    let parentCategoriesMap = new Map();
    if (parentIds.size > 0) {
      const { data: parentCategories } = await supabase
        .from("categories")
        .select("id, name, slug")
        .in("id", Array.from(parentIds));

      parentCategoriesMap = new Map((parentCategories || []).map((cat: any) => [cat.id, cat]));
    }

    // Enrich products with parent category data
    const productsWithParents = (products || []).map((product: any) => {
      if (product.primary_category?.parent_id) {
        const parentCategory = parentCategoriesMap.get(product.primary_category.parent_id);
        return {
          ...product,
          primary_category: {
            ...product.primary_category,
            parent_category: parentCategory || null,
          },
        };
      }
      return product;
    });

    // Transform products to add pricing_tiers field from embedded pricing_data
    const productsWithPricing = (productsWithParents || []).map((product: any) => {
      // Get pricing from embedded pricing_data (new simplified system)
      const pricingData = product.pricing_data || {};

      // Convert tiers to the format expected by TV display
      const pricingTiers: any[] = (pricingData.tiers || [])
        .filter((tier: any) => tier.enabled !== false && tier.price) // Only enabled tiers with prices
        .map((tier: any) => ({
          [tier.id]: {
            price: parseFloat(tier.price),
            label: tier.label,
            quantity: tier.quantity || 1,
            unit: tier.unit || "g",
            enabled: tier.enabled !== false,
          },
        }))
        .reduce((acc: any, tier: any) => ({ ...acc, ...tier }), {});

      // If no tiers, fall back to single price
      const pricing_tiers =
        Object.keys(pricingTiers).length > 0
          ? pricingTiers
          : product.regular_price
            ? {
                single: {
                  price: parseFloat(product.regular_price),
                  label: "Single Price",
                  quantity: 1,
                  enabled: true,
                },
              }
            : {};

      return {
        ...product,
        pricing_tiers,
      };
    });

    // Filter products to only show those with inventory > 0 at this location
    let filteredProducts = productsWithPricing || [];

    if (locationId && filteredProducts.length > 0) {
      filteredProducts = filteredProducts.filter((product: any) => {
        // Check if product has inventory items for this location
        const locationInventory = product.inventory?.find(
          (inv: any) => inv.location_id === locationId && inv.quantity > 0,
        );
        return !!locationInventory;
      });
    } else {
    }

    const response = NextResponse.json({
      success: true,
      products: filteredProducts,
    });

    // CRITICAL: Disable ALL caching - TV menus must be live
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ TV Display products API error:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
