/**
 * Redis-Backed Distributed Rate Limiter
 *
 * Provides consistent rate limiting across multiple server instances
 * Falls back to in-memory rate limiting if Redis is unavailable
 *
 * SECURITY: Prevents brute force attacks and DoS attempts
 * SCALABILITY: Works across load-balanced servers
 */

import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";
import { RateLimitConfig, RateLimitConfigs as InMemoryConfigs } from "@/lib/rate-limiter";

// Redis client singleton
let redisClient: Redis | null = null;

// In-memory fallback for rate limiting
const fallbackLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Initialize Redis client
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  // Check for Upstash REST API credentials (preferred)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    logger.warn(
      "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured - using in-memory rate limiting only",
    );
    return null;
  }

  try {
    // Use Upstash REST API (recommended for serverless)
    redisClient = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });
    logger.info("Redis rate limiter initialized via Upstash REST API");
    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis rate limiter", error);
    return null;
  }
}

/**
 * Redis-backed rate limiter with in-memory fallback
 */
export class RedisRateLimiter {
  private redis: Redis | null;
  private useRedis: boolean;

  constructor() {
    this.redis = getRedisClient();
    this.useRedis = this.redis !== null;
  }

  /**
   * Check if request is allowed under rate limit
   * Uses Redis for distributed tracking, falls back to in-memory
   */
  async check(identifier: string, config: RateLimitConfig): Promise<boolean> {
    const key = `ratelimit:${identifier}:${config.windowMs}`;

    try {
      if (this.useRedis && this.redis) {
        return await this.checkRedis(key, config);
      }

      // Fallback to in-memory
      return this.checkMemory(key, config);
    } catch (error) {
      logger.error("Rate limit check failed", error, { identifier });

      // On error, fall back to in-memory check
      if (this.useRedis) {
        return this.checkMemory(key, config);
      }

      // If even fallback fails, allow request (fail open for availability)
      return true;
    }
  }

  /**
   * Redis-based rate limiting using INCR + EXPIRE
   */
  private async checkRedis(key: string, config: RateLimitConfig): Promise<boolean> {
    if (!this.redis) return true;

    // Use INCR to atomically increment counter
    const count = await this.redis.incr(key);

    // Set expiration on first request
    if (count === 1) {
      await this.redis.expire(key, Math.ceil(config.windowMs / 1000));
    }

    // Check if limit exceeded
    return count <= config.maxRequests;
  }

  /**
   * In-memory fallback rate limiting
   */
  private checkMemory(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = fallbackLimits.get(key);

    // No entry or expired - allow and create new entry
    if (!entry || now > entry.resetAt) {
      fallbackLimits.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    // Under limit - increment and allow
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Over limit - deny
    return false;
  }

  /**
   * Get time remaining until rate limit resets (in seconds)
   */
  async getResetTime(identifier: string, config: RateLimitConfig): Promise<number> {
    const key = `ratelimit:${identifier}:${config.windowMs}`;

    try {
      if (this.useRedis && this.redis) {
        const ttl = await this.redis.ttl(key);
        return ttl > 0 ? ttl : 0;
      }

      // Fallback to in-memory
      const entry = fallbackLimits.get(key);
      if (!entry) return 0;

      const now = Date.now();
      return Math.ceil((entry.resetAt - now) / 1000);
    } catch (error) {
      logger.error("Failed to get rate limit reset time", error);
      return Math.ceil(config.windowMs / 1000);
    }
  }

  /**
   * Reset rate limit for specific identifier
   * Useful for testing or manual intervention
   */
  async reset(identifier: string, config: RateLimitConfig): Promise<void> {
    const key = `ratelimit:${identifier}:${config.windowMs}`;

    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(key);
      }

      fallbackLimits.delete(key);
    } catch (error) {
      logger.error("Failed to reset rate limit", error, { identifier });
    }
  }

  /**
   * Get current request count for identifier
   */
  async getCount(identifier: string, config: RateLimitConfig): Promise<number> {
    const key = `ratelimit:${identifier}:${config.windowMs}`;

    try {
      if (this.useRedis && this.redis) {
        const count = await this.redis.get(key);
        return count ? parseInt(String(count), 10) : 0;
      }

      const entry = fallbackLimits.get(key);
      return entry?.count || 0;
    } catch (error) {
      logger.error("Failed to get rate limit count", error);
      return 0;
    }
  }

  /**
   * Get rate limiter statistics
   */
  getStats() {
    return {
      isRedisConnected: this.useRedis && this.redis !== null,
      fallbackEntriesCount: fallbackLimits.size,
    };
  }

  /**
   * Cleanup expired fallback entries (runs periodically)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of fallbackLimits.entries()) {
      if (now > entry.resetAt) {
        fallbackLimits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }
}

// Export singleton instance
export const redisRateLimiter = new RedisRateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof window === "undefined") {
  setInterval(() => {
    redisRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Enhanced rate limit configurations with Redis
 * Includes all original configs plus new distributed-friendly ones
 */
