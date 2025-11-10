import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const supabase = getServiceSupabase();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get vendor's products
    const { data: vendorProducts } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendorId);

    const productIds = vendorProducts?.map((p) => p.id) || [];

    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          total_orders: 0,
          total_revenue: 0,
          total_items_sold: 0,
          average_order_value: 0,
          top_products: [],
          sales_by_day: [],
        },
      });
    }

    // Get order items for this vendor's products
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(
        `
        *,
        order:order_id(
          id,
          order_number,
          order_date,
          total_amount,
          status
        )
      `,
      )
      .in("product_id", productIds)
      .gte("order.order_date", startDate.toISOString());

    // Calculate analytics
    const totalOrders = new Set(orderItems?.map((item) => item.order?.id)).size;
    const totalRevenue =
      orderItems?.reduce((sum, item) => sum + parseFloat(item.line_total || 0), 0) || 0;
    const totalItemsSold =
      orderItems?.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const productSales = new Map();
    orderItems?.forEach((item) => {
      const current = productSales.get(item.product_id) || {
        quantity: 0,
        revenue: 0,
        name: item.product_name,
      };
      current.quantity += parseFloat(item.quantity || 0);
      current.revenue += parseFloat(item.line_total || 0);
      productSales.set(item.product_id, current);
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, stats]) => ({
        product_id: productId,
        name: stats.name,
        quantity_sold: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by day
    const salesByDay = new Map();
    orderItems?.forEach((item) => {
      if (!item.order?.order_date) return;

      const date = new Date(item.order.order_date).toISOString().split("T")[0];
      const current = salesByDay.get(date) || {
        orders: new Set(),
        revenue: 0,
        items: 0,
      };
      current.orders.add(item.order.id);
      current.revenue += parseFloat(item.line_total || 0);
      current.items += parseFloat(item.quantity || 0);
      salesByDay.set(date, current);
    });

    const salesData = Array.from(salesByDay.entries())
      .map(([date, stats]) => ({
        date,
        orders: stats.orders.size,
        revenue: stats.revenue,
        items: stats.items,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      analytics: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days,
        },
        totals: {
          total_orders: totalOrders || 0,
          total_revenue: totalRevenue || 0,
          total_items_sold: totalItemsSold || 0,
          average_order_value: averageOrderValue || 0,
        },
        top_products: topProducts || [],
        sales_by_day: salesData || [],
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
