import { NextRequest, NextResponse } from "next/server";
import { monitor } from "@/lib/performance-monitor";
import { productCache, vendorCache, inventoryCache } from "@/lib/cache-manager";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Performance monitoring dashboard endpoint
 * Provides real-time system health metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Get performance summary
    const summary = monitor.getSummary();

    // Get cache sizes
    const cacheStatus = {
      product: productCache.getStats(),
      vendor: vendorCache.getStats(),
      inventory: inventoryCache.getStats(),
    };

    // Get cache statistics
    const cacheStats = monitor.getCacheStats();

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        health: {
          score: summary.healthScore,
          status:
            summary.healthScore >= 90
              ? "excellent"
              : summary.healthScore >= 70
                ? "good"
                : summary.healthScore >= 50
                  ? "fair"
                  : "poor",
        },
        performance: summary.operations,
        cache: {
          hitRate: cacheStats.hitRate.toFixed(2) + "%",
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          total: cacheStats.total,
          sizes: cacheStatus,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Performance stats error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
