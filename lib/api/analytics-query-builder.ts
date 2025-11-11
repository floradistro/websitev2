/**
 * Analytics Query Builder Utilities
 *
 * Provides DRY query builders for common analytics patterns:
 * - Date range filtering
 * - Status/refund filtering
 * - Location filtering
 * - Payment method filtering
 * - Employee filtering
 * - Category filtering
 *
 * USAGE:
 * const builder = new AnalyticsQueryBuilder(supabase, vendorId);
 * const orders = await builder
 *   .from('orders')
 *   .dateRange(startDate, endDate)
 *   .locationFilter(locationIds)
 *   .statusFilter(includeRefunds)
 *   .execute();
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { parseDateRange, parseFilters } from "@/lib/analytics/query-helpers";

export interface QueryFilters {
  include_refunds?: boolean;
  include_discounts?: boolean;
  location_ids?: string[];
  employee_ids?: string[];
  category_ids?: string[];
  payment_methods?: string[];
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

/**
 * Analytics Query Builder
 * Provides fluent interface for building analytics queries
 */
export class AnalyticsQueryBuilder<T = any> {
  private supabase: SupabaseClient;
  private vendorId: string;
  private tableName: string = "";
  private query: any;
  private filters: QueryFilters = {};
  private dateRangeApplied: boolean = false;

  constructor(supabase: SupabaseClient, vendorId: string) {
    this.supabase = supabase;
    this.vendorId = vendorId;
  }

  /**
   * Set the table to query from
   */
  from(tableName: string, selectQuery: string = "*"): this {
    this.tableName = tableName;
    this.query = this.supabase
      .from(tableName)
      .select(selectQuery)
      .eq("vendor_id", this.vendorId);
    return this;
  }

  /**
   * Apply date range filter
   */
  dateRange(
    startDate: string,
    endDate: string,
    dateColumn: string = "order_date",
  ): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }
    this.query = this.query
      .gte(dateColumn, startDate)
      .lte(dateColumn, endDate);
    this.dateRangeApplied = true;
    return this;
  }

  /**
   * Apply status filter (with refund handling)
   */
  statusFilter(includeRefunds: boolean = false, statusColumn: string = "status"): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    if (includeRefunds) {
      this.query = this.query.in(statusColumn, ["completed", "processing", "refunded"]);
    } else {
      this.query = this.query.in(statusColumn, ["completed", "processing"]);
    }

    return this;
  }

  /**
   * Apply payment status filter (for POS transactions)
   */
  paymentStatusFilter(
    includeRefunds: boolean = false,
    statusColumn: string = "payment_status",
  ): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    if (includeRefunds) {
      this.query = this.query.in(statusColumn, ["completed", "refunded"]);
    } else {
      this.query = this.query.eq(statusColumn, "completed");
    }

    return this;
  }

  /**
   * Apply location filter
   */
  locationFilter(locationIds?: string[], locationColumn: string = "pickup_location_id"): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    if (locationIds && locationIds.length > 0) {
      this.query = this.query.in(locationColumn, locationIds);
    }

    return this;
  }

  /**
   * Apply employee filter
   */
  employeeFilter(employeeIds?: string[], employeeColumn: string = "user_id"): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    if (employeeIds && employeeIds.length > 0) {
      this.query = this.query.in(employeeColumn, employeeIds);
    }

    return this;
  }

  /**
   * Apply payment method filter
   */
  paymentMethodFilter(
    paymentMethods?: string[],
    paymentColumn: string = "payment_method",
  ): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    if (paymentMethods && paymentMethods.length > 0) {
      this.query = this.query.in(paymentColumn, paymentMethods);
    }

    return this;
  }

  /**
   * Apply category filter (for product queries)
   */
  categoryFilter(categoryIds?: string[], categoryColumn: string = "primary_category_id"): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    if (categoryIds && categoryIds.length > 0) {
      this.query = this.query.in(categoryColumn, categoryIds);
    }

    return this;
  }

  /**
   * Apply all filters from QueryFilters object
   */
  applyFilters(filters: QueryFilters): this {
    this.filters = filters;

    if (this.tableName === "orders") {
      this.statusFilter(filters.include_refunds);
    } else if (this.tableName === "pos_transactions") {
      this.paymentStatusFilter(filters.include_refunds);
    }

    this.locationFilter(filters.location_ids);
    this.employeeFilter(filters.employee_ids);
    this.categoryFilter(filters.category_ids);
    this.paymentMethodFilter(filters.payment_methods);

    return this;
  }

  /**
   * Add custom filter
   */
  where(column: string, operator: string, value: any): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    switch (operator) {
      case "=":
        this.query = this.query.eq(column, value);
        break;
      case "!=":
        this.query = this.query.neq(column, value);
        break;
      case ">":
        this.query = this.query.gt(column, value);
        break;
      case ">=":
        this.query = this.query.gte(column, value);
        break;
      case "<":
        this.query = this.query.lt(column, value);
        break;
      case "<=":
        this.query = this.query.lte(column, value);
        break;
      case "in":
        this.query = this.query.in(column, value);
        break;
      case "is":
        this.query = this.query.is(column, value);
        break;
      case "not":
        this.query = this.query.not(column, operator, value);
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }

    return this;
  }

  /**
   * Add ordering
   */
  orderBy(column: string, ascending: boolean = true): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    this.query = this.query.order(column, { ascending });
    return this;
  }

  /**
   * Add limit
   */
  limit(count: number): this {
    if (!this.query) {
      throw new Error("Must call from() before applying filters");
    }

    this.query = this.query.limit(count);
    return this;
  }

  /**
   * Execute the query
   */
  async execute(): Promise<{ data: T[] | null; error: any }> {
    if (!this.query) {
      throw new Error("Must call from() before executing");
    }

    return await this.query;
  }

  /**
   * Execute and return data only (throws on error)
   */
  async executeOrThrow(): Promise<T[]> {
    const { data, error } = await this.execute();
    if (error) throw error;
    return data || [];
  }
}

