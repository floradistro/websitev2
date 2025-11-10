import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import { parseDateRange, parseFilters, parseQueryOptions, paginate } from "@/lib/analytics/query-helpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/sales/itemized
 * Itemized transaction details
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);
    const options = parseQueryOptions(searchParams);

    // Get orders with items
    let ordersQuery = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        order_date,
        customer_id,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        pickup_location_id,
        locations(name),
        order_items(
          product_id,
          product_name,
          quantity,
          unit_price,
          line_total,
          tax_amount
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("order_date", dateRange.start_date)
      .lte("order_date", dateRange.end_date)
      .in("status", ["completed", "processing"])
      .order("order_date", { ascending: false });

    if (filters.location_ids && filters.location_ids.length > 0) {
      ordersQuery = ordersQuery.in("pickup_location_id", filters.location_ids);
    }

    const { data: orders, error } = await ordersQuery;

    if (error) throw error;

    if (!orders || orders.length === 0) {
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

    // Get all unique product IDs from order items
    const productIds = new Set<string>();
    orders.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        if (item.product_id) productIds.add(item.product_id);
      });
    });

    // Get products with categories if we have product IDs
    let productCategoryMap = new Map();
    if (productIds.size > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, primary_category_id, categories(name)")
        .in("id", Array.from(productIds));

      products?.forEach((p: any) => {
        productCategoryMap.set(p.id, p.categories?.name || "Uncategorized");
      });
    }

    // Format itemized sales
    const itemizedSales = orders.map((order: any) => ({
      transaction_id: order.id,
      transaction_number: order.order_number,
      transaction_date: order.order_date,
      location_name: order.locations?.name || "Unknown",
      employee_name: "N/A", // Would need to add employee tracking
      customer_id: order.customer_id,
      items: (order.order_items || []).map((item: any) => ({
        product_name: item.product_name,
        category: productCategoryMap.get(item.product_id) || "Uncategorized",
        quantity: parseFloat(item.quantity || "0"),
        unit_price: parseFloat(item.unit_price || "0"),
        line_total: parseFloat(item.line_total || "0"),
        discount: 0, // Would need item-level discount tracking
        tax: parseFloat(item.tax_amount || "0"),
      })),
      subtotal: parseFloat(order.subtotal || "0"),
      tax: parseFloat(order.tax_amount || "0"),
      discount: parseFloat(order.discount_amount || "0"),
      total: parseFloat(order.total_amount || "0"),
      payment_method: order.payment_method || "Unknown",
    }));

    // Paginate
    const result = paginate(itemizedSales, options.page, options.limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...result.metadata,
      },
    });
  } catch (error: any) {
    logger.error("Itemized sales error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load itemized sales" },
      { status: 500 },
    );
  }
}
