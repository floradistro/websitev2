import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Get wholesale products
 * Only accessible to vendors and wholesale-approved customers
 */
export async function GET(request: NextRequest) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const vendorId = searchParams.get("vendorId");
    const search = searchParams.get("search");
    const wholesaleOnly = searchParams.get("wholesaleOnly") === "true";

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("products")
      .select(
        `
        *,
        vendor:vendors(
          id,
          store_name,
          slug,
          vendor_type
        ),
        category:categories!primary_category_id(
          id,
          name,
          slug
        ),
        wholesale_pricing:wholesale_pricing(
          id,
          tier_name,
          minimum_quantity,
          unit_price,
          discount_percentage
        )
      `,
        { count: "exact" },
      )
      .eq("status", "published")
      .eq("is_wholesale", true);

    // Filter wholesale-only products
    if (wholesaleOnly) {
      query = query.eq("wholesale_only", true);
    }

    // Filter by category
    if (category) {
      query = query.eq("primary_category_id", category);
    }

    // Filter by vendor
    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    // Search
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`,
      );
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false });

    const { data: products, error, count } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Get wholesale products error:", error);
      }
      return NextResponse.json(
        { error: "Failed to get products", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Get wholesale products error:", err);
    }
    return NextResponse.json(
      { error: "Failed to get products", details: err.message },
      { status: 500 },
    );
  }
}
