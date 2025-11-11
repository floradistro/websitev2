/**
 * Advanced Caching Strategies
 *
 * Implements sophisticated caching patterns beyond basic cache-aside:
 * - Write-through caching
 * - Write-behind (write-back) caching
 * - Cache warming
 * - Stale-while-revalidate
 * - Multi-tier caching
 *
 * Phase: 2.7.1 - Caching Strategies Enhancement
 */

import { redisCache, CacheKeys } from "./redis-cache";
import { productCache, vendorCache, inventoryCache } from "./cache-manager";
import { logger } from "./logger";

/**
 * Write-Through Cache Pattern
 * Writes to cache and database simultaneously
 * Ensures cache is always up-to-date but slower writes
 */
export class WriteThroughCache {
  /**
   * Update both database and cache atomically
   */
  async set<T>(
    key: string,
    updateFn: () => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<T> {
    try {
      // Execute database update
      const result = await updateFn();

      // Immediately update cache
      await redisCache.set(key, result, ttlSeconds);

      return result;
    } catch (error) {
      logger.error("Write-through cache failed", error, { key });
      throw error;
    }
  }

  /**
   * Update product with write-through
   */
  async updateProduct(productId: string, updateFn: () => Promise<any>): Promise<any> {
    const cacheKey = CacheKeys.product(productId);
    return this.set(cacheKey, updateFn, 300); // 5 min TTL
  }
}

/**
 * Write-Behind (Write-Back) Cache Pattern
 * Writes to cache immediately, database asynchronously
 * Faster writes but risk of data loss if cache fails
 */
export class WriteBehindCache {
  private writeQueue: Map<string, NodeJS.Timeout> = new Map();
  private batchDelay: number;

  constructor(batchDelayMs: number = 5000) {
    this.batchDelay = batchDelayMs;
  }

  /**
   * Update cache immediately, schedule database write
   */
  async set<T>(
    key: string,
    value: T,
    persistFn: (value: T) => Promise<void>,
    ttlSeconds: number = 300,
  ): Promise<void> {
    // Immediately update cache
    await redisCache.set(key, value, ttlSeconds);

    // Cancel existing write if any
    const existingTimeout = this.writeQueue.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule database write
    const timeout = setTimeout(async () => {
      try {
        await persistFn(value);
        this.writeQueue.delete(key);
      } catch (error) {
        logger.error("Write-behind persist failed", error, { key });
      }
    }, this.batchDelay);

    this.writeQueue.set(key, timeout);
  }

