import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all products with their categories and pricing tiers
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        custom_fields,
        pricing_tiers
      `,
      )
      .eq("vendor_id", vendorId)
      .not("pricing_tiers", "is", null);

    if (error) throw error;

    // Organize pricing tiers by category
    const categoryPricing: Record<string, Set<string>> = {};

    products?.forEach((product) => {
      // Get category from custom_fields
      const category = product.custom_fields?.category || "Uncategorized";

      if (!categoryPricing[category]) {
        categoryPricing[category] = new Set();
      }

      // Add all available price breaks for this product
      if (product.pricing_tiers && typeof product.pricing_tiers === "object") {
        Object.keys(product.pricing_tiers).forEach((tier) => {
          categoryPricing[category].add(tier);
        });
      }
    });

    // Convert Sets to sorted arrays
    const result: Record<string, string[]> = {};
    Object.entries(categoryPricing).forEach(([category, tiers]) => {
      result[category] = Array.from(tiers).sort((a, b) => {
        // Custom sort: 1g, 3_5g, 7g, 14g, 28g, etc.
        const order = ["1g", "3_5g", "7g", "14g", "28g", "0_5g", "1_5g", "2g", "single", "pack"];
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });
    });

    return NextResponse.json({
      categoryPricing: result,
      totalCategories: Object.keys(result).length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching category pricing:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
