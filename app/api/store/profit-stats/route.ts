import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET - Vendor profit statistics
 * Returns margin analysis, inventory value, and profitability metrics
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Use requireVendor to get vendor_id from authenticated session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Fetch all products with cost tracking
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, cost_price, regular_price, price, stock_quantity, margin_percentage")
      .eq("vendor_id", vendorId)
      .not("cost_price", "is", null)
      .gt("cost_price", 0);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching products for profit stats:", error);
      }
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          total_products_with_cost: 0,
          average_margin: 0,
          total_inventory_cost: 0,
          total_potential_profit: 0,
          low_margin_products: 0,
          high_margin_products: 0,
        },
      });
    }

    // Calculate statistics
    let totalMargin = 0;
    let totalInventoryCost = 0;
    let totalPotentialProfit = 0;
    let lowMarginCount = 0;
    let highMarginCount = 0;

    products.forEach((product) => {
      const costPrice = product.cost_price || 0;
      const sellingPrice = product.price || product.regular_price || 0;
      const stock = product.stock_quantity || 0;

      // Calculate margin
      let margin = 0;
      if (costPrice > 0 && sellingPrice > 0) {
        margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
      }

      totalMargin += margin;

      // Count margin categories
      if (margin < 25) lowMarginCount++;
      if (margin >= 40) highMarginCount++;

      // Calculate values
      const inventoryCost = costPrice * stock;
      const potentialProfit = (sellingPrice - costPrice) * stock;

      totalInventoryCost += inventoryCost;
      totalPotentialProfit += potentialProfit;
    });

    const averageMargin = products.length > 0 ? totalMargin / products.length : 0;

    const stats = {
      total_products_with_cost: products.length,
      average_margin: Math.round(averageMargin * 10) / 10, // Round to 1 decimal
      total_inventory_cost: Math.round(totalInventoryCost * 100) / 100,
      total_potential_profit: Math.round(totalPotentialProfit * 100) / 100,
      low_margin_products: lowMarginCount,
      high_margin_products: highMarginCount,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Profit stats error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch profit stats",
      },
      { status: 500 },
    );
  }
}
