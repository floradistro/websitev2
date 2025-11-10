import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Get product to find vendor_id
    let productQuery = supabase
      .from("products")
      .select("vendor_id")
      .eq("id", productId);

    const { data: product, error: productError } = await productQuery.single();

    if (productError || !product) {
      return NextResponse.json({
        success: true,
        pricingTiers: [],
      });
    }

    // If product has no vendor, return empty tiers
    if (!product.vendor_id) {
      return NextResponse.json({
        success: true,
        pricingTiers: [],
      });
    }

    // Get ALL vendor pricing configs (auto-applies to all vendor products)
    const { data: vendorConfigs, error: configError } = await supabase
      .from("vendor_pricing_configs")
      .select(
        `
        *,
        blueprint:pricing_tier_blueprints (
          id,
          name,
          slug,
          tier_type,
          price_breaks
        )
      `,
      )
      .eq("vendor_id", product.vendor_id)
      .eq("is_active", true);

    if (configError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching pricing configs:", configError);
      }
      return NextResponse.json({
        success: true,
        pricingTiers: [],
      });
    }

    const configs = vendorConfigs || [];

    // Transform vendor pricing configs to pricing tiers format
    const pricingTiers: any[] = [];

    if (configs && configs.length > 0) {
      // Use retail pricing by default (weight-based with grams)
      const weightBasedConfigs = configs.filter(
        (c: any) => c.blueprint?.tier_type === "weight",
      );
      const primaryConfig = weightBasedConfigs[0] || configs[0];

      if (primaryConfig) {
        const blueprint = primaryConfig.blueprint;
        const pricingValues = primaryConfig.pricing_values || {};

        if (
          blueprint &&
          blueprint.price_breaks &&
          Array.isArray(blueprint.price_breaks)
        ) {
          blueprint.price_breaks.forEach((priceBreak: any) => {
            const breakId = priceBreak.break_id;
            const vendorPrice = pricingValues[breakId];

            // Only add if tier is ENABLED and has a price
            if (
              vendorPrice &&
              vendorPrice.enabled !== false &&
              vendorPrice.price
            ) {
              pricingTiers.push({
                weight:
                  priceBreak.label ||
                  `${priceBreak.qty}${priceBreak.unit || ""}`,
                qty: priceBreak.qty || 1,
                price: parseFloat(vendorPrice.price),
                tier_name: priceBreak.label,
                break_id: breakId,
                blueprint_name: blueprint.name,
                sort_order: priceBreak.sort_order || 0,
              });
            } else {
            }
          });
        }
      }

      // Sort by sort_order
      pricingTiers.sort((a, b) => a.sort_order - b.sort_order);
    }

    return NextResponse.json({
      success: true,
      pricingTiers: pricingTiers,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching product pricing:", error);
    }
    return NextResponse.json(
      { success: true, pricingTiers: [] }, // Return empty instead of error to not break product page
      { status: 200 },
    );
  }
}
