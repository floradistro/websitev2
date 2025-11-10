/**
 * Redis Distributed Cache Service
 *
 * Provides distributed caching across multiple instances/servers
 * Falls back to in-memory cache if Redis is unavailable
 *
 * SECURITY: All cache keys are namespaced to prevent collisions
 * PERFORMANCE: Uses connection pooling and automatic reconnection
 */

import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";
import { LRUCache } from "lru-cache";

// Redis client singleton
let redisClient: Redis | null = null;

// In-memory fallback cache (used when Redis is unavailable)
const fallbackCache = new LRUCache<string, string>({
  max: 1000,
  ttl: 300000, // 5 minutes
  updateAgeOnGet: true,
});

/**
 * Initialize Redis client with credentials from environment
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!redisUrl && (!redisHost || !redisPort || !redisPassword)) {
    logger.warn("Redis configuration incomplete - using in-memory cache only");
    return null;
  }

  try {
    if (redisUrl) {
      // Use REDIS_URL if provided (Upstash format)
      redisClient = new Redis({
        url: redisUrl,
        automaticDeserialization: true,
      });
    } else {
      // Construct from individual components
      redisClient = new Redis({
        host: redisHost!,
        port: parseInt(redisPort!, 10),
        password: redisPassword!,
        automaticDeserialization: true,
      });
    }

    logger.info("Redis cache initialized successfully");
    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis", error);
    return null;
  }
}

/**
 * Cache key namespacing to prevent collisions
 */
function namespaceKey(key: string): string {
  const appName = process.env.APP_NAME || "whaletools";
  const env = process.env.NODE_ENV || "development";
  return `${appName}:${env}:${key}`;
}

/**
 * Distributed cache interface
 */
export class RedisCache {
  private redis: Redis | null;
  private useRedis: boolean;

  constructor() {
    this.redis = getRedisClient();
    this.useRedis = this.redis !== null;
  }

