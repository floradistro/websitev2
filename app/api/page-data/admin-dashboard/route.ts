import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = getServiceSupabase();
    const timeRange = request.nextUrl.searchParams.get("range") || "30d";

    // Calculate date range
    const daysMap: any = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[timeRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Execute ALL admin dashboard queries in parallel
    const [vendorsResult, productsResult, ordersResult, pendingProductsResult, lowStockResult] =
      await Promise.allSettled([
        // All vendors with product counts
        supabase
          .from("vendors")
          .select("id, store_name, status, created_at")
          .order("created_at", { ascending: false }),

        // All products with stats
        supabase
          .from("products")
          .select("id, name, status, vendor_id, stock_quantity, price, created_at")
          .order("created_at", { ascending: false })
          .limit(100),

        // Recent orders
        supabase
          .from("orders")
          .select("id, total, status, created_at, customer_email")
          .gte("created_at", startDate)
          .order("created_at", { ascending: false })
          .limit(50),

        // Pending products (for approvals)
        supabase
          .from("products")
          .select(
            `
          id,
          name,
          status,
          price,
          stock_quantity,
          featured_image_storage,
          created_at,
          vendor:vendors(id, store_name)
        `,
          )
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(20),

        // Low stock across all vendors
        supabase
          .from("inventory")
          .select(
            `
          id,
          quantity,
          low_stock_threshold,
          product:products(id, name, vendor_id),
          vendor:vendors(id, store_name)
        `,
          )
          .lt("quantity", 10)
          .limit(20),
      ]);

    // Extract data
    const vendors = vendorsResult.status === "fulfilled" ? vendorsResult.value.data || [] : [];
    const products = productsResult.status === "fulfilled" ? productsResult.value.data || [] : [];
    const orders = ordersResult.status === "fulfilled" ? ordersResult.value.data || [] : [];
    const pendingProducts =
      pendingProductsResult.status === "fulfilled" ? pendingProductsResult.value.data || [] : [];
    const lowStock = lowStockResult.status === "fulfilled" ? lowStockResult.value.data || [] : [];

    // Calculate analytics stats
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Product stats
    const publishedProducts = products.filter((p) => p.status === "published").length;
    const pendingCount = products.filter((p) => p.status === "pending").length;

    // Vendor stats
    const activeVendors = vendors.filter((v) => v.status === "active").length;

    // Format pending products for approvals page
    const formattedPendingProducts = pendingProducts.map((p: any) => {
      const vendor = Array.isArray(p.vendor) ? p.vendor[0] : p.vendor;
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock_quantity,
        vendor: vendor?.store_name || "Unknown",
        vendorId: vendor?.id,
        submittedDate: p.created_at,
        image: p.featured_image_storage || "/yacht-club-logo.png",
      };
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          // Overview stats
          stats: {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            activeVendors,
            totalProducts: products.length,
            publishedProducts,
            pendingApprovals: pendingCount,
            lowStockAlerts: lowStock.length,
          },

          // Analytics data
          analytics: {
            revenueData: [], // Can add time-series if needed
            categoryData: [],
          },

          // Pending products for approvals
          pendingProducts: formattedPendingProducts,

          // Low stock alerts
          lowStockItems: lowStock.map((item: any) => {
            const vendor = Array.isArray(item.vendor) ? item.vendor[0] : item.vendor;
            const product = Array.isArray(item.product) ? item.product[0] : item.product;
            return {
              id: item.id,
              productName: product?.name || "Unknown",
              vendorName: vendor?.store_name || "Unknown",
              currentStock: item.quantity,
              threshold: item.low_stock_threshold || 5,
            };
          }),

          // Recent activity
          recentOrders: orders.slice(0, 10).map((o) => ({
            id: o.id,
            total: o.total,
            status: o.status,
            customer: o.customer_email,
            date: o.created_at,
          })),

          // Vendors list
          vendors: vendors.map((v) => ({
            id: v.id,
            name: v.store_name,
            status: v.status,
            joinedDate: v.created_at,
          })),

          // Products list
          products: products.slice(0, 20).map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            price: p.price,
            stock: p.stock_quantity,
            vendorId: p.vendor_id,
          })),
        },
        meta: {
          responseTime: `${responseTime}ms`,
          timeRange,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60", // Cache for 1 minute
          "X-Response-Time": `${responseTime}ms`,
        },
      },
    );
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Error in /api/page-data/admin-dashboard:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch admin dashboard data",
      },
      { status: 500 },
    );
  }
}
