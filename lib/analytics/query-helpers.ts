/**
 * Analytics Query Helpers
 * Utility functions for building analytics queries
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// =====================================================
// Types
// =====================================================

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface AnalyticsFilters {
  location_ids?: string[];
  employee_ids?: string[];
  category_ids?: string[];
  product_ids?: string[];
}

export interface QueryOptions {
  group_by?: "day" | "week" | "month";
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ComparisonPeriod {
  type: "previous_period" | "previous_year" | "none";
  start_date?: string;
  end_date?: string;
}

// =====================================================
// Date Utilities
// =====================================================

export function parseDateRange(params: URLSearchParams): DateRange {
  const range = params.get("range") || params.get("time_range") || "30d";
  const custom_start = params.get("start_date");
  const custom_end = params.get("end_date");

  if (custom_start && custom_end) {
    return {
      start_date: custom_start,
      end_date: custom_end,
    };
  }

  const end = new Date();
  const start = new Date();

  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
}

export function getComparisonPeriod(
  dateRange: DateRange,
  comparisonType: "previous_period" | "previous_year" | "none",
): ComparisonPeriod | null {
  if (comparisonType === "none") return null;

  const start = new Date(dateRange.start_date);
  const end = new Date(dateRange.end_date);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (comparisonType === "previous_period") {
    const compStart = new Date(start);
    compStart.setDate(compStart.getDate() - daysDiff);
    const compEnd = new Date(start);
    compEnd.setDate(compEnd.getDate() - 1);

    return {
      type: "previous_period",
      start_date: compStart.toISOString().split("T")[0],
      end_date: compEnd.toISOString().split("T")[0],
    };
  }

  if (comparisonType === "previous_year") {
    const compStart = new Date(start);
    compStart.setFullYear(compStart.getFullYear() - 1);
    const compEnd = new Date(end);
    compEnd.setFullYear(compEnd.getFullYear() - 1);

    return {
      type: "previous_year",
      start_date: compStart.toISOString().split("T")[0],
      end_date: compEnd.toISOString().split("T")[0],
    };
  }

  return null;
}

export function parseFilters(params: URLSearchParams): AnalyticsFilters {
  const filters: AnalyticsFilters = {};

  const location_ids = params.get("location_ids");
  if (location_ids) {
    filters.location_ids = location_ids.split(",");
  }

  const employee_ids = params.get("employee_ids");
  if (employee_ids) {
    filters.employee_ids = employee_ids.split(",");
  }

  const category_ids = params.get("category_ids");
  if (category_ids) {
    filters.category_ids = category_ids.split(",");
  }

  const product_ids = params.get("product_ids");
  if (product_ids) {
    filters.product_ids = product_ids.split(",");
  }

  return filters;
}

export function parseQueryOptions(params: URLSearchParams): QueryOptions {
  return {
    group_by: (params.get("group_by") as any) || "day",
    sort_by: params.get("sort_by") || undefined,
    sort_order: (params.get("sort_order") as any) || "desc",
    page: parseInt(params.get("page") || "1"),
    limit: parseInt(params.get("limit") || "50"),
  };
}

// =====================================================
// Cache Queries
// =====================================================

export async function getDailyCacheData(
  vendorId: string,
  dateRange: DateRange,
  filters?: AnalyticsFilters,
) {
  let query = supabase
    .from("analytics_daily_cache")
    .select("*")
    .eq("vendor_id", vendorId)
    .gte("date", dateRange.start_date)
    .lte("date", dateRange.end_date);

  if (filters?.location_ids && filters.location_ids.length > 0) {
    query = query.in("location_id", filters.location_ids);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProductCacheData(
  vendorId: string,
  dateRange: DateRange,
  filters?: AnalyticsFilters,
) {
  let query = supabase
    .from("analytics_product_cache")
    .select(
      `
      *,
      products(name, sku),
      categories(name)
    `,
    )
    .eq("vendor_id", vendorId)
    .gte("period_start", dateRange.start_date)
    .lte("period_end", dateRange.end_date);

  if (filters?.location_ids && filters.location_ids.length > 0) {
    query = query.in("location_id", filters.location_ids);
  }

  if (filters?.product_ids && filters.product_ids.length > 0) {
    query = query.in("product_id", filters.product_ids);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getEmployeeCacheData(
  vendorId: string,
  dateRange: DateRange,
  filters?: AnalyticsFilters,
) {
  let query = supabase
    .from("analytics_employee_cache")
    .select(
      `
      *,
      users(id, email, full_name)
    `,
    )
    .eq("vendor_id", vendorId)
    .gte("period_start", dateRange.start_date)
    .lte("period_end", dateRange.end_date);

  if (filters?.location_ids && filters.location_ids.length > 0) {
    query = query.in("location_id", filters.location_ids);
  }

  if (filters?.employee_ids && filters.employee_ids.length > 0) {
    query = query.in("employee_id", filters.employee_ids);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// =====================================================
// Live Data Queries (fallback when cache is empty)
// =====================================================

export async function calculateDailySalesLive(
  vendorId: string,
  dateRange: DateRange,
  filters?: AnalyticsFilters,
) {
  // Query from v_daily_sales view
  let query = supabase
    .from("v_daily_sales" as any)
    .select("*")
    .eq("vendor_id", vendorId)
    .gte("sale_date", dateRange.start_date)
    .lte("sale_date", dateRange.end_date);

  if (filters?.location_ids && filters.location_ids.length > 0) {
    query = query.in("location_id", filters.location_ids);
  }

  if (filters?.employee_ids && filters.employee_ids.length > 0) {
    query = query.in("employee_id", filters.employee_ids);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function aggregateDailySales(salesData: any[]) {
  // Group by date
  const grouped = salesData.reduce((acc: any, sale: any) => {
    const date = sale.sale_date;
    if (!acc[date]) {
      acc[date] = {
        date,
        gross_sales: 0,
        net_sales: 0,
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        refund_amount: 0,
        tip_amount: 0,
        cost_of_goods: 0,
        gross_profit: 0,
        total_orders: 0,
      };
    }

    acc[date].gross_sales += parseFloat(sale.total_amount || 0);
    acc[date].net_sales += parseFloat(sale.total_amount || 0) - parseFloat(sale.refund_amount || 0);
    acc[date].subtotal += parseFloat(sale.subtotal || 0);
    acc[date].tax_amount += parseFloat(sale.tax_amount || 0);
    acc[date].discount_amount += parseFloat(sale.discount_amount || 0);
    acc[date].refund_amount += parseFloat(sale.refund_amount || 0);
    acc[date].tip_amount += parseFloat(sale.tip_amount || 0);
    acc[date].cost_of_goods += parseFloat(sale.cost_of_goods || 0);
    acc[date].gross_profit += parseFloat(sale.gross_profit || 0);
    acc[date].total_orders += 1;

    return acc;
  }, {});

  // Calculate margins
  return Object.values(grouped).map((day: any) => ({
    ...day,
    gross_margin:
      day.gross_sales > 0 ? ((day.gross_profit / day.gross_sales) * 100).toFixed(2) : "0.00",
    avg_order_value: day.total_orders > 0 ? (day.gross_sales / day.total_orders).toFixed(2) : "0.00",
  }));
}

// =====================================================
// Comparison Calculations
// =====================================================

export function calculateComparison(current: number, previous: number) {
  if (previous === 0) {
    return {
      change: current,
      change_percent: 100,
      direction: current > 0 ? "up" : "down",
    };
  }

  const change = current - previous;
  const change_percent = (change / previous) * 100;

  return {
    change: parseFloat(change.toFixed(2)),
    change_percent: parseFloat(change_percent.toFixed(2)),
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

export function calculateTrend(data: number[]) {
  if (data.length < 2) return 0;

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint).reduce((sum, val) => sum + val, 0);
  const secondHalf = data.slice(midpoint).reduce((sum, val) => sum + val, 0);

  if (firstHalf === 0) return 0;

  return parseFloat((((secondHalf - firstHalf) / firstHalf) * 100).toFixed(2));
}

// =====================================================
// Pagination
// =====================================================

export function paginate<T>(data: T[], page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    metadata: {
      total_records: data.length,
      page,
      limit,
      total_pages: Math.ceil(data.length / limit),
    },
  };
}

// =====================================================
// Format Helpers
// =====================================================

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatPercent(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${num.toFixed(2)}%`;
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US").format(num);
}
