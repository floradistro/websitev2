import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import { parseDateRange, parseFilters } from "@/lib/analytics/query-helpers";
import type { SalesByCategory } from "@/lib/analytics/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/sales/by-category
 * Sales breakdown by product category
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // Get order items with product and category info
    let query = supabase
      .from("order_items")
      .select(
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
      .eq("vendor_id", vendorId)
      .gte("orders.order_date", dateRange.start_date)
      .lte("orders.order_date", dateRange.end_date);

    // Apply refund filter
    if (filters.include_refunds) {
      query = query.in("orders.status", ["completed", "processing", "refunded"]);
    } else {
      query = query.in("orders.status", ["completed", "processing"]);
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      query = query.in("orders.pickup_location_id", filters.location_ids);
    }

    if (filters.payment_methods && filters.payment_methods.length > 0) {
      query = query.in("orders.payment_method", filters.payment_methods);
    }

    const { data: orderItems, error: itemsError } = await query;

    if (itemsError) throw itemsError;

    if (!orderItems || orderItems.length === 0) {
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

    // Get unique product IDs
    const productIdsSet = new Set<string>();
    orderItems.forEach((item: any) => {
      if (item.product_id) productIdsSet.add(item.product_id);
    });
    const productIds = Array.from(productIdsSet);

    // Get products with categories (specify the foreign key to avoid ambiguity)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        cost_price,
        primary_category_id,
        categories!products_primary_category_id_fkey(id, name, slug)
      `)
      .in("id", productIds);

    if (productsError) throw productsError;

    // Create product lookup map
    const productMap = new Map();
    products?.forEach((p: any) => {
      productMap.set(p.id, p);
    });

    // Group by category
    const categoryData = orderItems.reduce((acc: any, item: any) => {
      const orderDiscount = parseFloat(item.orders?.discount_amount || "0");

      // Skip items from orders with discounts if exclude_discounts is true
      if (!filters.include_discounts && orderDiscount > 0) {
        return acc;
      }

      const product = productMap.get(item.product_id);
      const category = product?.categories;
      const categoryId = category?.id || "uncategorized";
      const categoryName = category?.name || "Uncategorized";

      // Apply category filter
      if (filters.category_ids && filters.category_ids.length > 0) {
        if (!filters.category_ids.includes(categoryId)) {
          return acc;
        }
      }

      if (!acc[categoryId]) {
        acc[categoryId] = {
          category_id: categoryId,
          category_name: categoryName,
          items_sold: 0,
          gross_sales: 0,
          cost: 0,
          tax_amount: 0,
          discount_amount: 0,
          order_count: new Set(),
        };
      }

      const quantity = parseFloat(item.quantity || "0");
      const lineTotal = parseFloat(item.line_total || "0");
      const cost = quantity * parseFloat(product?.cost_price || "0");
      const tax = parseFloat(item.tax_amount || "0");

      acc[categoryId].items_sold += quantity;
      acc[categoryId].gross_sales += lineTotal;
      acc[categoryId].cost += cost;
      acc[categoryId].tax_amount += tax;
      acc[categoryId].order_count.add(item.order_id); // FIX: Use order_id instead of order_date

      return acc;
    }, {});

    // Calculate totals
    const totalSales = Object.values(categoryData).reduce(
      (sum: number, cat: any) => sum + cat.gross_sales,
      0,
    );

    // Format results
    const result: SalesByCategory[] = Object.values(categoryData).map((cat: any) => ({
      category_id: cat.category_id,
      category_name: cat.category_name,
      items_sold: cat.items_sold,
      gross_sales: cat.gross_sales,
      net_sales: cat.gross_sales, // Could subtract refunds if we tracked them
      cost: cat.cost,
      profit: cat.gross_sales - cat.cost,
      margin: cat.gross_sales > 0 ? ((cat.gross_sales - cat.cost) / cat.gross_sales) * 100 : 0,
      discount_amount: cat.discount_amount,
      markdown_percent: cat.gross_sales > 0 ? (cat.discount_amount / (cat.gross_sales + cat.discount_amount)) * 100 : 0,
      tax_amount: cat.tax_amount,
      percent_of_total: totalSales > 0 ? (cat.gross_sales / totalSales) * 100 : 0,
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
        total_cost: result.reduce((sum, cat) => sum + cat.cost, 0),
        total_profit: result.reduce((sum, cat) => sum + cat.profit, 0),
        avg_margin: result.length > 0 ? result.reduce((sum, cat) => sum + cat.margin, 0) / result.length : 0,
      },
    });
  } catch (error: any) {
    logger.error("Sales by category error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load sales by category" },
      { status: 500 },
    );
  }
}
