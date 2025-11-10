import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import {
  parseDateRange,
  parseFilters,
  parseQueryOptions,
  paginate,
} from "@/lib/analytics/query-helpers";
import type { ProductPerformance } from "@/lib/analytics/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/products/performance
 * Product performance ranking
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);
    const options = parseQueryOptions(searchParams);

    // Query from product performance view
    let query = supabase
      .from("v_product_performance" as any)
      .select("*")
      .eq("vendor_id", vendorId);

    if (filters.category_ids && filters.category_ids.length > 0) {
      query = query.in("primary_category_id", filters.category_ids);
    }

    if (filters.product_ids && filters.product_ids.length > 0) {
      query = query.in("product_id", filters.product_ids);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          total_records: 0,
        },
      });
    }

    // Format data
    const result: ProductPerformance[] = data
      .filter((p: any) => p.units_sold > 0)
      .map((p: any) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        category: p.category_name || "Uncategorized",
        units_sold: p.units_sold || 0,
        revenue: parseFloat(p.revenue || "0"),
        cost: parseFloat(p.estimated_cost || "0"),
        profit: parseFloat(p.estimated_profit || "0"),
        margin: parseFloat(p.margin_percentage || "0"),
        avg_price: p.units_sold > 0 ? parseFloat(p.revenue || "0") / p.units_sold : 0,
        discount_given: 0,
        markdown_percent: 0,
        orders: p.order_count || 0,
      }));

    // Sort based on query options
    const sortBy = options.sort_by || "revenue";
    const sortOrder = options.sort_order || "desc";

    result.sort((a: any, b: any) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    // Paginate
    const paginatedResult = paginate(result, options.page, options.limit);

    return NextResponse.json({
      success: true,
      data: paginatedResult.data,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...paginatedResult.metadata,
        filters_applied: {
          categories: filters.category_ids,
          products: filters.product_ids,
        },
      },
      summary: {
        total_products: result.length,
        total_revenue: result.reduce((sum, p) => sum + p.revenue, 0),
        total_profit: result.reduce((sum, p) => sum + p.profit, 0),
        avg_margin:
          result.length > 0 ? result.reduce((sum, p) => sum + p.margin, 0) / result.length : 0,
      },
    });
  } catch (error: any) {
    logger.error("Product performance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load product performance",
      },
      { status: 500 },
    );
  }
}
