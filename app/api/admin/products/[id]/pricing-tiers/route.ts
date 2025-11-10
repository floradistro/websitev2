import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Get pricing tiers for a product
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: productId } = await params;

    const { data: tiers, error } = await supabase
      .from("wholesale_pricing")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("minimum_quantity", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Get tiers error:", err);
      }
      return NextResponse.json(
        { error: "Failed to get pricing tiers", details: err.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ tiers: tiers || [] });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Get pricing tiers error:", err);
    }
    return NextResponse.json(
      { error: "Failed to get pricing tiers", details: err.message },
      { status: 500 },
    );
  }
}

/**
 * Update pricing tiers for a product
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: productId } = await params;
    const body = await request.json();

    const { tiers } = body;

    if (!Array.isArray(tiers)) {
      return NextResponse.json({ error: "Tiers must be an array" }, { status: 400 });
    }

    // Get product to get vendor_id
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("vendor_id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete existing tiers
    await supabase.from("wholesale_pricing").delete().eq("product_id", productId);

    // Insert new tiers
    if (tiers.length > 0) {
      const tiersToInsert = tiers.map((tier) => ({
        product_id: productId,
        vendor_id: product.vendor_id,
        tier_name: tier.tier_name,
        minimum_quantity: tier.minimum_quantity,
        unit_price: tier.unit_price,
        discount_percentage: tier.discount_percentage,
        is_active: true,
      }));

      const { error: insertError } = await supabase.from("wholesale_pricing").insert(tiersToInsert);

      if (insertError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Insert tiers error:", insertError);
        }
        return NextResponse.json(
          {
            error: "Failed to insert pricing tiers",
            details: insertError.message,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${tiers.length} pricing tiers`,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Update pricing tiers error:", err);
    }
    return NextResponse.json(
      { error: "Failed to update pricing tiers", details: err.message },
      { status: 500 },
    );
  }
}
