/**
 * API Rate Limiting System
 * Protects APIs from abuse and ensures fair usage
 * Enterprise-grade rate limiting
 */

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate Limiter
 * Implements sliding window rate limiting
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blockedUntil: Map<string, number> = new Map();
  
  /**
   * Check if request is allowed
   */
  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    
    // Check if identifier is currently blocked
    const blockExpiry = this.blockedUntil.get(identifier);
    if (blockExpiry && now < blockExpiry) {
      return false;
    }
    
    // Clean up expired block
    if (blockExpiry) {
      this.blockedUntil.delete(identifier);
    }
    
    const windowStart = now - config.windowMs;
    
    // Get existing requests for this identifier
    let requestTimes = this.requests.get(identifier) || [];
    
    // Filter to current window (sliding window)
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    // Check limit
    if (requestTimes.length >= config.maxRequests) {
      // Block for remaining window time
      const oldestRequest = requestTimes[0];
      const blockUntil = oldestRequest + config.windowMs;
      this.blockedUntil.set(identifier, blockUntil);
      
      return false;
    }
    
    // Add current request
    requestTimes.push(now);
    this.requests.set(identifier, requestTimes);
    
    return true;
  }
  
  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(identifier: string, config: RateLimitConfig): number {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const requestTimes = (this.requests.get(identifier) || [])
      .filter(time => time > windowStart);
    
    return Math.max(0, config.maxRequests - requestTimes.length);
  }
  
  /**
   * Get time until reset (in seconds)
   */
  getResetTime(identifier: string, config: RateLimitConfig): number {
    const requestTimes = this.requests.get(identifier) || [];
    if (requestTimes.length === 0) return 0;
    
    const oldestRequest = requestTimes[0];
    const resetTime = oldestRequest + config.windowMs;
    const now = Date.now();
    
    return Math.max(0, Math.ceil((resetTime - now) / 1000));
  }
  
  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
    this.blockedUntil.delete(identifier);
  }
  
  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.requests.clear();
    this.blockedUntil.clear();
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      totalIdentifiers: this.requests.size,
      blockedIdentifiers: this.blockedUntil.size,
      activeRequests: Array.from(this.requests.values())
        .reduce((sum, times) => sum + times.length, 0)
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // Strict: For expensive operations
  strict: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 requests per minute
    message: 'Too many requests. Please try again later.'
  },
  
  // Standard: For normal API endpoints
  standard: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute (1/sec)
    message: 'Rate limit exceeded. Please slow down.'
  },
  
  // Relaxed: For read-only endpoints
  relaxed: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 120,         // 120 requests per minute (2/sec)
    message: 'Too many requests. Please wait a moment.'
  },
  
  // Auth: For authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 login attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.'
  },
  
  // Write: For create/update/delete operations
  write: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 writes per minute
    message: 'Too many write operations. Please slow down.'
  }
};

/**
 * Helper to get identifier from request
 */
export function getIdentifier(request: any): string {
  // Try vendor ID first (for vendor-specific limits)
  const vendorId = request.headers.get('x-vendor-id');
  if (vendorId) {
    return `vendor:${vendorId}`;
  }
  
  // Try user ID (if authenticated)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'anonymous';
  
  return `ip:${ip}`;
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(config: RateLimitConfig) {
  return async (request: any) => {
    const identifier = getIdentifier(request);
    const allowed = rateLimiter.check(identifier, config);
    
    if (!allowed) {
      const resetTime = rateLimiter.getResetTime(identifier, config);
      
      return {
        allowed: false,
        response: {
          error: config.message || 'Rate limit exceeded',
          retryAfter: resetTime,
          limit: config.maxRequests,
          window: config.windowMs / 1000
        },
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + (resetTime * 1000)).toString(),
          'Retry-After': resetTime.toString()
        }
      };
    }
    
    const remaining = rateLimiter.getRemainingRequests(identifier, config);
    
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': (Date.now() + config.windowMs).toString()
      }
    };
  };
}

