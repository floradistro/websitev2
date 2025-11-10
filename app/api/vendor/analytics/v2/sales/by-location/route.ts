import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import {
  parseDateRange,
  parseFilters,
} from "@/lib/analytics/query-helpers";
import type { SalesByLocation } from "@/lib/analytics/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/sales/by-location
 * Sales comparison by location
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // Get daily cache data grouped by location
    let query = supabase
      .from("analytics_daily_cache")
      .select(
        `
        location_id,
        gross_sales,
        net_sales,
        total_orders,
        gross_profit,
        gross_margin,
        locations(id, name)
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("date", dateRange.start_date)
      .lte("date", dateRange.end_date)
      .not("location_id", "is", null);

    if (filters.location_ids && filters.location_ids.length > 0) {
      query = query.in("location_id", filters.location_ids);
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

    // Group by location
    const locationData = data.reduce((acc: any, record: any) => {
      const locId = record.location_id;
      if (!acc[locId]) {
        acc[locId] = {
          location_id: locId,
          location_name: record.locations?.name || "Unknown",
          gross_sales: 0,
          net_sales: 0,
          orders: 0,
          gross_profit: 0,
          count: 0,
        };
      }

      acc[locId].gross_sales += parseFloat(record.gross_sales || "0");
      acc[locId].net_sales += parseFloat(record.net_sales || "0");
      acc[locId].orders += record.total_orders || 0;
      acc[locId].gross_profit += parseFloat(record.gross_profit || "0");
      acc[locId].count += 1;

      return acc;
    }, {});

    // Calculate metrics and percentages
    const totalSales = Object.values(locationData).reduce(
      (sum: number, loc: any) => sum + loc.gross_sales,
      0,
    );

    const result: SalesByLocation[] = Object.values(locationData).map((loc: any) => ({
      location_id: loc.location_id,
      location_name: loc.location_name,
      gross_sales: loc.gross_sales,
      net_sales: loc.net_sales,
      orders: loc.orders,
      avg_order_value: loc.orders > 0 ? loc.gross_sales / loc.orders : 0,
      gross_profit: loc.gross_profit,
      gross_margin: loc.gross_sales > 0 ? (loc.gross_profit / loc.gross_sales) * 100 : 0,
      percent_of_total: totalSales > 0 ? (loc.gross_sales / totalSales) * 100 : 0,
    }));

    // Sort by sales descending
    result.sort((a, b) => b.gross_sales - a.gross_sales);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        total_records: result.length,
      },
      summary: {
        total_sales: totalSales,
        total_orders: result.reduce((sum, loc) => sum + loc.orders, 0),
        total_profit: result.reduce((sum, loc) => sum + loc.gross_profit, 0),
      },
    });
  } catch (error: any) {
    logger.error("Sales by location error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load sales by location",
      },
      { status: 500 },
    );
  }
}
