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

    // Query live from POS transactions
    let query = supabase
      .from("pos_transactions")
      .select(
        `
        user_id,
        total_amount,
        subtotal,
        discount_amount,
        tip_amount,
        cost_of_goods,
        payment_method
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("transaction_date", dateRange.start_date)
      .lte("transaction_date", dateRange.end_date)
      .eq("payment_status", "completed")
      .not("user_id", "is", null);

    if (filters.location_ids && filters.location_ids.length > 0) {
      query = query.in("location_id", filters.location_ids);
    }

    if (filters.employee_ids && filters.employee_ids.length > 0) {
      query = query.in("user_id", filters.employee_ids);
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

    // Get unique user IDs to fetch user names
    const userIdsSet = new Set<string>();
    data.forEach((tx: any) => {
      if (tx.user_id) userIdsSet.add(tx.user_id);
    });
    const userIds = Array.from(userIdsSet);

    // Fetch user names
    let userMap = new Map();
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
