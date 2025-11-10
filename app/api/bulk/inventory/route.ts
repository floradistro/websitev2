import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
/**
 * Bulk Inventory API - Fast inventory lookups
 * POST /api/bulk/inventory
 * Body: { product_ids: [...], location_ids: [...] }
 *
 * NOTE: Inventory is sensitive data - require authentication
 */

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication - inventory is sensitive data
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { product_ids, location_ids, vendor_id } = await request.json();

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: product_ids array required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    let query = supabase
      .from("inventory")
      .select(
        `
        id,
        product_id,
        location_id,
        quantity,
        reserved_quantity,
        available_quantity,
        stock_status,
        low_stock_threshold,
        sku,
        product:products!product_id(id, name, sku),
        location:locations!location_id(id, name, slug)
      `,
      )
      .in("product_id", product_ids);

    if (location_ids && Array.isArray(location_ids) && location_ids.length > 0) {
      query = query.in("location_id", location_ids);
    }

    if (vendor_id) {
      query = query.eq("vendor_id", vendor_id);
    }

    const { data: inventory, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Bulk inventory error:", error);
      }
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }

    // Group by product_id for easy lookup
    const inventoryByProduct = new Map<string, any[]>();
    inventory?.forEach((inv) => {
      const existing = inventoryByProduct.get(inv.product_id) || [];
      existing.push(inv);
      inventoryByProduct.set(inv.product_id, existing);
    });

    return NextResponse.json(
      {
        inventory: inventory || [],
        by_product: Object.fromEntries(inventoryByProduct),
        count: inventory?.length || 0,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15",
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Bulk inventory error:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET bulk inventory by location
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require authentication - inventory is sensitive data
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const vendorId = searchParams.get("vendor_id");
    const lowStock = searchParams.get("low_stock") === "true";

    if (!locationId && !vendorId) {
      return NextResponse.json({ error: "location_id or vendor_id required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    let query = supabase.from("inventory").select(`
        *,
        product:products!product_id(id, name, sku, featured_image),
        location:locations!location_id(id, name, slug)
      `);

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    if (lowStock) {
      query = query.lt("quantity", "low_stock_threshold");
    }

    const { data: inventory, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Bulk inventory error:", error);
      }
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }

    return NextResponse.json(
      {
        inventory: inventory || [],
        count: inventory?.length || 0,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15",
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Bulk inventory error:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
