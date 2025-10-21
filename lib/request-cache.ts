/**
 * Request Cache & Deduplication Layer
 * Prevents duplicate API calls and provides instant responses from cache
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>>;
  private pendingRequests: Map<string, Promise<any>>;
  private readonly defaultTTL = 60000; // 60 seconds
  private readonly maxCacheSize = 1000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.startCleanup();
  }

  private startCleanup() {
    // Clean expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.defaultTTL) {
          this.cache.delete(key);
        }
      }
      
      // Limit cache size
      if (this.cache.size > this.maxCacheSize) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(0, this.cache.size - this.maxCacheSize);
        toDelete.forEach(([key]) => this.cache.delete(key));
      }
    }, 30000);
  }

  /**
   * Get or fetch data with automatic deduplication
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = fetcher()
      .then((data) => {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
        });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Set cache manually
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate specific key or pattern
   */
  invalidate(keyOrPattern: string): void {
    if (keyOrPattern.includes('*')) {
      const pattern = keyOrPattern.replace('*', '');
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.delete(keyOrPattern);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxSize: this.maxCacheSize,
    };
  }
}

// Global singleton
export const requestCache = new RequestCache();

// Browser cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    requestCache.destroy();
  });
}

