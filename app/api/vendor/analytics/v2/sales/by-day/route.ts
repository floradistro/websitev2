import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import {
  parseDateRange,
  parseFilters,
  parseQueryOptions,
  getDailyCacheData,
  calculateDailySalesLive,
  aggregateDailySales,
  paginate,
} from "@/lib/analytics/query-helpers";
import type { DailySales } from "@/lib/analytics/types";

/**
 * GET /api/vendor/analytics/v2/sales/by-day
 * Daily sales breakdown with all metrics
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);

    // Parse parameters
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);
    const options = parseQueryOptions(searchParams);

    // Try cache first
    let dailyData = await getDailyCacheData(vendorId, dateRange, filters);

    // If cache is empty, calculate live
    if (!dailyData || dailyData.length === 0) {
      logger.info("Cache miss - calculating live data");
      const liveData = await calculateDailySalesLive(vendorId, dateRange, filters);
      dailyData = await aggregateDailySales(liveData);
    }

    // Sort by date
    dailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate summary
    const summary = {
      total_gross_sales: dailyData.reduce((sum, d) => sum + parseFloat(d.gross_sales || "0"), 0),
      total_net_sales: dailyData.reduce((sum, d) => sum + parseFloat(d.net_sales || "0"), 0),
      total_orders: dailyData.reduce((sum, d) => sum + (d.total_orders || 0), 0),
      total_profit: dailyData.reduce((sum, d) => sum + parseFloat(d.gross_profit || "0"), 0),
      avg_daily_sales: dailyData.length > 0
        ? dailyData.reduce((sum, d) => sum + parseFloat(d.gross_sales || "0"), 0) / dailyData.length
        : 0,
      avg_order_value: dailyData.reduce((sum, d) => sum + (d.total_orders || 0), 0) > 0
        ? dailyData.reduce((sum, d) => sum + parseFloat(d.gross_sales || "0"), 0) /
          dailyData.reduce((sum, d) => sum + (d.total_orders || 0), 0)
        : 0,
    };

    // Paginate if requested
    const paginationEnabled = options.page && options.limit;
    const result = paginationEnabled
      ? paginate(dailyData, options.page, options.limit)
      : { data: dailyData, metadata: { total_records: dailyData.length } };

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...result.metadata,
        filters_applied: {
          locations: filters.location_ids,
          employees: filters.employee_ids,
        },
      },
      summary,
    });
  } catch (error: any) {
    logger.error("Sales by day error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load sales by day",
      },
      { status: 500 },
    );
  }
}
