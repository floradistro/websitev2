/**
 * In-Memory Rate Limiter
 * Simple, lightweight rate limiting without external dependencies
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

class InMemoryRateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.requests = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetAt) {
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  getResetTime(identifier: string, config: RateLimitConfig): number {
    const entry = this.requests.get(identifier);
    if (!entry) return 0;
    const now = Date.now();
    return Math.ceil((entry.resetAt - now) / 1000);
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
          if (now > entry.resetAt) {
            this.requests.delete(key);
          }
        }
      },
      5 * 60 * 1000,
    );

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }
}

export const rateLimiter = new InMemoryRateLimiter();

export const RateLimitConfigs = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  api: { maxRequests: 10, windowMs: 60 * 1000 },
  general: { maxRequests: 100, windowMs: 60 * 1000 },
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  // AI endpoints - expensive operations, stricter limits
  ai: {
    maxRequests: 20,
    windowMs: 5 * 60 * 1000,
    message: "AI rate limit exceeded",
  }, // 20 req/5min
  aiChat: {
    maxRequests: 30,
    windowMs: 5 * 60 * 1000,
    message: "AI chat rate limit exceeded",
  }, // 30 req/5min
  aiGeneration: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
    message: "AI generation rate limit exceeded",
  }, // 10 req/5min
  // Admin endpoints - brute force protection
  admin: {
    maxRequests: 60,
    windowMs: 60 * 1000,
    message: "Admin rate limit exceeded",
  }, // 60 req/min
  adminSensitive: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    message: "Sensitive operation rate limit exceeded",
  }, // 10 req/min for sensitive operations
} as const;

export function getIdentifier(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  return "unknown";
}

/**
 * Helper function to check rate limits for AI endpoints
 * Returns a NextResponse with 429 status if rate limit exceeded
 */
export function checkAIRateLimit(
  request: Request,
  config: RateLimitConfig = RateLimitConfigs.ai,
): Response | null {
  return checkRateLimit(request, config);
}

/**
 * General rate limit check helper
 * Can be used for any endpoint type
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
): Response | null {
  const identifier = getIdentifier(request);
  const allowed = rateLimiter.check(identifier, config);

  if (!allowed) {
    const resetTime = rateLimiter.getResetTime(identifier, config);

    // SECURITY MONITORING: Log rate limit exceeded
    // Import dynamically to avoid circular dependency
    if (typeof window === "undefined") {
      // Server-side only
      import("@/lib/security-monitor").then(({ securityMonitor }) => {
        const url = new URL(request.url);
        securityMonitor.logRateLimitExceeded({
          ip: identifier,
          endpoint: url.pathname,
          method: request.method,
          userAgent: request.headers.get("user-agent") || undefined,
          limit: config.maxRequests,
          window: config.windowMs,
        });
      });
    }

    return new Response(
      JSON.stringify({
        error: config.message || "Rate limit exceeded",
        retryAfter: resetTime,
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

  return null;
}
