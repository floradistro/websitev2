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

    // Get orders by location
    let ordersQuery = supabase
      .from("orders")
      .select(`
        pickup_location_id,
        total_amount,
        subtotal,
        discount_amount,
        payment_method,
        status,
        locations(id, name)
      `)
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date);

    // Apply refund filter
    if (filters.include_refunds) {
      ordersQuery = ordersQuery.in("status", ["completed", "processing", "refunded"]);
    } else {
      ordersQuery = ordersQuery.in("status", ["completed", "processing"]);
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      ordersQuery = ordersQuery.in("pickup_location_id", filters.location_ids);
    }

    if (filters.payment_methods && filters.payment_methods.length > 0) {
      ordersQuery = ordersQuery.in("payment_method", filters.payment_methods);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Get POS transactions by location (exclude those linked to orders)
    let posQuery = supabase
      .from("pos_transactions")
      .select(`
        location_id,
        total_amount,
        subtotal,
        discount_amount,
        payment_method,
        payment_status,
        locations(id, name)
      `)
      .eq("vendor_id", vendorId)
      .gte("transaction_date", dateRange.start_date)
      .lte("transaction_date", dateRange.end_date)
      .is("order_id", null); // Exclude POS transactions linked to orders

    // Apply refund filter
    if (filters.include_refunds) {
      posQuery = posQuery.in("payment_status", ["completed", "refunded"]);
    } else {
      posQuery = posQuery.eq("payment_status", "completed");
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      posQuery = posQuery.in("location_id", filters.location_ids);
    }

    if (filters.payment_methods && filters.payment_methods.length > 0) {
      posQuery = posQuery.in("payment_method", filters.payment_methods);
    }

    const { data: posTransactions, error: posError } = await posQuery;
    if (posError) throw posError;

    if ((!orders || orders.length === 0) && (!posTransactions || posTransactions.length === 0)) {
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
    const locationData: any = {};

    // Process orders
    orders?.forEach((order: any) => {
      const discount = parseFloat(order.discount_amount || "0");

      // Skip orders with discounts if exclude_discounts is true
      if (!filters.include_discounts && discount > 0) {
        return;
      }

      const locId = order.pickup_location_id || "no-location";
      const locName = order.locations?.name || "No Location";

      if (!locationData[locId]) {
        locationData[locId] = {
          location_id: locId,
          location_name: locName,
          gross_sales: 0,
          net_sales: 0,
          orders: 0,
          subtotal: 0,
          gross_profit: 0,
        };
      }

      locationData[locId].gross_sales += parseFloat(order.total_amount || "0");
      locationData[locId].net_sales += parseFloat(order.total_amount || "0");
      locationData[locId].subtotal += parseFloat(order.subtotal || "0");
      locationData[locId].orders += 1;
    });

    // Process POS transactions
    posTransactions?.forEach((tx: any) => {
      const discount = parseFloat(tx.discount_amount || "0");

      // Skip transactions with discounts if exclude_discounts is true
      if (!filters.include_discounts && discount > 0) {
        return;
      }

      const locId = tx.location_id || "no-location";
      const locName = tx.locations?.name || "No Location";

      if (!locationData[locId]) {
        locationData[locId] = {
          location_id: locId,
          location_name: locName,
          gross_sales: 0,
          net_sales: 0,
          orders: 0,
          subtotal: 0,
          gross_profit: 0,
        };
      }

      locationData[locId].gross_sales += parseFloat(tx.total_amount || "0");
      locationData[locId].net_sales += parseFloat(tx.total_amount || "0");
      locationData[locId].subtotal += parseFloat(tx.subtotal || "0");
      locationData[locId].orders += 1;
    });

    // Calculate profits (50% COGS estimate)
    Object.values(locationData).forEach((loc: any) => {
      const estimatedCogs = loc.subtotal * 0.5;
      loc.gross_profit = loc.subtotal - estimatedCogs;
    });

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
