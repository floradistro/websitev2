import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import {
  parseDateRange,
  parseFilters,
  getComparisonPeriod,
  getDailyCacheData,
  calculateComparison,
} from "@/lib/analytics/query-helpers";
import type { SalesOverview } from "@/lib/analytics/types";

/**
 * GET /api/vendor/analytics/v2/overview
 * Sales overview dashboard with key metrics
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
    const compareType = (searchParams.get("compare") as any) || "previous_period";

    // Get current period data
    const currentData = await getDailyCacheData(vendorId, dateRange, filters);

    if (!currentData || currentData.length === 0) {
      // Return empty state
      return NextResponse.json({
        success: true,
        data: {
          revenue: {
            total: 0,
            change: 0,
            change_percent: 0,
            direction: "neutral",
            trend: [],
          },
          orders: {
            total: 0,
            change: 0,
            change_percent: 0,
            avg_value: 0,
          },
          profit: {
            total: 0,
            margin: 0,
          },
          top_products: [],
          top_locations: [],
        },
        metadata: {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          total_records: 0,
          filters_applied: {
            locations: filters.location_ids,
            employees: filters.employee_ids,
          },
        },
      });
    }

    // Calculate current metrics
    const revenue = {
      total: currentData.reduce((sum, d) => sum + parseFloat(d.gross_sales || "0"), 0),
      trend: currentData.map((d) => parseFloat(d.gross_sales || "0")),
    };

    const orders = {
      total: currentData.reduce((sum, d) => sum + (d.total_orders || 0), 0),
      avg_value: revenue.total / Math.max(1, currentData.reduce((sum, d) => sum + (d.total_orders || 0), 0)),
    };

    const profit = {
      total: currentData.reduce((sum, d) => sum + parseFloat(d.gross_profit || "0"), 0),
      margin: revenue.total > 0 ? (currentData.reduce((sum, d) => sum + parseFloat(d.gross_profit || "0"), 0) / revenue.total) * 100 : 0,
    };

    // Get comparison period data if requested
    let comparison: any = undefined;
    if (compareType !== "none") {
      const comparisonPeriod = getComparisonPeriod(dateRange, compareType);
      if (comparisonPeriod) {
        const comparisonData = await getDailyCacheData(
          vendorId,
          {
            start_date: comparisonPeriod.start_date!,
            end_date: comparisonPeriod.end_date!,
          },
          filters,
        );

        if (comparisonData && comparisonData.length > 0) {
          const prevRevenue = comparisonData.reduce(
            (sum, d) => sum + parseFloat(d.gross_sales || "0"),
            0,
          );
          const prevOrders = comparisonData.reduce((sum, d) => sum + (d.total_orders || 0), 0);
          const prevProfit = comparisonData.reduce(
            (sum, d) => sum + parseFloat(d.gross_profit || "0"),
            0,
          );

          comparison = {
            revenue: calculateComparison(revenue.total, prevRevenue),
            orders: calculateComparison(orders.total, prevOrders),
            profit: calculateComparison(profit.total, prevProfit),
          };
        }
      }
    }

    // Build response
    const response: SalesOverview = {
      revenue: {
        ...revenue,
        change: comparison?.revenue?.change || 0,
        change_percent: comparison?.revenue?.change_percent || 0,
        direction: comparison?.revenue?.direction || "neutral",
      },
      orders: {
        ...orders,
        change: comparison?.orders?.change || 0,
        change_percent: comparison?.orders?.change_percent || 0,
      },
      profit,
      top_products: [],
      top_locations: [],
    };

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        total_records: currentData.length,
        filters_applied: {
          locations: filters.location_ids,
          employees: filters.employee_ids,
        },
        comparison_period: comparison
          ? {
              start_date: getComparisonPeriod(dateRange, compareType)?.start_date,
              end_date: getComparisonPeriod(dateRange, compareType)?.end_date,
            }
          : undefined,
      },
      comparison,
    });
  } catch (error: any) {
    logger.error("Analytics overview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load analytics overview",
      },
      { status: 500 },
    );
  }
}
