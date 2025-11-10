import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import {
  parseDateRange,
  parseFilters,
} from "@/lib/analytics/query-helpers";
import type { SalesByEmployee } from "@/lib/analytics/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/sales/by-employee
 * Employee performance report
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // Get orders with their employee info from linked POS transactions
    let ordersQuery = supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        subtotal,
        discount_amount,
        cost_of_goods,
        pickup_location_id,
        status,
        pos_transactions!inner(user_id, payment_method)
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date)
      .not("pos_transactions.user_id", "is", null);

    // Apply refund filter
    if (filters.include_refunds) {
      ordersQuery = ordersQuery.in("status", ["completed", "processing", "refunded"]);
    } else {
      ordersQuery = ordersQuery.in("status", ["completed", "processing"]);
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      ordersQuery = ordersQuery.in("pickup_location_id", filters.location_ids);
    }

    if (filters.employee_ids && filters.employee_ids.length > 0) {
      ordersQuery = ordersQuery.in("pos_transactions.user_id", filters.employee_ids);
    }

    if (filters.payment_methods && filters.payment_methods.length > 0) {
      ordersQuery = ordersQuery.in("pos_transactions.payment_method", filters.payment_methods);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Also get standalone POS transactions (not linked to orders)
    let posQuery = supabase
      .from("pos_transactions")
      .select(
        `
        user_id,
        total_amount,
        subtotal,
        discount_amount,
        tip_amount,
        cost_of_goods,
        payment_method,
        payment_status
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("transaction_date", dateRange.start_date)
      .lte("transaction_date", dateRange.end_date)
      .not("user_id", "is", null)
      .is("order_id", null); // Only standalone POS transactions

    // Apply refund filter
    if (filters.include_refunds) {
      posQuery = posQuery.in("payment_status", ["completed", "refunded"]);
    } else {
      posQuery = posQuery.eq("payment_status", "completed");
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      posQuery = posQuery.in("location_id", filters.location_ids);
    }

    if (filters.employee_ids && filters.employee_ids.length > 0) {
      posQuery = posQuery.in("user_id", filters.employee_ids);
    }

    if (filters.payment_methods && filters.payment_methods.length > 0) {
      posQuery = posQuery.in("payment_method", filters.payment_methods);
    }

    const { data: posTransactions, error: posError } = await posQuery;
    if (posError) throw posError;

    // Get orders WITHOUT employee tracking (legacy orders)
    let legacyOrdersQuery = supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        subtotal,
        discount_amount,
        cost_of_goods
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date)
      .in("status", ["completed", "processing"]);

    if (filters.location_ids && filters.location_ids.length > 0) {
      legacyOrdersQuery = legacyOrdersQuery.in("pickup_location_id", filters.location_ids);
    }

    const { data: legacyOrders, error: legacyError } = await legacyOrdersQuery;
    if (legacyError) throw legacyError;

    // Filter legacy orders to only those WITHOUT POS transaction link
    const ordersWithPOS = new Set((orders || []).map((o: any) => o.id));
    const trulyLegacyOrders = (legacyOrders || []).filter((o: any) => !ordersWithPOS.has(o.id));

    // Special ID for system/legacy employee
    const SYSTEM_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000000";

    // Combine data from orders and standalone POS
    const allData: any[] = [
      // Orders WITH employee (get from linked POS transaction)
      ...(orders || []).map((order: any) => ({
        user_id: order.pos_transactions?.[0]?.user_id,
        total_amount: order.total_amount,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        tip_amount: 0,
        cost_of_goods: order.cost_of_goods,
        payment_method: order.pos_transactions?.[0]?.payment_method,
      })),
      // Standalone POS transactions
      ...(posTransactions || []),
      // Legacy orders WITHOUT employee tracking
      ...trulyLegacyOrders.map((order: any) => ({
        user_id: SYSTEM_EMPLOYEE_ID,
        total_amount: order.total_amount,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        tip_amount: 0,
        cost_of_goods: order.cost_of_goods,
        payment_method: "legacy",
      })),
    ];

    // Apply discount filter
    const data = allData
      .filter((d) => d.user_id) // Remove any without user_id
      .filter((d) => {
        const discount = parseFloat(d.discount_amount || "0");
        return filters.include_discounts || discount === 0;
      });

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

    // Get unique user IDs to fetch user names
    const userIdsSet = new Set<string>();
    data.forEach((tx: any) => {
      if (tx.user_id && tx.user_id !== SYSTEM_EMPLOYEE_ID) userIdsSet.add(tx.user_id);
    });
    const userIds = Array.from(userIdsSet);

    // Fetch user names
    let userMap = new Map();

    // Add system employee
    userMap.set(SYSTEM_EMPLOYEE_ID, "System / Online Orders");

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .in("id", userIds);

      users?.forEach((u: any) => {
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || "Unknown";
        userMap.set(u.id, fullName);
      });
    }

    // Group by employee
    const employeeData = data.reduce((acc: any, tx: any) => {
      const empId = tx.user_id;
      if (!acc[empId]) {
        acc[empId] = {
          employee_id: empId,
          employee_name: userMap.get(empId) || "Unknown",
          transactions: 0,
          gross_sales: 0,
          discounts_given: 0,
          tips_collected: 0,
          cost_of_goods: 0,
          cash: 0,
          card: 0,
        };
      }

      acc[empId].transactions += 1;
      acc[empId].gross_sales += parseFloat(tx.total_amount || "0");
      acc[empId].discounts_given += parseFloat(tx.discount_amount || "0");
      acc[empId].tips_collected += parseFloat(tx.tip_amount || "0");
      acc[empId].cost_of_goods += parseFloat(tx.cost_of_goods || "0");

      // Track payment methods
      if (tx.payment_method?.toLowerCase().includes("cash")) {
        acc[empId].cash += parseFloat(tx.total_amount || "0");
      } else {
        acc[empId].card += parseFloat(tx.total_amount || "0");
      }

      return acc;
    }, {});

    // Calculate metrics
    const result: SalesByEmployee[] = Object.values(employeeData).map((emp: any) => ({
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      transactions: emp.transactions,
      gross_sales: emp.gross_sales,
      net_sales: emp.gross_sales,
      avg_transaction: emp.transactions > 0 ? emp.gross_sales / emp.transactions : 0,
      items_per_transaction: 0,
      discounts_given: emp.discounts_given,
      discount_percent: emp.gross_sales > 0 ? (emp.discounts_given / emp.gross_sales) * 100 : 0,
      gross_profit: emp.gross_sales - emp.cost_of_goods,
      gross_margin: emp.gross_sales > 0 ? ((emp.gross_sales - emp.cost_of_goods) / emp.gross_sales) * 100 : 0,
      tips_collected: emp.tips_collected,
      payment_breakdown: {
        cash: emp.cash,
        card: emp.card,
      },
    }));

    // Sort by sales
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
        total_sales: result.reduce((sum, emp) => sum + emp.gross_sales, 0),
        total_transactions: result.reduce((sum, emp) => sum + emp.transactions, 0),
        total_profit: result.reduce((sum, emp) => sum + emp.gross_profit, 0),
      },
    });
  } catch (error: any) {
    logger.error("Sales by employee error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load sales by employee",
      },
      { status: 500 },
    );
  }
}
