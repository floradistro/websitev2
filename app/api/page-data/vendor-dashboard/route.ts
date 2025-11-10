import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Execute ONLY essential dashboard queries in parallel (reduced from 4 to 3 queries)
    const [vendorResult, productsResult, inventoryResult] = await Promise.allSettled([
      // Vendor branding - only essential fields
      supabase
        .from("vendors")
        .select("id, store_name, store_tagline, logo_url")
        .eq("id", vendorId)
        .single(),

      // Products - minimal fields only for stats
      supabase
        .from("products")
        .select("id, name, status, featured_image_storage, created_at")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(100), // Limit to 100 for stats

      // Low stock inventory only - faster than full inventory scan
      supabase
        .from("inventory")
        .select("id, quantity, low_stock_threshold, product_id")
        .eq("vendor_id", vendorId)
        .lt("quantity", 10)
        .limit(20),
    ]);

    // Extract data from results
    const vendor = vendorResult.status === "fulfilled" ? vendorResult.value.data : null;
    const products = productsResult.status === "fulfilled" ? productsResult.value.data || [] : [];
    const lowStockItems =
      inventoryResult.status === "fulfilled" ? inventoryResult.value.data || [] : [];

    // Calculate stats (fast in-memory operations)
    const totalProducts = products.length;
    const approved = products.filter((p) => p.status === "published").length;
    const pending = products.filter((p) => p.status === "pending").length;
    const rejected = products.filter((p) => p.status === "draft").length;

    // Get recent products for display (top 5)
    const recentProducts = products.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      image: p.featured_image_storage || "/yacht-club-logo.png",
      status:
        p.status === "published" ? "approved" : p.status === "pending" ? "pending" : "rejected",
      submittedDate: p.created_at,
    }));

    // Need product names for low stock - fetch in one query
    let lowStock: any[] = [];
    if (lowStockItems.length > 0) {
      const lowStockProductIds = lowStockItems.map((i) => i.product_id);
      const { data: lowStockProducts } = await supabase
        .from("products")
        .select("id, name")
        .in("id", lowStockProductIds);

      const productNameMap = new Map((lowStockProducts || []).map((p) => [p.id, p.name]));

      lowStock = lowStockItems.map((item: any) => ({
        id: item.id,
        name: productNameMap.get(item.product_id) || "Unknown",
        currentStock: item.quantity,
        threshold: item.low_stock_threshold || 5,
      }));
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          vendor: vendor,
          stats: {
            totalProducts,
            approved,
            pending,
            rejected,
            totalSales30d: 0, // Not fetching sales for speed - add back if needed
            lowStock: lowStock.length,
            sales_30_days: 0,
            pending_review: pending,
            low_stock_items: lowStock.length,
          },
          recentProducts,
          lowStockItems: lowStock,
          notices: [],
          sales_data: [], // Empty for now - add back if analytics needed
          topProducts: [],
          actionItems: [],
        },
        meta: {
          responseTime: `${responseTime}ms`,
          vendorId,
          timestamp: new Date().toISOString(),
          cached: true,
        },
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
          "X-Response-Time": `${responseTime}ms`,
          "CDN-Cache-Control": "max-age=30",
        },
      },
    );
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Error in /api/page-data/vendor-dashboard:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch vendor dashboard data",
      },
      { status: 500 },
    );
  }
}