/**
 * Standard analytics response builder
 */
export class AnalyticsResponseBuilder<T = any> {
  private data: T[] = [];
  private metadata: Record<string, any> = {};
  private summary: Record<string, any> = {};

  setData(data: T[]): this {
    this.data = data;
    return this;
  }

  addMetadata(key: string, value: any): this {
    this.metadata[key] = value;
    return this;
  }

  setDateRange(startDate: string, endDate: string): this {
    this.metadata.start_date = startDate;
    this.metadata.end_date = endDate;
    return this;
  }

  setTotalRecords(count: number): this {
    this.metadata.total_records = count;
    return this;
  }

  addSummary(key: string, value: any): this {
    this.summary[key] = value;
    return this;
  }

  build() {
    return {
      success: true,
      data: this.data,
      metadata: this.metadata,
      ...(Object.keys(this.summary).length > 0 && { summary: this.summary }),
    };
  }
}

/**
 * Helper: Calculate aggregates from data
 */
export class AnalyticsAggregator {
  static sum(data: any[], field: string): number {
    return data.reduce((sum, item) => sum + parseFloat(item[field] || 0), 0);
  }

  static avg(data: any[], field: string): number {
    if (data.length === 0) return 0;
    return this.sum(data, field) / data.length;
  }

  static count(data: any[], predicate?: (item: any) => boolean): number {
    if (!predicate) return data.length;
    return data.filter(predicate).length;
  }

  static groupBy<T>(data: T[], keyFn: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    data.forEach((item) => {
      const key = keyFn(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    return groups;
  }

  static summarizeGroup(
    data: any[],
    fields: string[],
  ): Record<string, number> {
    const summary: Record<string, number> = {};
    fields.forEach((field) => {
      summary[`total_${field}`] = this.sum(data, field);
      summary[`avg_${field}`] = this.avg(data, field);
    });
    return summary;
  }
}

/**
 * Pre-built query templates for common analytics queries
 */
export class AnalyticsQueryTemplates {
  /**
   * Get orders with items for a date range
   */
  static ordersWithItems(
    supabase: SupabaseClient,
    vendorId: string,
    dateRange: DateRange,
    filters: QueryFilters = {},
  ) {
    const builder = new AnalyticsQueryBuilder(supabase, vendorId);
    return builder
      .from(
        "orders",
        `
        id,
        total_amount,
        subtotal,
        discount_amount,
        tax_amount,
        cost_of_goods,
        payment_method,
        status,
        pickup_location_id,
        order_date,
        order_items!inner(
          product_id,
          quantity,
          line_total,
          tax_amount
        )
      `,
      )
      .dateRange(dateRange.start_date, dateRange.end_date)
      .applyFilters(filters);
  }

  /**
   * Get POS transactions for a date range
   */
  static posTransactions(
    supabase: SupabaseClient,
    vendorId: string,
    dateRange: DateRange,
    filters: QueryFilters = {},
  ) {
    const builder = new AnalyticsQueryBuilder(supabase, vendorId);
    return builder
      .from(
        "pos_transactions",
        `
        id,
        total_amount,
        subtotal,
        discount_amount,
        tax_amount,
        tip_amount,
        payment_method,
        payment_status,
        location_id,
        user_id,
        transaction_date
      `,
      )
      .dateRange(dateRange.start_date, dateRange.end_date, "transaction_date")
      .where("order_id", "is", null) // Exclude POS transactions linked to orders
      .applyFilters(filters);
  }

  /**
   * Get order items with product and category info
   */
  static orderItemsWithProducts(
    supabase: SupabaseClient,
    vendorId: string,
    dateRange: DateRange,
    filters: QueryFilters = {},
  ) {
    const builder = new AnalyticsQueryBuilder(supabase, vendorId);
    return builder
      .from(
        "order_items",
        `
        quantity,
        line_total,
        tax_amount,
        product_id,
        order_id,
        orders!inner(
          order_date,
          status,
          discount_amount,
          pickup_location_id,
          payment_method
        )
      `,
      )
      .dateRange(dateRange.start_date, dateRange.end_date, "orders.order_date")
      .applyFilters(filters);
  }
}
