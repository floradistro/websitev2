/**
 * Analytics Types
 * Comprehensive type definitions for analytics system
 */

// =====================================================
// Core Types
// =====================================================

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "custom";
export type GroupBy = "day" | "week" | "month";
export type ComparisonType = "previous_period" | "previous_year" | "none";
export type ReportFormat = "csv" | "xlsx" | "pdf";

// =====================================================
// Query Types
// =====================================================

export interface AnalyticsQueryParams {
  start_date: string;
  end_date: string;
  time_range?: TimeRange;

  location_ids?: string;
  employee_ids?: string;
  category_ids?: string;
  product_ids?: string;

  group_by?: GroupBy;
  compare?: ComparisonType;

  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// =====================================================
// Response Types
// =====================================================

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    start_date: string;
    end_date: string;
    total_records: number;
    page?: number;
    limit?: number;
    total_pages?: number;
    filters_applied: {
      locations?: string[];
      employees?: string[];
      categories?: string[];
      products?: string[];
    };
    comparison_period?: {
      start_date: string;
      end_date: string;
    };
  };
  summary?: any;
  comparison?: any;
}

// =====================================================
// Sales Types
// =====================================================

export interface DailySales {
  date: string;
  gross_sales: number;
  net_sales: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  refund_amount: number;
  tip_amount: number;
  cost_of_goods: number;
  gross_profit: number;
  gross_margin: number;
  total_orders: number;
  total_refunds: number;
  total_items: number;
  avg_order_value: number;
  payment_breakdown?: PaymentBreakdown;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  digital?: number;
  other?: number;
}

export interface SalesByLocation {
  location_id: string;
  location_name: string;
  gross_sales: number;
  net_sales: number;
  orders: number;
  avg_order_value: number;
  gross_profit: number;
  gross_margin: number;
  percent_of_total: number;
}

export interface SalesByEmployee {
  employee_id: string;
  employee_name: string;
  transactions: number;
  gross_sales: number;
  net_sales: number;
  avg_transaction: number;
  items_per_transaction: number;
  discounts_given: number;
  discount_percent: number;
  gross_profit: number;
  gross_margin: number;
  tips_collected: number;
  payment_breakdown: PaymentBreakdown;
}

export interface SalesByCategory {
  category_id: string;
  category_name: string;
  items_sold: number;
  gross_sales: number;
  net_sales: number;
  cost: number;
  profit: number;
  margin: number;
  discount_amount: number;
  markdown_percent: number;
  tax_amount: number;
  percent_of_total: number;
}

// =====================================================
// Product Types
// =====================================================

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  category: string;
  units_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  avg_price: number;
  discount_given: number;
  markdown_percent: number;
  orders: number;
  stock_on_hand?: number;
  turnover_rate?: number;
}

export interface ProductByLocation {
  product_id: string;
  product_name: string;
  locations: {
    location_id: string;
    location_name: string;
    units_sold: number;
    revenue: number;
    percent_of_product: number;
  }[];
  total_units: number;
  total_revenue: number;
}

export interface ItemizedSale {
  transaction_id: string;
  transaction_number: string;
  transaction_date: string;
  location_name: string;
  employee_name: string;
  customer_id?: string;
  items: {
    product_name: string;
    category: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    discount: number;
    tax: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
}

// =====================================================
// Financial Types
// =====================================================

export interface ProfitLoss {
  revenue: {
    gross_sales: number;
    refunds: number;
    net_sales: number;
  };
  cost_of_goods: number;
  gross_profit: number;
  gross_margin: number;
  operating_expenses?: {
    total: number;
    breakdown?: any;
  };
  net_income: number;
  net_margin: number;
}

export interface TaxReport {
  summary: {
    total_taxable_sales: number;
    total_tax_collected: number;
    total_tax_exempt: number;
    effective_rate: number;
  };
  by_location: {
    location_name: string;
    taxable_sales: number;
    tax_collected: number;
    tax_exempt: number;
    rate: number;
  }[];
  by_category: {
    category_name: string;
    taxable_sales: number;
    tax_collected: number;
    tax_exempt: number;
  }[];
}

export interface DiscountAnalysis {
  summary: {
    total_discounts: number;
    discount_percent: number;
    revenue_impact: number;
    orders_with_discount: number;
    discount_rate: number;
  };
  by_type: {
    discount_type: string;
    amount: number;
    orders: number;
    avg_discount: number;
  }[];
  by_product: {
    product_name: string;
    discount_amount: number;
    markdown_percent: number;
  }[];
}

// =====================================================
// Session & Register Types
// =====================================================

export interface SessionSummary {
  session_id: string;
  session_number: string;
  location_name: string;
  employee_name: string;
  opened_at: string;
  closed_at: string;
  opening_cash: number;
  closing_cash: number;
  expected_cash: number;
  variance: number;
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  card_sales: number;
  refunds: number;
}

export interface CashReconciliation {
  session_id: string;
  opening_cash: number;
  cash_sales: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
  actual_cash: number;
  variance: number;
  variance_reason?: string;
  payment_breakdown: PaymentBreakdown & { tips?: number };
  transactions: {
    total: number;
    refunds: number;
    voids: number;
  };
}

// =====================================================
// Export Types
// =====================================================

export interface ReportExport {
  id: string;
  report_type: string;
  format: ReportFormat;
  status: "pending" | "processing" | "completed" | "failed";
  file_url?: string;
  file_size?: number;
  error_message?: string;
  expires_at?: string;
  created_at: string;
}

export interface ExportRequest {
  report_type: string;
  format: ReportFormat;
  filters: Partial<AnalyticsQueryParams>;
}

export interface ReportSchedule {
  id: string;
  name: string;
  report_type: string;
  schedule_type: "daily" | "weekly" | "monthly" | "custom";
  schedule_config: any;
  delivery_method: "email" | "download" | "webhook";
  delivery_config: any;
  filters: Partial<AnalyticsQueryParams>;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
}

// =====================================================
// Overview Types
// =====================================================

export interface SalesOverview {
  revenue: {
    total: number;
    change: number;
    change_percent: number;
    direction: "up" | "down" | "neutral";
    trend: number[];
  };
  orders: {
    total: number;
    change: number;
    change_percent: number;
    avg_value: number;
  };
  profit: {
    total: number;
    margin: number;
  };
  top_products: ProductPerformance[];
  top_locations: SalesByLocation[];
}
