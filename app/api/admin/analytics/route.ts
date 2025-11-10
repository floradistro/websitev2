import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Get admin analytics from real database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const supabase = getServiceSupabase();

    // Calculate date range
    const now = new Date();
    let daysAgo = 30;
    if (range === "7d") daysAgo = 7;
    else if (range === "90d") daysAgo = 90;

    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Fetch real orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total_amount, status, created_at")
      .gte("created_at", startDate.toISOString())
      .eq("status", "completed");

    if (ordersError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching orders:", ordersError);
      }
    }

    const totalOrders = orders?.length || 0;
    const totalRevenue =
      orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group revenue by week
    const revenueByWeek: Record<string, number> = {};
    orders?.forEach((order) => {
      const date = new Date(order.created_at);
      const weekStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - date.getDay(),
      );
      const weekKey = weekStart.toISOString().split("T")[0];

      revenueByWeek[weekKey] =
        (revenueByWeek[weekKey] || 0) + parseFloat(order.total_amount || "0");
    });

    const revenueData = Object.entries(revenueByWeek)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        topVendor: "N/A",
        topProduct: "N/A",
      },
      revenueData,
      categoryData: [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Analytics API error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
