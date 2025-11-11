/**
 * Middleware Cache
 * In-memory cache for vendor lookups to prevent repeated DB queries
 *
 * CRITICAL FOR PERFORMANCE:
 * Without this, every page load hits the database 2-3 times in middleware
 */

interface VendorDomainCache {
  vendor_id: string;
  is_active: boolean;
  verified: boolean;
  coming_soon?: boolean;
  timestamp: number;
}

interface VendorSubdomainCache {
  id: string;
  status: string;
  coming_soon?: boolean;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const domainCache = new Map<string, VendorDomainCache>();
const subdomainCache = new Map<string, VendorSubdomainCache>();

/**
 * Get vendor by custom domain (with cache)
 */
export function getCachedDomain(domain: string): VendorDomainCache | null {
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  return null;
}

/**
 * Set vendor domain in cache
 */
export function setCachedDomain(domain: string, data: Omit<VendorDomainCache, "timestamp">) {
  domainCache.set(domain, {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Get vendor by subdomain (with cache)
 */
export function getCachedSubdomain(subdomain: string): VendorSubdomainCache | null {
  const cached = subdomainCache.get(subdomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  return null;
}

/**
 * Set vendor subdomain in cache
 */
export function setCachedSubdomain(subdomain: string, data: Omit<VendorSubdomainCache, "timestamp">) {
  subdomainCache.set(subdomain, {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Clear entire cache (for cache invalidation)
 */
export function clearMiddlewareCache() {
  domainCache.clear();
  subdomainCache.clear();
}

/**
 * Get cache stats for monitoring
 */
export function getMiddlewareCacheStats() {
  return {
    domainCacheSize: domainCache.size,
    subdomainCacheSize: subdomainCache.size,
    domains: Array.from(domainCache.keys()),
    subdomains: Array.from(subdomainCache.keys()),
  };
}
