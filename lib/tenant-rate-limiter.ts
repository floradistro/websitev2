/**
 * Per-Tenant Rate Limiting for Multi-Tenant Platform
 * Ensures fair resource usage and prevents abuse
 */

import { RateLimiter, RateLimitConfig } from './rate-limiter';

// Tier-based rate limits
export const TenantRateLimits: Record<string, RateLimitConfig> = {
  free: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute
    message: 'Free tier rate limit exceeded. Upgrade for higher limits.'
  },
  pro: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 300,         // 300 requests per minute
    message: 'Pro tier rate limit exceeded. Please slow down.'
  },
  enterprise: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 1000,        // 1000 requests per minute
    message: 'Enterprise tier rate limit exceeded.'
  },
  platform: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5000,        // 5000 requests per minute (main platform)
    message: 'Platform rate limit exceeded.'
  }
};

// Per-endpoint limits (stricter for expensive operations)
export const EndpointLimits: Record<string, RateLimitConfig> = {
  '/api/admin': {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Admin API rate limit exceeded.'
  },
  '/api/vendor': {
    windowMs: 60 * 1000,
    maxRequests: 200,
    message: 'Vendor API rate limit exceeded.'
  },
  '/api/auth': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts.'
  },
  '/api/upload': {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Upload rate limit exceeded.'
  }
};

// Singleton rate limiter instances
const tenantLimiters = new Map<string, RateLimiter>();

function getTenantLimiter(vendorId: string): RateLimiter {
  if (!tenantLimiters.has(vendorId)) {
    tenantLimiters.set(vendorId, new RateLimiter());
  }
  return tenantLimiters.get(vendorId)!;
}

/**
 * Check tenant rate limit
 */
export function checkTenantLimit(
  vendorId: string,
  tier: 'free' | 'pro' | 'enterprise' | 'platform' = 'free',
  endpoint?: string
): { allowed: boolean; headers: Record<string, string>; remaining: number } {
  const limiter = getTenantLimiter(vendorId);
  
  // Use endpoint-specific limit if available, otherwise use tier limit
  let config = TenantRateLimits[tier];
  
  if (endpoint) {
    for (const [path, endpointConfig] of Object.entries(EndpointLimits)) {
      if (endpoint.startsWith(path)) {
        config = endpointConfig;
        break;
      }
    }
  }
  
  const allowed = limiter.check(vendorId, config);
  const remaining = limiter.getRemainingRequests(vendorId, config);
  const resetTime = limiter.getResetTime(vendorId, config);
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': (Date.now() + (resetTime * 1000)).toString(),
    'X-RateLimit-Tier': tier,
  };
  
  if (!allowed) {
    headers['Retry-After'] = resetTime.toString();
  }
  
  return { allowed, headers, remaining };
}

/**
 * Get tenant tier from database (cached)
 */
const tierCache = new Map<string, { tier: string; expiresAt: number }>();
const TIER_CACHE_TTL = 300000; // 5 minutes

export async function getTenantTier(vendorId: string): Promise<string> {
  // Check cache first
  const cached = tierCache.get(vendorId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.tier;
  }
  
  // In a real implementation, fetch from database
  // For now, return 'free' as default
  const tier = 'free';
  
  tierCache.set(vendorId, {
    tier,
    expiresAt: Date.now() + TIER_CACHE_TTL
  });
  
  return tier;
}

/**
 * Cleanup function to prevent memory leaks
 */
export function cleanupInactiveTenants() {
  const now = Date.now();
  const inactiveThreshold = 3600000; // 1 hour
  
  for (const [vendorId, limiter] of tenantLimiters.entries()) {
    const stats = limiter.getStats();
    // Remove if no active requests
    if (stats.totalIdentifiers === 0) {
      tenantLimiters.delete(vendorId);
    }
  }
  
  // Clean expired tier cache entries
  for (const [vendorId, entry] of tierCache.entries()) {
    if (now > entry.expiresAt) {
      tierCache.delete(vendorId);
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupInactiveTenants, 600000);
}

