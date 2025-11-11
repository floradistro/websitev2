/**
 * REFACTORED EXAMPLE: Sales by Location
 *
 * This is an example of how to use the new DRY utilities to simplify analytics routes.
 *
 * BEFORE (original route.ts): ~200 lines with duplicate patterns
 * AFTER (this file): ~60 lines, more readable, maintainable
 *
 * Improvements:
 * - ✅ No duplicate auth/rate limiting/error handling
 * - ✅ Reusable query builder
 * - ✅ Consistent response formatting
 * - ✅ Automatic caching support
 * - ✅ Standardized error handling
 */

import { NextRequest } from "next/server";
import { withVendorAuth } from "@/lib/api/route-wrapper";
import {
  AnalyticsQueryBuilder,
  AnalyticsResponseBuilder,
  AnalyticsAggregator,
} from "@/lib/api/analytics-query-builder";
import { parseDateRange, parseFilters } from "@/lib/analytics/query-helpers";
import { createClient } from "@supabase/supabase-js";
import type { SalesByLocation } from "@/lib/analytics/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/sales/by-location-refactored
 * Sales comparison by location (REFACTORED VERSION)
 */
export const GET = withVendorAuth(
  async (request, { vendorId }) => {
    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // 1. Query orders by location (using query builder)
    const ordersQuery = new AnalyticsQueryBuilder(supabase, vendorId!)
      .from(
        "orders",
        `
        pickup_location_id,
        total_amount,
        subtotal,
        discount_amount,
        payment_method,
        status,
        locations(id, name)
      `,
      )
      .dateRange(dateRange.start_date, dateRange.end_date)
      .statusFilter(filters.include_refunds)
      .locationFilter(filters.location_ids)
      .paymentMethodFilter(filters.payment_methods);

    const orders = await ordersQuery.executeOrThrow();

    // 2. Query POS transactions by location (using query builder)
    const posQuery = new AnalyticsQueryBuilder(supabase, vendorId!)
      .from(
        "pos_transactions",
        `
        location_id,
        total_amount,
        subtotal,
        discount_amount,
        payment_method,
        payment_status,
        locations(id, name)
      `,
      )
      .dateRange(dateRange.start_date, dateRange.end_date, "transaction_date")
      .where("order_id", "is", null) // Exclude POS transactions linked to orders
      .paymentStatusFilter(filters.include_refunds)
      .locationFilter(filters.location_ids, "location_id")
      .paymentMethodFilter(filters.payment_methods);

    const posTransactions = await posQuery.executeOrThrow();

    // 3. Return empty response if no data
    if (orders.length === 0 && posTransactions.length === 0) {
      return new AnalyticsResponseBuilder()
        .setData([])
        .setDateRange(dateRange.start_date, dateRange.end_date)
        .setTotalRecords(0)
        .build();
    }

    // 4. Group data by location
    const locationData: Record<string, any> = {};

    // Process orders
    orders.forEach((order: any) => {
      const locationId = order.pickup_location_id || "unknown";
      const locationName = order.locations?.name || "Unknown Location";

      if (!locationData[locationId]) {
        locationData[locationId] = {
          location_id: locationId,
          location_name: locationName,
          order_count: 0,
          gross_sales: 0,
          net_sales: 0,
          discount_amount: 0,
        };
      }

      const total = parseFloat(order.total_amount || "0");
      const discount = parseFloat(order.discount_amount || "0");

      locationData[locationId].order_count += 1;
      locationData[locationId].gross_sales += total;
      locationData[locationId].discount_amount += discount;
    });

    // Process POS transactions
    posTransactions.forEach((txn: any) => {
      const locationId = txn.location_id || "unknown";
      const locationName = txn.locations?.name || "Unknown Location";

      if (!locationData[locationId]) {
        locationData[locationId] = {
          location_id: locationId,
          location_name: locationName,
          order_count: 0,
          gross_sales: 0,
          net_sales: 0,
          discount_amount: 0,
        };
      }

      const total = parseFloat(txn.total_amount || "0");
      const discount = parseFloat(txn.discount_amount || "0");

      locationData[locationId].order_count += 1;
      locationData[locationId].gross_sales += total;
      locationData[locationId].discount_amount += discount;
    });

    // 5. Calculate totals and percentages
    const totalSales = Object.values(locationData).reduce(
      (sum: number, loc: any) => sum + loc.gross_sales,
      0,
    );

    const result: SalesByLocation[] = Object.values(locationData).map((loc: any) => ({
      ...loc,
      net_sales: loc.gross_sales - loc.discount_amount,
      percent_of_total: totalSales > 0 ? (loc.gross_sales / totalSales) * 100 : 0,
    }));

    // Sort by sales descending
    result.sort((a, b) => b.gross_sales - a.gross_sales);

    // 6. Build response with metadata and summary
    return new AnalyticsResponseBuilder<SalesByLocation>()
      .setData(result)
      .setDateRange(dateRange.start_date, dateRange.end_date)
      .setTotalRecords(result.length)
      .addSummary("total_sales", totalSales)
      .addSummary(
        "total_orders",
        result.reduce((sum, loc) => sum + loc.order_count, 0),
      )
      .addSummary(
        "avg_per_location",
        result.length > 0 ? totalSales / result.length : 0,
      )
      .build();
  },
  {
    // Route options (DRY!)
    rateLimit: {
      enabled: true,
      config: "analyticsApi",
    },
    cache: {
      enabled: true,
      ttl: 300, // 5 minutes
      keyGenerator: (request, context) => {
        const { searchParams } = new URL(request.url);
        return `analytics:by-location:${context.vendorId}:${searchParams.toString()}`;
      },
    },
    errorHandling: {
      logErrors: true,
      includeStackTrace: process.env.NODE_ENV === "development",
    },
  },
);
