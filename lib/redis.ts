/**
 * Redis Caching Layer using Upstash
 *
 * Provides type-safe caching with automatic invalidation patterns
 * and integrated monitoring via Sentry.
 */

import { Redis } from "@upstash/redis";
import { logger } from "./logger";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL presets (in seconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute - frequently changing data
  MEDIUM: 300, // 5 minutes - moderately stable data
  LONG: 900, // 15 minutes - stable data
  HOUR: 3600, // 1 hour - rarely changing data
  DAY: 86400, // 24 hours - static data
} as const;

// Cache key prefixes for organization
export const CachePrefix = {
  PRODUCT: "product",
  PRODUCTS_LIST: "products:list",
  VENDOR: "vendor",
  CATEGORY: "category",
  INVENTORY: "inventory",
  ANALYTICS: "analytics",
  USER: "user",
  SESSION: "session",
} as const;

/**
 * Type-safe cache get function
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);

    if (data) {
      logger.debug(`Cache hit: ${key}`);
    } else {
      logger.debug(`Cache miss: ${key}`);
    }

    return data;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}`, error as Error);
    return null; // Fail gracefully
  }
}

/**
 * Type-safe cache set function with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = CacheTTL.MEDIUM,
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    logger.error(`Redis SET error for key ${key}`, error as Error);
    // Don't throw - caching is optional
  }
}

/**
 * Delete a single cache key
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
    logger.debug(`Cache deleted: ${key}`);
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}`, error as Error);
  }
}

/**
 * Delete multiple cache keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      logger.debug(`No keys found matching pattern: ${pattern}`);
      return 0;
    }

    await redis.del(...keys);
    logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    return keys.length;
  } catch (error) {
    logger.error(`Redis pattern delete error for pattern ${pattern}`, error as Error);
    return 0;
  }
}

/**
 * Cache-aside pattern with automatic fallback
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM,
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  logger.debug(`Cache miss, fetching fresh data: ${key}`);
  const data = await fetchFn();

  // Store in cache for next time
  await cacheSet(key, data, ttl);

  return data;
}

/**
 * Generate cache key with prefix
 */
export function buildCacheKey(
  prefix: string,
  ...parts: (string | number | undefined | null)[]
): string {
  const cleanParts = parts.filter((p) => p != null).map(String);
  return `${prefix}:${cleanParts.join(":")}`;
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate all product caches for a vendor
   */
  async products(vendorId: string): Promise<void> {
    await Promise.all([
      cacheDelPattern(`${CachePrefix.PRODUCTS_LIST}:${vendorId}:*`),
      cacheDelPattern(`${CachePrefix.PRODUCT}:*`),
    ]);
  },

  /**
   * Invalidate a specific product's cache
   */
  async product(productId: string): Promise<void> {
    await cacheDel(buildCacheKey(CachePrefix.PRODUCT, productId));
  },

  /**
   * Invalidate vendor cache
   */
  async vendor(vendorId: string): Promise<void> {
    await Promise.all([
      cacheDel(buildCacheKey(CachePrefix.VENDOR, vendorId)),
      cacheDelPattern(`${CachePrefix.PRODUCTS_LIST}:${vendorId}:*`),
      cacheDelPattern(`${CachePrefix.ANALYTICS}:${vendorId}:*`),
    ]);
  },

  /**
   * Invalidate inventory cache for a location
   */
  async inventory(locationId: string, productId?: string): Promise<void> {
    if (productId) {
      await cacheDel(buildCacheKey(CachePrefix.INVENTORY, locationId, productId));
    } else {
      await cacheDelPattern(`${CachePrefix.INVENTORY}:${locationId}:*`);
    }
  },

  /**
   * Invalidate category cache
   */
  async category(categoryId: string): Promise<void> {
    await cacheDel(buildCacheKey(CachePrefix.CATEGORY, categoryId));
  },

  /**
   * Clear all cache (use sparingly!)
   */
  async all(): Promise<void> {
    logger.warn("Clearing ALL cache - this should be rare!");
    const keys = await redis.keys("*");
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} cache keys`);
    }
  },
};

/**
 * Health check for Redis connection
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error("Redis health check failed", error as Error);
    return false;
  }
}

// Export Redis client for advanced use cases
export { redis };
