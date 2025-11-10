import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import { parseDateRange, parseFilters } from "@/lib/analytics/query-helpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/financial/profit-loss
 * P&L Statement
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // Get orders
    let ordersQuery = supabase
      .from("orders")
      .select("total_amount, refund_amount, cost_of_goods, discount_amount, order_date")
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date)
      .in("status", ["completed", "processing"]);

    if (filters.location_ids && filters.location_ids.length > 0) {
      ordersQuery = ordersQuery.in("pickup_location_id", filters.location_ids);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Get POS transactions
    let posQuery = supabase
      .from("pos_transactions")
      .select("total_amount, cost_of_goods, discount_amount, transaction_date")
      .eq("vendor_id", vendorId)
      .gte("transaction_date", dateRange.start_date)
      .lte("transaction_date", dateRange.end_date)
      .eq("payment_status", "completed");

    if (filters.location_ids && filters.location_ids.length > 0) {
      posQuery = posQuery.in("location_id", filters.location_ids);
    }

    const { data: posTransactions, error: posError } = await posQuery;
    if (posError) throw posError;

    // Calculate revenue
    const orderRevenue = orders?.reduce(
      (sum, order) => sum + parseFloat(order.total_amount || "0"),
      0,
    ) || 0;
    const posRevenue = posTransactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.total_amount || "0"),
      0,
    ) || 0;
    const grossSales = orderRevenue + posRevenue;

    // Calculate refunds
    const refunds = orders?.reduce(
      (sum, order) => sum + parseFloat(order.refund_amount || "0"),
      0,
    ) || 0;
    const netSales = grossSales - refunds;

    // Calculate COGS
    const orderCOGS = orders?.reduce(
      (sum, order) => sum + parseFloat(order.cost_of_goods || "0"),
      0,
    ) || 0;
    const posCOGS = posTransactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.cost_of_goods || "0"),
      0,
    ) || 0;
    const totalCOGS = orderCOGS + posCOGS;

    // Calculate gross profit
    const grossProfit = netSales - totalCOGS;
    const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Calculate discounts
    const orderDiscounts = orders?.reduce(
      (sum, order) => sum + parseFloat(order.discount_amount || "0"),
      0,
    ) || 0;
    const posDiscounts = posTransactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.discount_amount || "0"),
      0,
    ) || 0;
    const totalDiscounts = orderDiscounts + posDiscounts;

    // Operating expenses (placeholder - would come from expense tracking)
    const operatingExpenses = 0; // TODO: Add expense tracking

    // Net income
    const netIncome = grossProfit - operatingExpenses;
    const netMargin = netSales > 0 ? (netIncome / netSales) * 100 : 0;

    const profitLoss = {
      revenue: {
        gross_sales: grossSales,
        refunds: -refunds,
        discounts: -totalDiscounts,
        net_sales: netSales,
      },
      cost_of_goods: totalCOGS,
      gross_profit: grossProfit,
      gross_margin: grossMargin,
      operating_expenses: {
        total: operatingExpenses,
        breakdown: {
          // TODO: Add expense categories
          payroll: 0,
          rent: 0,
          utilities: 0,
          marketing: 0,
          other: 0,
        },
      },
      net_income: netIncome,
      net_margin: netMargin,
      period: {
        start: dateRange.start_date,
        end: dateRange.end_date,
      },
    };

    return NextResponse.json({
      success: true,
      data: profitLoss,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      },
    });
  } catch (error: any) {
    logger.error("P&L statement error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate P&L statement" },
      { status: 500 },
    );
  }
}
