import { getServiceSupabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET /api/vendor/inventory/low-stock
 * Returns products with inventory below reorder threshold
 *
 * Query params:
 * - vendor_id (required): Vendor UUID
 * - location_id (optional): Filter by location
 * - threshold (optional): Custom threshold (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const vendorId = searchParams.get("vendor_id");
    const locationId = searchParams.get("location_id");
    const threshold = parseInt(searchParams.get("threshold") || "10", 10);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "vendor_id parameter is required" },
        { status: 400 },
      );
    }

    // Build query for low stock products
    let query = supabase
      .from("inventory")
      .select(
        `
        id,
        product_id,
        location_id,
        quantity,
        available_quantity,
        reserved_quantity,
        stock_status,
        reorder_point,
        products (
          id,
          name,
          sku,
          slug,
          featured_image,
          cost_price,
          regular_price,
          primary_category_id,
          categories:primary_category_id (
            name
          )
        ),
        locations (
          id,
          name,
          address_line1,
          city,
          state
        )
      `,
      )
      .eq("products.vendor_id", vendorId);

    // Apply location filter if provided
    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data: inventoryData, error: inventoryError } = await query;

    if (inventoryError) {
      throw new Error(inventoryError.message);
    }

    // Filter for low stock items
    const lowStockItems =
      inventoryData
        ?.filter((item) => {
          const reorderPoint = item.reorder_point || threshold;
          return (
            item.available_quantity <= reorderPoint && item.products && item.products.length > 0
          );
        })
        .map((item) => ({
          inventory_id: item.id,
          product_id: item.product_id,
          product: item.products[0],
          location: item.locations,
          quantity: item.quantity,
          available_quantity: item.available_quantity,
          reserved_quantity: item.reserved_quantity,
          stock_status: item.stock_status,
          reorder_point: item.reorder_point || threshold,
          urgency:
            item.available_quantity <= 0
              ? "critical"
              : item.available_quantity <= (item.reorder_point || threshold) / 2
                ? "high"
                : "medium",
        })) || [];

    // Sort by urgency and then by available quantity
    const urgencyOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
    };
    lowStockItems.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return a.available_quantity - b.available_quantity;
    });

    // Calculate statistics
    const stats = {
      total_low_stock: lowStockItems.length,
      critical: lowStockItems.filter((i) => i.urgency === "critical").length,
      high: lowStockItems.filter((i) => i.urgency === "high").length,
      medium: lowStockItems.filter((i) => i.urgency === "medium").length,
      total_value_at_risk: lowStockItems.reduce((sum, item) => {
        return sum + (item.product.cost_price || 0) * item.available_quantity;
      }, 0),
    };

    return NextResponse.json({
      success: true,
      low_stock_items: lowStockItems,
      stats,
      threshold_used: threshold,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching low stock items:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch low stock items",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/vendor/inventory/low-stock
 * Update reorder points for products
 *
 * Request body:
 * - inventory_id: UUID
 * - reorder_point: number
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const { inventory_id, reorder_point } = body;

    if (!inventory_id) {
      return NextResponse.json(
        { success: false, error: "inventory_id is required" },
        { status: 400 },
      );
    }

    if (typeof reorder_point !== "number" || reorder_point < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "reorder_point must be a non-negative number",
        },
        { status: 400 },
      );
    }

    // Update reorder point
    const { data, error } = await supabase
      .from("inventory")
      .update({ reorder_point })
      .eq("id", inventory_id)
      .select(
        `
        id,
        product_id,
        quantity,
        available_quantity,
        reorder_point,
        products (
          name,
          sku
        )
      `,
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      inventory: data,
      message: `Reorder point updated to ${reorder_point}`,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error updating reorder point:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to update reorder point",
      },
      { status: 500 },
    );
  }
}
