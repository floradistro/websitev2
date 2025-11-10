import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Dynamically fetch available pricing tiers for categories based on actual pricing blueprints.
 * Uses price_breaks from pricing_tier_blueprints to extract available tier names (break_ids).
 *
 * Query params:
 * - vendor_id: Required. The vendor ID to fetch pricing for.
 * - categories: Optional. Comma-separated list of categories to filter by.
 *
 * Returns:
 * {
 *   success: boolean,
 *   tiers: {
 *     "Category Name": ["tier1", "tier2", ...],
 *     ...
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendor_id");
    const categoriesParam = searchParams.get("categories");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendor_id is required" }, { status: 400 });
    }

    const requestedCategories = categoriesParam
      ? categoriesParam.split(",").map((c) => c.trim())
      : [];
    const supabase = getServiceSupabase();

    // Fetch products with their pricing blueprint assignments for this vendor
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        `
        id,
        primary_category_id,
        categories!products_primary_category_id_fkey(id, name),
        product_pricing_assignments(
          pricing_tier_blueprints(
            id,
            name,
            price_breaks
          )
        )
      `,
      )
      .eq("vendor_id", vendorId);

    if (productsError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("[category-pricing-tiers] Error fetching products:", productsError);
      }
      return NextResponse.json({ success: false, error: productsError.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        tiers: {},
      });
    }

    // Build map: category name -> Set of tier names (break_ids)
    const categoryToTiers = new Map<string, Set<string>>();

    for (const product of products) {
      const category = product.categories as any;
      const categoryName = category?.name;
      if (!categoryName) continue;

      // Initialize set for this category
      if (!categoryToTiers.has(categoryName)) {
        categoryToTiers.set(categoryName, new Set<string>());
      }

      const tiersSet = categoryToTiers.get(categoryName)!;

      // Extract tier names (break_ids) from pricing blueprints
      const assignments = product.product_pricing_assignments || [];
      for (const assignment of assignments) {
        const blueprint = assignment.pricing_tier_blueprints as any;
        if (!blueprint?.price_breaks || !Array.isArray(blueprint.price_breaks)) {
          continue;
        }

        // price_breaks is an array like:
        // [{"break_id": "1", "label": "1", "qty": 1, "unit": "unit", "sort_order": 1}, ...]
        for (const priceBreak of blueprint.price_breaks) {
          if (priceBreak.break_id) {
            tiersSet.add(priceBreak.break_id);
          }
        }
      }
    }

    // Convert Map to plain object with sorted arrays
    let result: Record<string, string[]> = {};
    categoryToTiers.forEach((tiersSet, categoryName) => {
      result[categoryName] = Array.from(tiersSet).sort();
    });

    // Filter by requested categories if provided
    if (requestedCategories.length > 0) {
      const filtered: Record<string, string[]> = {};
      for (const category of requestedCategories) {
        // Case-insensitive lookup
        const matchingKey = Object.keys(result).find(
          (key) => key.toLowerCase() === category.toLowerCase(),
        );
        if (matchingKey && result[matchingKey]) {
          filtered[matchingKey] = result[matchingKey];
        }
      }
      result = filtered;
    }

    return NextResponse.json({
      success: true,
      tiers: result,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("[category-pricing-tiers] Unexpected error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
