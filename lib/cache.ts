/**
 * In-Memory LRU Cache for Query Results
 * Reduces database load for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hits: number;
}

export class LRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 60000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update hit counter and move to end (most recently used)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      hits: 0,
    });
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidate by pattern (e.g., all vendor-specific keys)
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      avgHitsPerEntry: entries.length > 0
        ? entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length
        : 0,
    };
  }
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  cache: LRUCache<T>,
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
}

// Global cache instances for different data types
export const queryCache = new LRUCache(1000, 60000); // 1000 entries, 60s TTL
export const vendorCache = new LRUCache(500, 300000); // 500 entries, 5min TTL
export const productCache = new LRUCache(2000, 120000); // 2000 entries, 2min TTL

/**
 * Helper to generate cache keys
 */
export const CacheKeys = {
  vendor: (vendorId: string) => `vendor:${vendorId}`,
  vendorProducts: (vendorId: string, limit: number) => `vendor:${vendorId}:products:${limit}`,
  vendorLocations: (vendorId: string) => `vendor:${vendorId}:locations`,
  product: (productId: string) => `product:${productId}`,
  pricingConfig: (vendorId: string) => `pricing:${vendorId}`,
  dashboardStats: (vendorId: string) => `dashboard:${vendorId}`,
};

/**
 * Cache invalidation helpers
 */
export const invalidateVendor = (vendorId: string) => {
  queryCache.invalidatePattern(vendorId);
  vendorCache.delete(CacheKeys.vendor(vendorId));
};

export const invalidateProduct = (productId: string, vendorId: string) => {
  productCache.delete(CacheKeys.product(productId));
  queryCache.invalidatePattern(vendorId); // Invalidate vendor products list
};

