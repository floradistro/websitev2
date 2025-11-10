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
 * GET /api/vendor/analytics/v2/financial/tax-report
 * Tax collected by location and category
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // Get orders with tax info
    let ordersQuery = supabase
      .from("orders")
      .select(
        `
        subtotal,
        tax_amount,
        total_amount,
        order_date,
        pickup_location_id,
        locations(id, name)
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date)
      .in("status", ["completed", "processing"]);

    if (filters.location_ids && filters.location_ids.length > 0) {
      ordersQuery = ordersQuery.in("pickup_location_id", filters.location_ids);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Get POS transactions with tax info
    let posQuery = supabase
      .from("pos_transactions")
      .select(
        `
        subtotal,
        tax_amount,
        total_amount,
        transaction_date,
        location_id,
        locations(id, name)
      `,
      )
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
    const totalTaxableOrders = orders?.reduce(
      (sum, order) => sum + parseFloat(order.subtotal || "0"),
      0,
    ) || 0;
    const totalTaxablePos = posTransactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.subtotal || "0"),
      0,
    ) || 0;
    const totalTaxableSales = totalTaxableOrders + totalTaxablePos;

    const totalTaxOrders = orders?.reduce(
      (sum, order) => sum + parseFloat(order.tax_amount || "0"),
      0,
    ) || 0;
    const totalTaxPos = posTransactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.tax_amount || "0"),
      0,
    ) || 0;
    const totalTaxCollected = totalTaxOrders + totalTaxPos;

    const effectiveRate = totalTaxableSales > 0 ? (totalTaxCollected / totalTaxableSales) * 100 : 0;

    // Group by location
    const locationData: any = {};

    orders?.forEach((order) => {
      const locId = order.pickup_location_id || "no-location";
      const locName = (order.locations as any)?.[0]?.name || "No Location";

      if (!locationData[locId]) {
        locationData[locId] = {
          location_name: locName,
          taxable_sales: 0,
          tax_collected: 0,
          tax_exempt: 0,
        };
      }

      locationData[locId].taxable_sales += parseFloat(order.subtotal || "0");
      locationData[locId].tax_collected += parseFloat(order.tax_amount || "0");
    });

    posTransactions?.forEach((tx) => {
      const locId = tx.location_id || "no-location";
      const locName = (tx.locations as any)?.[0]?.name || "No Location";

      if (!locationData[locId]) {
        locationData[locId] = {
          location_name: locName,
          taxable_sales: 0,
          tax_collected: 0,
          tax_exempt: 0,
        };
      }

      locationData[locId].taxable_sales += parseFloat(tx.subtotal || "0");
      locationData[locId].tax_collected += parseFloat(tx.tax_amount || "0");
    });

    const byLocation = Object.values(locationData).map((loc: any) => ({
      location_name: loc.location_name,
      taxable_sales: loc.taxable_sales,
      tax_collected: loc.tax_collected,
      tax_exempt: loc.tax_exempt,
      rate: loc.taxable_sales > 0 ? (loc.tax_collected / loc.taxable_sales) * 100 : 0,
    }));

    // Get category breakdown
    const categoryQuery = supabase
      .from("order_items")
      .select(
        `
        line_total,
        tax_amount,
        products!inner(
          primary_category_id,
          categories(id, name)
        ),
        orders!inner(
          order_date,
          status
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("orders.order_date", dateRange.start_date)
      .lte("orders.order_date", dateRange.end_date)
      .in("orders.status", ["completed", "processing"]);

    const { data: categoryItems } = await categoryQuery;

    const categoryData: any = {};
    categoryItems?.forEach((item: any) => {
      const category = item.products?.categories;
      const catName = category?.name || "Uncategorized";

      if (!categoryData[catName]) {
        categoryData[catName] = {
          category_name: catName,
          taxable_sales: 0,
          tax_collected: 0,
          tax_exempt: 0,
        };
      }

      categoryData[catName].taxable_sales += parseFloat(item.line_total || "0");
      categoryData[catName].tax_collected += parseFloat(item.tax_amount || "0");
    });

    const byCategory = Object.values(categoryData);

    const taxReport = {
      summary: {
        total_taxable_sales: totalTaxableSales,
        total_tax_collected: totalTaxCollected,
        total_tax_exempt: 0, // TODO: Track tax-exempt sales
        effective_rate: effectiveRate,
      },
      by_location: byLocation,
      by_category: byCategory,
    };

    return NextResponse.json({
      success: true,
      data: taxReport,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      },
    });
  } catch (error: any) {
    logger.error("Tax report error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate tax report" },
      { status: 500 },
    );
  }
}
