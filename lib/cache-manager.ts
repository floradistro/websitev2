import { LRUCache } from 'lru-cache';
import { monitor } from './performance-monitor';

interface CacheOptions {
  ttl: number; // milliseconds
  max: number; // max items
}

class QueryCache {
  private cache: LRUCache<string, any>;
  
  constructor(options: CacheOptions = { ttl: 60000, max: 1000 }) {
    this.cache = new LRUCache({
      max: options.max,
      ttl: options.ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    });
  }
  
  get(key: string): any | undefined {
    const value = this.cache.get(key);
    const isHit = value !== undefined;
    
    // Record cache access in monitoring
    monitor.recordCacheAccess(key, isHit);
    
    if (isHit) {
      }
    return value;
  }
  
  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, value, { ttl });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Invalidate by pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    }
  
  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl,
    };
  }
}

// Export singleton instances with appropriate TTLs
export const productCache = new QueryCache({ 
  ttl: 300000, // 5 minutes - products don't change that often
  max: 5000 
});

export const vendorCache = new QueryCache({ 
  ttl: 600000, // 10 minutes - vendor data is fairly static
  max: 1000 
});

export const inventoryCache = new QueryCache({ 
  ttl: 60000, // 1 minute - inventory changes frequently
  max: 10000 
});

// Helper function to generate consistent cache keys
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

