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
 * GET /api/vendor/analytics/v2/sales/by-payment-method
 * Payment method breakdown
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
    let query = supabase
      .from("orders")
      .select("payment_method, total_amount, order_date, pickup_location_id")
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date)
      .in("status", ["completed", "processing"])
      .not("payment_method", "is", null);

    if (filters.location_ids && filters.location_ids.length > 0) {
      query = query.in("pickup_location_id", filters.location_ids);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) throw ordersError;

    // Get POS transactions
    let posQuery = supabase
      .from("pos_transactions")
      .select("payment_method, total_amount, transaction_date, location_id, tip_amount")
      .eq("vendor_id", vendorId)
      .gte("transaction_date", dateRange.start_date)
      .lte("transaction_date", dateRange.end_date)
      .eq("payment_status", "completed")
      .not("payment_method", "is", null);

    if (filters.location_ids && filters.location_ids.length > 0) {
      posQuery = posQuery.in("location_id", filters.location_ids);
    }

    const { data: posTransactions, error: posError } = await posQuery;

    if (posError) throw posError;

    // Combine and normalize payment methods
    const normalizePaymentMethod = (method: string): string => {
      const lower = method.toLowerCase();
      if (lower.includes("cash")) return "Cash";
      if (lower.includes("card") || lower.includes("credit") || lower.includes("debit")) return "Card";
      if (lower.includes("digital") || lower.includes("online") || lower.includes("stripe")) return "Digital";
      return "Other";
    };

    const paymentData: any = {};

    // Process orders
    orders?.forEach((order) => {
      const method = normalizePaymentMethod(order.payment_method);
      if (!paymentData[method]) {
        paymentData[method] = {
          amount: 0,
          transactions: 0,
          tips: 0,
        };
      }
      paymentData[method].amount += parseFloat(order.total_amount || "0");
      paymentData[method].transactions += 1;
    });

    // Process POS transactions
    posTransactions?.forEach((tx) => {
      const method = normalizePaymentMethod(tx.payment_method);
      if (!paymentData[method]) {
        paymentData[method] = {
          amount: 0,
          transactions: 0,
          tips: 0,
        };
      }
      paymentData[method].amount += parseFloat(tx.total_amount || "0");
      paymentData[method].transactions += 1;
      paymentData[method].tips += parseFloat(tx.tip_amount || "0");
    });

    // Calculate totals
    const totalAmount = Object.values(paymentData).reduce(
      (sum: number, pm: any) => sum + pm.amount,
      0,
    );
    const totalTransactions = Object.values(paymentData).reduce(
      (sum: number, pm: any) => sum + pm.transactions,
      0,
    );

    // Format results
    const result = Object.entries(paymentData).map(([method, data]: [string, any]) => ({
      method,
      amount: data.amount,
      transactions: data.transactions,
      avg_transaction: data.transactions > 0 ? data.amount / data.transactions : 0,
      percent: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      tips: data.tips,
    }));

    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        total_records: result.length,
      },
      summary: {
        total_amount: totalAmount,
        total_transactions: totalTransactions,
        total_tips: result.reduce((sum, pm) => sum + pm.tips, 0),
      },
    });
  } catch (error: any) {
    logger.error("Sales by payment method error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load payment method breakdown" },
      { status: 500 },
    );
  }
}
