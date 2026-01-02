import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { requireVendor } from "@/lib/auth/middleware";

interface Product {
  id: string;
  primary_category_id?: string;
  meta_data?: {
    pricing_mode?: string;
    pricing_tiers?: Array<{
      weight?: string;  // e.g. "1 gram", "3.5g (Eighth)"
      price: string | number;
      qty: number;
    }>;
  };
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Fetch available pricing tiers for categories based on actual product pricing tiers.
 * Extracts tier names from products' meta_data.pricing_tiers.
 *
 * Query params:
 * - vendor_id: Required. The vendor ID to fetch pricing for.
 * - categories: Optional. Comma-separated list of categories to filter by.
 *
 * Returns:
 * {
 *   success: boolean,
 *   tiers: {
 *     "Category Name": ["1g", "3.5g", "7g", "14g", "28g", ...],
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

    // Fetch products with their categories and pricing tiers
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        `
        id,
        primary_category_id,
        meta_data,
        categories!products_primary_category_id_fkey(id, name)
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
      if (process.env.NODE_ENV === "development") {
        logger.info("[category-pricing-tiers] No products found with pricing tiers");
      }
      return NextResponse.json({
        success: true,
        tiers: {},
      });
    }

    if (process.env.NODE_ENV === "development") {
      logger.info(`[category-pricing-tiers] Found ${products.length} products with pricing tiers`);
    }

    // ALSO fetch pricing tier templates for this vendor
    const { data: templates, error: templatesError } = await supabase
      .from("pricing_tier_templates")
      .select(
        `
        id,
        name,
        default_tiers,
        categories!pricing_tier_templates_category_id_fkey(id, name)
      `,
      )
      .eq("vendor_id", vendorId)
      .eq("is_active", true);

    if (templatesError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("[category-pricing-tiers] Error fetching templates:", templatesError);
      }
    }

    if (process.env.NODE_ENV === "development") {
      logger.info(`[category-pricing-tiers] Found ${templates?.length || 0} pricing tier templates`);
    }

    // Build map: category name -> Set of tier names
    const categoryToTiers = new Map<string, Set<string>>();

    for (const product of products as Product[]) {
      const category = Array.isArray(product.categories)
        ? product.categories[0]
        : product.categories;
      const categoryName = category?.name;
      if (!categoryName) continue;

      // Initialize set for this category
      if (!categoryToTiers.has(categoryName)) {
        categoryToTiers.set(categoryName, new Set<string>());
      }

      const tiersSet = categoryToTiers.get(categoryName)!;

      // Extract tier names from product's pricing_tiers
      const pricingTiers = product.meta_data?.pricing_tiers;
      if (pricingTiers && Array.isArray(pricingTiers)) {
        for (const tier of pricingTiers) {
          // Use 'weight' field as the tier name (e.g. "1 gram", "3.5g (Eighth)")
          if (tier.weight) {
            tiersSet.add(tier.weight);
          }
        }
      }
    }

    // Process pricing tier templates
    if (templates && templates.length > 0) {
      for (const template of templates as any[]) {
        const category = Array.isArray(template.categories)
          ? template.categories[0]
          : template.categories;
        const categoryName = category?.name;
        if (!categoryName) continue;

        // Initialize set for this category if it doesn't exist
        if (!categoryToTiers.has(categoryName)) {
          categoryToTiers.set(categoryName, new Set<string>());
        }

        const tiersSet = categoryToTiers.get(categoryName)!;

        // Extract tier labels from template's default_tiers
        const defaultTiers = template.default_tiers;
        if (defaultTiers && Array.isArray(defaultTiers)) {
          for (const tier of defaultTiers) {
            // Use 'label' field as the tier name (e.g. "1 gram", "3.5g (Eighth)", "1")
            if (tier.label) {
              tiersSet.add(tier.label);
            }
          }
        }
      }
    }

    // Convert Map to plain object with sorted arrays
    let result: Record<string, string[]> = {};
    categoryToTiers.forEach((tiersSet, categoryName) => {
      result[categoryName] = Array.from(tiersSet).sort();
    });

    if (process.env.NODE_ENV === "development") {
      logger.info(`[category-pricing-tiers] Result:`, result);
    }

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
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("[category-pricing-tiers] Unexpected error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
