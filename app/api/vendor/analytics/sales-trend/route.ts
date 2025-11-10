import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/sales-trend
 * Returns sales trend data by day/week/month
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Use requireVendor to get vendor_id from authenticated session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily"; // daily, weekly, monthly
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get analytics data from vendor_analytics table
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("vendor_analytics")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("period_type", period)
      .gte("period_start", startDate.toISOString().split("T")[0])
      .order("period_start", { ascending: true });

    if (analyticsError) throw analyticsError;

    // Format the data for charts
    const chartData = (analyticsData || []).map((record) => ({
      date: record.period_start,
      revenue: parseFloat(record.gross_revenue || "0"),
      netRevenue: parseFloat(record.net_revenue || "0"),
      orders: record.total_orders || 0,
      items: record.total_items_sold || 0,
      customers: record.unique_customers || 0,
      avgOrderValue: parseFloat(record.average_order_value || "0"),
    }));

    // Calculate totals
    const totals = chartData.reduce(
      (acc, curr) => ({
        revenue: acc.revenue + curr.revenue,
        netRevenue: acc.netRevenue + curr.netRevenue,
        orders: acc.orders + curr.orders,
        items: acc.items + curr.items,
      }),
      { revenue: 0, netRevenue: 0, orders: 0, items: 0 },
    );

    // Calculate growth (compare first half vs second half)
    const midpoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, midpoint);
    const secondHalf = chartData.slice(midpoint);

    const firstHalfRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0);

    const growth =
      firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        totals,
        growth: parseFloat(growth.toFixed(2)),
        period,
        days,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Vendor sales trend error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch sales trend" },
      { status: 500 },
    );
  }
}
