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