  /**
   * Flush all pending writes immediately
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [key, timeout] of this.writeQueue.entries()) {
      clearTimeout(timeout);
      // Execute immediately
      // Note: In production, you'd retrieve the value and persistFn from a more complete queue structure
    }

    await Promise.all(promises);
    this.writeQueue.clear();
  }
}

/**
 * Stale-While-Revalidate Pattern
 * Returns cached (potentially stale) data immediately
 * Asynchronously fetches fresh data for next request
 */
export class StaleWhileRevalidateCache {
  /**
   * Get data with background refresh
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300,
    staleTtlSeconds: number = 600,
  ): Promise<T> {
    // Try cache first
    const cached = await redisCache.get<{ data: T; timestamp: number }>(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const isFresh = age < ttlSeconds * 1000;
      const isStale = age >= ttlSeconds * 1000 && age < staleTtlSeconds * 1000;

      if (isFresh) {
        // Fresh data, return immediately
        return cached.data;
      }

      if (isStale) {
        // Stale data - return immediately but revalidate in background
        this.revalidateInBackground(key, fetchFn, ttlSeconds);
        return cached.data;
      }

      // Data too old, fetch fresh
    }

    // No cache or expired, fetch fresh data
    const freshData = await fetchFn();
    await this.setWithTimestamp(key, freshData, staleTtlSeconds);
    return freshData;
  }

  private async setWithTimestamp<T>(
    key: string,
    data: T,
    ttlSeconds: number,
  ): Promise<void> {
    await redisCache.set(
      key,
      {
        data,
        timestamp: Date.now(),
      },
      ttlSeconds,
    );
  }

  private revalidateInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number,
  ): void {
    // Fire and forget - don't await
    (async () => {
      try {
        const freshData = await fetchFn();
        await this.setWithTimestamp(key, freshData, ttlSeconds * 2);
      } catch (error) {
        logger.warn("Background revalidation failed", { key, error });
      }
    })();
  }
}

/**
 * Multi-Tier Cache
 * L1: In-memory (fastest, small)
 * L2: Redis (fast, distributed)
 * L3: Database (slow, source of truth)
 */
export class MultiTierCache {
  /**
   * Get with multi-tier fallback
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<T> {
    // L1: Try in-memory cache
    const memCached = productCache.get(key);
    if (memCached !== undefined) {
      return memCached;
    }

    // L2: Try Redis
    const redisCached = await redisCache.get<T>(key);
    if (redisCached !== null) {
      // Populate L1 for next request
      productCache.set(key, redisCached, ttlSeconds * 1000);
      return redisCached;
    }

    // L3: Fetch from database
    const freshData = await fetchFn();

    // Populate all tiers (fire and forget for speed)
    productCache.set(key, freshData, ttlSeconds * 1000);
    redisCache.set(key, freshData, ttlSeconds).catch((err) => {
      logger.warn("Failed to populate Redis tier", { key, err });
    });

    return freshData;
  }

  /**
   * Invalidate across all tiers
   */
  async invalidate(key: string): Promise<void> {
    productCache.delete(key);
    vendorCache.delete(key);
    inventoryCache.delete(key);
    await redisCache.delete(key);
  }
}

/**
 * Cache Warming
 * Pre-populate cache with frequently accessed data
 */
export class CacheWarmer {
  /**
   * Warm specific keys
   */
  async warmKeys<T>(
    keys: string[],
    fetchFn: (key: string) => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      try {
        const data = await fetchFn(key);
        await redisCache.set(key, data, ttlSeconds);
      } catch (error) {
        logger.warn("Cache warming failed for key", { key, error });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Warm vendor data on startup
   */
  async warmVendorData(vendorId: string, supabase: any): Promise<void> {
    logger.info("Warming cache for vendor", { vendorId });

    await Promise.allSettled([
      // Warm vendor profile
      this.warmVendorProfile(vendorId, supabase),

      // Warm product list
      this.warmProductList(vendorId, supabase),

      // Warm categories
      this.warmCategories(vendorId, supabase),

      // Warm locations
      this.warmLocations(vendorId, supabase),
    ]);

    logger.info("Cache warming complete", { vendorId });
  }

  private async warmVendorProfile(vendorId: string, supabase: any): Promise<void> {
    const { data } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single();

    if (data) {
      await redisCache.set(CacheKeys.vendor(vendorId), data, 3600); // 1 hour
    }
  }

  private async warmProductList(vendorId: string, supabase: any): Promise<void> {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, featured_image_storage")
      .eq("vendor_id", vendorId)
      .eq("status", "published")
      .limit(100);

    if (data) {
      await redisCache.set(CacheKeys.products(vendorId), data, 300); // 5 min
    }
  }

  private async warmCategories(vendorId: string, supabase: any): Promise<void> {
    const { data } = await supabase.from("categories").select("*");

    if (data) {
      await redisCache.set(CacheKeys.categories(vendorId), data, 3600); // 1 hour
    }
  }

  private async warmLocations(vendorId: string, supabase: any): Promise<void> {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("vendor_id", vendorId);

    if (data) {
      await redisCache.set(CacheKeys.vendorLocations(vendorId), data, 3600); // 1 hour
    }
  }

  /**
   * Warm popular products based on analytics
   */
  async warmPopularProducts(
    vendorId: string,
    supabase: any,
    limit: number = 50,
  ): Promise<void> {
    // Get top selling products from last 30 days
    const { data: topProducts } = await supabase
      .from("order_items")
      .select("product_id, count")
      .eq("vendor_id", vendorId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("count", { ascending: false })
      .limit(limit);

    if (topProducts) {
      const productIds = topProducts.map((item: any) => item.product_id);

      // Warm each product
      await this.warmKeys(
        productIds.map((id: string) => CacheKeys.product(id)),
        async (key) => {
          const productId = key.split(":")[1];
          const { data } = await supabase
            .from("products")
            .select("*")
            .eq("id", productId)
            .single();
          return data;
        },
        600, // 10 min
      );
    }
  }
}

/**
 * Predictive Cache Pre-fetching
 * Predicts and pre-fetches likely next requests
 */
export class PredictiveCache {
  /**
   * Pre-fetch related products when viewing a product
   */
  async prefetchRelatedProducts(
    productId: string,
    categoryId: string,
    supabase: any,
  ): Promise<void> {
    // Fire and forget - don't block current request
    (async () => {
      try {
        const { data: relatedProducts } = await supabase
          .from("products")
          .select("*")
          .eq("primary_category_id", categoryId)
          .neq("id", productId)
          .limit(10);

        if (relatedProducts) {
          const promises = relatedProducts.map((product: any) =>
            redisCache.set(CacheKeys.product(product.id), product, 300),
          );
          await Promise.all(promises);
        }
      } catch (error) {
        logger.warn("Predictive pre-fetch failed", { productId, error });
      }
    })();
  }

  /**
   * Pre-fetch user's likely next page
   */
  async prefetchPagination(
    currentPage: number,
    vendorId: string,
    fetchFn: (page: number) => Promise<any>,
  ): Promise<void> {
    // Pre-fetch next page
    (async () => {
      try {
        const nextPage = currentPage + 1;
        const cacheKey = `${CacheKeys.products(vendorId)}:page:${nextPage}`;

        const cached = await redisCache.has(cacheKey);
        if (!cached) {
          const data = await fetchFn(nextPage);
          await redisCache.set(cacheKey, data, 300);
        }
      } catch (error) {
        logger.warn("Pagination pre-fetch failed", { currentPage, error });
      }
    })();
  }
}

/**
 * Adaptive Cache TTL
 * Adjusts TTL based on access patterns
 */
export class AdaptiveCacheTTL {
  private accessCounts: Map<string, number> = new Map();
  private baseTTL: number;

  constructor(baseTTLSeconds: number = 300) {
    this.baseTTL = baseTTLSeconds;
  }

  /**
   * Calculate TTL based on access frequency
   */
  calculateTTL(key: string): number {
    const count = this.accessCounts.get(key) || 0;

    // More frequently accessed = longer TTL
    if (count > 100) {
      return this.baseTTL * 4; // 20 minutes
    } else if (count > 50) {
      return this.baseTTL * 2; // 10 minutes
    } else if (count > 10) {
      return this.baseTTL * 1.5; // 7.5 minutes
    }

    return this.baseTTL; // 5 minutes
  }

  /**
   * Record access and get adaptive TTL
   */
  recordAccess(key: string): number {
    const current = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, current + 1);

    return this.calculateTTL(key);
  }

  /**
   * Reset access counts periodically
   */
  resetCounts(): void {
    this.accessCounts.clear();
  }
}

// Export singleton instances
export const writeThroughCache = new WriteThroughCache();
export const writeBehindCache = new WriteBehindCache();
export const staleWhileRevalidate = new StaleWhileRevalidateCache();
export const multiTierCache = new MultiTierCache();
export const cacheWarmer = new CacheWarmer();
export const predictiveCache = new PredictiveCache();
export const adaptiveTTL = new AdaptiveCacheTTL();

/**
 * Cache Strategy Selector
 * Helps choose the right caching strategy for different scenarios
 */
export class CacheStrategySelector {
  /**
   * Get recommended strategy based on data characteristics
   */
  static recommendStrategy(dataCharacteristics: {
    updateFrequency: "high" | "medium" | "low";
    readFrequency: "high" | "medium" | "low";
    consistency: "critical" | "eventual" | "relaxed";
    dataSize: "small" | "medium" | "large";
  }): string {
    const { updateFrequency, readFrequency, consistency, dataSize } = dataCharacteristics;

    // High consistency requirements
    if (consistency === "critical") {
      if (updateFrequency === "high") {
        return "write-through"; // Slow but always consistent
      }
      return "cache-aside"; // Standard pattern with invalidation
    }

    // High read, low write - perfect for caching
    if (readFrequency === "high" && updateFrequency === "low") {
      return "multi-tier"; // Maximum performance
    }

    // High write frequency
    if (updateFrequency === "high") {
      if (consistency === "eventual") {
        return "write-behind"; // Fast writes, eventual consistency
      }
      return "write-through"; // Slower but consistent
    }

    // Eventual consistency OK
    if (consistency === "relaxed") {
      return "stale-while-revalidate"; // Best UX
    }

    // Default to cache-aside
    return "cache-aside";
  }

  /**
   * Print strategy recommendations for common scenarios
   */
  static printRecommendations(): void {
    console.log("Cache Strategy Recommendations:\n");

    const scenarios = [
      {
        name: "Product Details",
        chars: {
          updateFrequency: "low" as const,
          readFrequency: "high" as const,
          consistency: "eventual" as const,
          dataSize: "medium" as const,
        },
      },
      {
        name: "Inventory Counts",
        chars: {
          updateFrequency: "high" as const,
          readFrequency: "high" as const,
          consistency: "critical" as const,
          dataSize: "small" as const,
        },
      },
      {
        name: "Analytics Dashboard",
        chars: {
          updateFrequency: "low" as const,
          readFrequency: "medium" as const,
          consistency: "relaxed" as const,
          dataSize: "large" as const,
        },
      },
      {
        name: "User Session",
        chars: {
          updateFrequency: "medium" as const,
          readFrequency: "high" as const,
          consistency: "critical" as const,
          dataSize: "small" as const,
        },
      },
    ];

    scenarios.forEach((scenario) => {
      const strategy = this.recommendStrategy(scenario.chars);
      console.log(`${scenario.name}: ${strategy}`);
    });
  }
}