export const RateLimitConfigs = {
  // Re-export in-memory configs for compatibility
  ...InMemoryConfigs,

  // Public API endpoints (generous limits)
  publicApi: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: "Public API rate limit exceeded",
  }, // 100 req/min

  // Authenticated API (higher limits for logged-in users)
  authenticatedApi: {
    maxRequests: 300,
    windowMs: 60 * 1000,
    message: "API rate limit exceeded",
  }, // 300 req/min

  // Product catalog (read-heavy, moderate limits)
  productCatalog: {
    maxRequests: 60,
    windowMs: 60 * 1000,
    message: "Product catalog rate limit exceeded",
  }, // 60 req/min

  // Media uploads (expensive, strict limits)
  mediaUpload: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
    message: "Media upload rate limit exceeded",
  }, // 10 uploads/5min

  // Checkout/payment (critical, strict limits)
  checkout: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    message: "Too many checkout attempts",
  }, // 5 req/min

  // Webhooks (external systems, generous limits)
  webhook: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
    message: "Webhook rate limit exceeded",
  }, // 1000 req/min
} as const;

/**
 * Get request identifier from headers
 * Checks multiple headers for proxy/load balancer support
 */
export function getIdentifier(request: Request): string {
  const headers = request.headers;

  // Check common proxy headers in order of preference
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfConnectingIp = headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIp) return cfConnectingIp;

  const trueClientIp = headers.get("true-client-ip"); // Akamai
  if (trueClientIp) return trueClientIp;

  // Fallback to generic identifier
  return "unknown";
}

/**
 * Middleware helper: Check rate limit and return 429 response if exceeded
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<Response | null> {
  const identifier = getIdentifier(request);
  const allowed = await redisRateLimiter.check(identifier, config);

  if (!allowed) {
    const resetTime = await redisRateLimiter.getResetTime(identifier, config);
    const count = await redisRateLimiter.getCount(identifier, config);

    // Log rate limit violation for security monitoring
    logger.warn("Rate limit exceeded", {
      ip: identifier,
      endpoint: new URL(request.url).pathname,
      method: request.method,
      limit: config.maxRequests,
      currentCount: count,
      windowMs: config.windowMs,
    });

    return new Response(
      JSON.stringify({
        error: config.message || "Rate limit exceeded. Please try again later.",
        retryAfter: resetTime,
        limit: config.maxRequests,
        window: `${config.windowMs / 1000}s`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": resetTime.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetTime.toString(),
        },
      },
    );
  }

  // Add rate limit headers to successful responses
  const count = await redisRateLimiter.getCount(identifier, config);
  const remaining = Math.max(0, config.maxRequests - count);

  // Return null (no error) but with headers to attach
  return null;
}

/**
 * Get rate limit headers for successful responses
 */
export async function getRateLimitHeaders(
  identifier: string,
  config: RateLimitConfig,
): Promise<Record<string, string>> {
  const count = await redisRateLimiter.getCount(identifier, config);
  const remaining = Math.max(0, config.maxRequests - count);
  const resetTime = await redisRateLimiter.getResetTime(identifier, config);

  return {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": resetTime.toString(),
  };
}
