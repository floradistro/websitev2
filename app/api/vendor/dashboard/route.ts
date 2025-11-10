import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { getVendorDashboardData } from "@/lib/parallel-queries";
import { vendorCache, generateCacheKey } from "@/lib/cache-manager";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    // Try optimized parallel queries with caching first
    try {
      const dashboardData = await getVendorDashboardData(vendorId);

      const duration = performance.now() - startTime;

      // Get recent product submissions with images
      const supabase = getServiceSupabase();
      const { data: recentSubmissions } = await supabase
        .from("products")
        .select("id, name, featured_image_storage, featured_image, status, created_at")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(5);

      const mappedSubmissions = (recentSubmissions || []).map((p) => ({
        id: p.id,
        name: p.name,
        image: p.featured_image_storage || p.featured_image || "",
        status:
          p.status === "published" ? "approved" : p.status === "archived" ? "rejected" : "pending",
        submittedDate: new Date(p.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));

      // Calculate low stock from inventory
      const lowStockItems = dashboardData.inventory.filter(
        (inv: any) =>
          parseFloat(inv.quantity || 0) > 0 &&
          parseFloat(inv.quantity || 0) <= parseFloat(inv.low_stock_threshold || 10),
      );

      // Calculate 30-day sales
      const totalSales30d = dashboardData.orders.reduce(
        (sum: number, order: any) => sum + parseFloat(order.total || 0),
        0,
      );

      return NextResponse.json(
        {
          success: true,
          stats: {
            live_products: dashboardData.stats.publishedProducts || 0,
            pending_review: dashboardData.stats.pendingProducts || 0,
            sales_30_days: totalSales30d,
            low_stock_items: lowStockItems.length,
          },
          recent_products: mappedSubmissions,
          low_stock_details: lowStockItems.slice(0, 5).map((inv: any) => ({
            id: inv.id,
            product_id: inv.product_id,
            currentStock: inv.quantity,
            threshold: inv.low_stock_threshold,
          })),
          sales_data: dashboardData.orders.slice(0, 18).map((order: any) => ({
            date: order.created_at,
            revenue: parseFloat(order.total || 0),
          })),
        },
        {
          headers: {
            "X-Response-Time": `${duration.toFixed(2)}ms`,
            "Cache-Control": "private, s-maxage=60, stale-while-revalidate=30",
          },
        },
      );
    } catch (parallelError) {
      if (process.env.NODE_ENV === "development") {
        logger.warn("Optimized query failed, falling back to original", { error: parallelError });
      }
    }

    // Fallback to original implementation
    const supabase = getServiceSupabase();

    // Run all queries in parallel for instant response
    const [publishedProductsResult, pendingProductsResult, inventoryResult, ordersResult] =
      await Promise.all([
        // Live products (published with stock)
        supabase
          .from("products")
          .select("id, stock_quantity")
          .eq("vendor_id", vendorId)
          .eq("status", "published")
          .gt("stock_quantity", 0),

        // Pending review
        supabase.from("products").select("id").eq("vendor_id", vendorId).eq("status", "pending"),

        // Low stock items (quantity <= threshold)
        supabase
          .from("inventory")
          .select("id, quantity, low_stock_threshold, product_id")
          .eq("vendor_id", vendorId),

        // Recent orders (last 30 days)
        supabase
          .from("orders")
          .select(
            `
          id,
          total,
          created_at,
          order_items!inner(vendor_id)
        `,
          )
          .eq("order_items.vendor_id", vendorId)
          .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

    const liveProducts = publishedProductsResult.data || [];
    const pendingProducts = pendingProductsResult.data || [];
    const inventory = inventoryResult.data || [];
    const orders = ordersResult.data || [];

    // Calculate low stock (inventory where qty <= threshold)
    const lowStockItems = inventory.filter(
      (inv) =>
        parseFloat(inv.quantity || 0) > 0 &&
        parseFloat(inv.quantity || 0) <= parseFloat(inv.low_stock_threshold || 10),
    );

    // Calculate 30-day sales
    const totalSales30d = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

    // Get recent product submissions with images
    const { data: recentSubmissions } = await supabase
      .from("products")
      .select("id, name, featured_image_storage, featured_image, status, created_at")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(5);

    const mappedSubmissions = (recentSubmissions || []).map((p) => ({
      id: p.id,
      name: p.name,
      image: p.featured_image_storage || p.featured_image || "",
      status:
        p.status === "published" ? "approved" : p.status === "archived" ? "rejected" : "pending",
      submittedDate: new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

    return NextResponse.json({
      success: true,
      stats: {
        live_products: liveProducts.length,
        pending_review: pendingProducts.length,
        sales_30_days: totalSales30d,
        low_stock_items: lowStockItems.length,
      },
      recent_products: mappedSubmissions,
      low_stock_details: lowStockItems.slice(0, 5).map((inv) => ({
        id: inv.id,
        product_id: inv.product_id,
        currentStock: inv.quantity,
        threshold: inv.low_stock_threshold,
      })),
      sales_data: orders.slice(0, 18).map((order) => ({
        date: order.created_at,
        revenue: parseFloat(order.total || 0),
      })),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Dashboard error:", err);
    }
    return NextResponse.json(
      {
        error: err.message,
        stats: {
          live_products: 0,
          pending_review: 0,
          sales_30_days: 0,
          low_stock_items: 0,
        },
      },
      { status: 500 },
    );
  }
}
