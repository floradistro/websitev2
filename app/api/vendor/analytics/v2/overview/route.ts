import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { parseDateRange, parseFilters, calculateComparison } from "@/lib/analytics/query-helpers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // Get orders data
    let ordersQuery = supabase
      .from("orders")
      .select("id, order_date, total_amount, subtotal, tax_amount, discount_amount, status")
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date)
      .in("status", ["completed", "processing"]);

    if (filters.location_ids && filters.location_ids.length > 0) {
      ordersQuery = ordersQuery.in("pickup_location_id", filters.location_ids);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Get POS transactions data
    let posQuery = supabase
      .from("pos_transactions")
      .select("id, transaction_date, total_amount, subtotal, tax_amount, payment_status")
      .eq("vendor_id", vendorId)
      .gte("transaction_date", dateRange.start_date)
      .lte("transaction_date", dateRange.end_date)
      .eq("payment_status", "completed");

    if (filters.location_ids && filters.location_ids.length > 0) {
      posQuery = posQuery.in("location_id", filters.location_ids);
    }

    const { data: posTransactions, error: posError } = await posQuery;
    if (posError) throw posError;

    // Calculate totals
    const orderSales = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0) || 0;
    const posSales = posTransactions?.reduce((sum, t) => sum + parseFloat(t.total_amount || "0"), 0) || 0;
    const totalSales = orderSales + posSales;

    const orderCount = orders?.length || 0;
    const posCount = posTransactions?.length || 0;
    const transactionCount = orderCount + posCount;

    const orderSubtotal = orders?.reduce((sum, o) => sum + parseFloat(o.subtotal || "0"), 0) || 0;
    const posSubtotal = posTransactions?.reduce((sum, t) => sum + parseFloat(t.subtotal || "0"), 0) || 0;
    const totalSubtotal = orderSubtotal + posSubtotal;

    const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;

    // Estimate gross profit (you'd want to get actual COGS from order_items/products)
    const estimatedCogs = totalSubtotal * 0.5; // Assuming 50% COGS as placeholder
    const grossProfit = totalSubtotal - estimatedCogs;
    const margin = totalSubtotal > 0 ? (grossProfit / totalSubtotal) * 100 : 0;

    // Get top product (from order_items)
    const { data: topProductData } = await supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        quantity,
        line_total,
        orders!inner(
          order_date,
          status,
          vendor_id
        )
      `)
      .eq("vendor_id", vendorId)
      .gte("orders.order_date", dateRange.start_date)
      .lte("orders.order_date", dateRange.end_date)
      .in("orders.status", ["completed", "processing"])
      .limit(100);

    let topProduct = null;
    if (topProductData && topProductData.length > 0) {
      // Group by product
      const productMap = topProductData.reduce((acc: any, item: any) => {
        const key = item.product_id || item.product_name;
        if (!acc[key]) {
          acc[key] = {
            name: item.product_name,
            units_sold: 0,
            revenue: 0,
          };
        }
        acc[key].units_sold += parseFloat(item.quantity || "0");
        acc[key].revenue += parseFloat(item.line_total || "0");
        return acc;
      }, {});

      const products = Object.values(productMap);
      products.sort((a: any, b: any) => b.revenue - a.revenue);
      topProduct = products[0] || null;
    }

    // Calculate comparison with previous period
    const compStart = new Date(dateRange.start_date);
    const compEnd = new Date(dateRange.end_date);
    const daysDiff = Math.ceil((compEnd.getTime() - compStart.getTime()) / (1000 * 60 * 60 * 24));

    const prevStart = new Date(compStart);
    prevStart.setDate(prevStart.getDate() - daysDiff);
    const prevEnd = new Date(compStart);
    prevEnd.setDate(prevEnd.getDate() - 1);

    // Get previous period orders
    const { data: prevOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("vendor_id", vendorId)
      .gte("order_date", prevStart.toISOString())
      .lte("order_date", prevEnd.toISOString())
      .in("status", ["completed", "processing"]);

    // Get previous period POS transactions
    const { data: prevPosTransactions } = await supabase
      .from("pos_transactions")
      .select("total_amount")
      .eq("vendor_id", vendorId)
      .gte("transaction_date", prevStart.toISOString())
      .lte("transaction_date", prevEnd.toISOString())
      .eq("payment_status", "completed");

    const prevOrderSales = prevOrders?.reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0) || 0;
    const prevPosSales = prevPosTransactions?.reduce((sum, t) => sum + parseFloat(t.total_amount || "0"), 0) || 0;
    const prevTotalSales = prevOrderSales + prevPosSales;

    const prevTransactionCount = (prevOrders?.length || 0) + (prevPosTransactions?.length || 0);
    const prevAvgTransaction = prevTransactionCount > 0 ? prevTotalSales / prevTransactionCount : 0;

    // Calculate changes
    const grossSalesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
    const grossProfitChange = 0; // Would need previous COGS data
    const avgTransactionChange = prevAvgTransaction > 0 ? ((avgTransaction - prevAvgTransaction) / prevAvgTransaction) * 100 : 0;

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        gross_sales: totalSales,
        net_sales: totalSales, // Subtract refunds if you track them
        transaction_count: transactionCount,
        avg_transaction: avgTransaction,
        gross_profit: grossProfit,
        margin: margin,
        items_sold: topProductData?.reduce((sum, item: any) => sum + parseFloat(item.quantity || "0"), 0) || 0,
        avg_items_per_transaction: transactionCount > 0
          ? (topProductData?.reduce((sum, item: any) => sum + parseFloat(item.quantity || "0"), 0) || 0) / transactionCount
          : 0,
        top_product: topProduct,
        comparison: {
          gross_sales_change: grossSalesChange,
          gross_profit_change: grossProfitChange,
          avg_transaction_change: avgTransactionChange,
        },
      },
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        total_records: transactionCount,
      },
    });
  } catch (error: any) {
    logger.error("Analytics overview error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load analytics overview" },
      { status: 500 },
    );
  }
}