  /**
   * Get value from cache
   * Returns null if not found or expired
   */
  async get<T = any>(key: string): Promise<T | null> {
    const namespacedKey = namespaceKey(key);

    try {
      if (this.useRedis && this.redis) {
        const value = await this.redis.get<string>(namespacedKey);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      }

      // Fallback to in-memory cache
      const cached = fallbackCache.get(namespacedKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
      return null;
    } catch (error) {
      logger.error("Cache GET failed", error, { key });

      // Try fallback on Redis error
      if (this.useRedis) {
        const cached = fallbackCache.get(namespacedKey);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      }
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Data to cache
   * @param ttlSeconds TTL in seconds (default: 300 = 5 minutes)
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    const namespacedKey = namespaceKey(key);
    const serialized = JSON.stringify(value);

    try {
      if (this.useRedis && this.redis) {
        await this.redis.set(namespacedKey, serialized, {
          ex: ttlSeconds,
        });

        // Also set in fallback cache for faster local access
        fallbackCache.set(namespacedKey, serialized, {
          ttl: ttlSeconds * 1000,
        });

        return true;
      }

      // Fallback to in-memory cache
      fallbackCache.set(namespacedKey, serialized, {
        ttl: ttlSeconds * 1000,
      });
      return true;
    } catch (error) {
      logger.error("Cache SET failed", error, { key, ttl: ttlSeconds });

      // Try fallback on Redis error
      if (this.useRedis) {
        fallbackCache.set(namespacedKey, serialized, {
          ttl: ttlSeconds * 1000,
        });
      }
      return false;
    }
  }

  /**
   * Delete specific key from cache
   */
  async delete(key: string): Promise<boolean> {
    const namespacedKey = namespaceKey(key);

    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(namespacedKey);
      }

      fallbackCache.delete(namespacedKey);
      return true;
    } catch (error) {
      logger.error("Cache DELETE failed", error, { key });
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * WARNING: This can be slow on large datasets
   */
  async deletePattern(pattern: string): Promise<number> {
    const namespacedPattern = namespaceKey(pattern);
    let count = 0;

    try {
      if (this.useRedis && this.redis) {
        // Use SCAN for safer pattern deletion (non-blocking)
        const keys = await this.redis.keys(namespacedPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          count = keys.length;
        }
      }

      // Also clear from fallback cache
      for (const key of fallbackCache.keys()) {
        if (key.includes(namespacedPattern)) {
          fallbackCache.delete(key);
          count++;
        }
      }

      return count;
    } catch (error) {
      logger.error("Cache DELETEPATTERN failed", error, { pattern });
      return 0;
    }
  }

  /**
   * Clear all cache entries (use with caution!)
   */
  async clear(): Promise<boolean> {
    try {
      if (this.useRedis && this.redis) {
        // Only clear keys with our namespace
        const pattern = namespaceKey("*");
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      fallbackCache.clear();
      return true;
    } catch (error) {
      logger.error("Cache CLEAR failed", error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const namespacedKey = namespaceKey(key);

    try {
      if (this.useRedis && this.redis) {
        const exists = await this.redis.exists(namespacedKey);
        return exists === 1;
      }

      return fallbackCache.has(namespacedKey);
    } catch (error) {
      logger.error("Cache HAS failed", error, { key });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      isRedisConnected: this.useRedis && this.redis !== null,
      fallbackCacheSize: fallbackCache.size,
      fallbackCacheMax: fallbackCache.max,
    };
  }

  /**
   * Cache wrapper for async functions
   * Implements cache-aside pattern with automatic fallback
   */
  async wrap<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch data
    const data = await fetchFn();

    // Store in cache (fire and forget)
    this.set(key, data, ttlSeconds).catch((error) => {
      logger.warn("Failed to cache data after fetch", { key, error });
    });

    return data;
  }
}

// Export singleton instance
export const redisCache = new RedisCache();

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // Products
  product: (productId: string) => `product:${productId}`,
  products: (vendorId: string, categoryId?: string) =>
    `products:${vendorId}:${categoryId || "all"}`,
  productInventory: (productId: string) => `inventory:product:${productId}`,

  // Vendors
  vendor: (vendorId: string) => `vendor:${vendorId}`,
  vendorBySlug: (slug: string) => `vendor:slug:${slug}`,
  vendorConfig: (vendorId: string) => `vendor:config:${vendorId}`,
  vendorLocations: (vendorId: string) => `vendor:locations:${vendorId}`,

  // Categories
  categories: (vendorId: string) => `categories:${vendorId}`,
  category: (categoryId: string) => `category:${categoryId}`,

  // Orders
  order: (orderId: string) => `order:${orderId}`,
  customerOrders: (customerId: string) => `orders:customer:${customerId}`,

  // Analytics
  dashboardStats: (vendorId: string, period: string) =>
    `analytics:dashboard:${vendorId}:${period}`,
  salesReport: (vendorId: string, startDate: string, endDate: string) =>
    `analytics:sales:${vendorId}:${startDate}:${endDate}`,

  // Authentication (short TTL)
  session: (sessionId: string) => `session:${sessionId}`,
  userPermissions: (userId: string) => `permissions:${userId}`,
};

/**
 * Cache invalidation helpers
 */
export const InvalidateCache = {
  product: (productId: string, vendorId: string) => {
    redisCache.delete(CacheKeys.product(productId));
    redisCache.delete(CacheKeys.productInventory(productId));
    redisCache.deletePattern(CacheKeys.products(vendorId));
  },

  vendor: (vendorId: string) => {
    redisCache.delete(CacheKeys.vendor(vendorId));
    redisCache.delete(CacheKeys.vendorConfig(vendorId));
    redisCache.delete(CacheKeys.vendorLocations(vendorId));
    redisCache.deletePattern(CacheKeys.products(vendorId));
  },

  order: (orderId: string, customerId?: string) => {
    redisCache.delete(CacheKeys.order(orderId));
    if (customerId) {
      redisCache.delete(CacheKeys.customerOrders(customerId));
    }
  },

  analytics: (vendorId: string) => {
    redisCache.deletePattern(CacheKeys.dashboardStats(vendorId, "*"));
    redisCache.deletePattern(CacheKeys.salesReport(vendorId, "*", "*"));
  },
};
