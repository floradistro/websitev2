/**
 * API Route Wrapper Utilities
 *
 * Provides DRY wrappers for common API route patterns:
 * - Authentication (vendor, admin, customer)
 * - Rate limiting
 * - Error handling
 * - Response formatting
 * - Caching
 *
 * USAGE:
 * export const GET = withVendorAuth(async (request, { vendorId }) => {
 *   // Your route logic here
 *   return { success: true, data: {...} };
 * });
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import {
  redisRateLimiter,
  RateLimitConfigs,
  getIdentifier,
  getRateLimitHeaders,
} from "@/lib/redis-rate-limiter";
import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { redisCache } from "@/lib/redis-cache";

/**
 * Route handler context
 */
export interface RouteContext {
  vendorId?: string;
  userId?: string;
  request: NextRequest;
}

/**
 * Route handler function type
 */
export type RouteHandler<T = any> = (
  request: NextRequest,
  context: RouteContext,
) => Promise<T | NextResponse>;

/**
 * Route options
 */
export interface RouteOptions {
  /**
   * Enable rate limiting
   */
  rateLimit?: {
    enabled: boolean;
    config: keyof typeof RateLimitConfigs;
  };

  /**
   * Enable caching
   */
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
    keyGenerator?: (request: NextRequest, context: RouteContext) => string;
  };

  /**
   * Error handling
   */
  errorHandling?: {
    logErrors?: boolean;
    includeStackTrace?: boolean; // Only in development
  };
}

/**
 * Default route options
 */
const defaultOptions: RouteOptions = {
  rateLimit: {
    enabled: false,
    config: "publicApi",
  },
  cache: {
    enabled: false,
    ttl: 300,
  },
  errorHandling: {
    logErrors: true,
    includeStackTrace: process.env.NODE_ENV === "development",
  },
};

/**
 * Apply rate limiting to route
 */
async function applyRateLimit(
  request: NextRequest,
  config: keyof typeof RateLimitConfigs,
): Promise<NextResponse | null> {
  const identifier = getIdentifier(request);
  const allowed = await redisRateLimiter.check(identifier, RateLimitConfigs[config]);

  if (!allowed) {
    const resetTime = await redisRateLimiter.getResetTime(
      identifier,
      RateLimitConfigs[config],
    );

    logger.warn("Rate limit exceeded", {
      ip: identifier,
      config,
      resetTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
        retryAfter: resetTime,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetTime.toString(),
          "X-RateLimit-Limit": RateLimitConfigs[config].maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetTime.toString(),
        },
      },
    );
  }

  return null;
}

/**
 * Apply caching to route
 */
async function applyCache<T>(
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  return redisCache.wrap(cacheKey, fetchFn, ttl);
}

/**
 * Format error response
 */
function formatErrorResponse(
  error: unknown,
  options: RouteOptions["errorHandling"] = {},
): NextResponse {
  const err = toError(error);

  if (options.logErrors !== false) {
    logger.error("API route error", err);
  }

  const response: any = {
    success: false,
    error: "An error occurred. Please try again.",
  };

  if (options.includeStackTrace && process.env.NODE_ENV === "development") {
    response.message = err.message;
    response.stack = err.stack;
  }

  return NextResponse.json(response, { status: 500 });
}

/**
 * Wrap route with vendor authentication
 */
export function withVendorAuth<T = any>(
  handler: RouteHandler<T>,
  options: RouteOptions = {},
): (request: NextRequest) => Promise<NextResponse> {
  const opts = { ...defaultOptions, ...options };

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Rate limiting
      if (opts.rateLimit?.enabled) {
        const rateLimitResponse = await applyRateLimit(
          request,
          opts.rateLimit.config,
        );
        if (rateLimitResponse) return rateLimitResponse;
      }

      // 2. Authentication
      const authResult = await requireVendor(request);
      if (authResult instanceof NextResponse) return authResult;
      const { vendorId } = authResult;

      const context: RouteContext = {
        vendorId,
        request,
      };

      // 3. Caching (if enabled)
      let result: T;
      if (opts.cache?.enabled) {
        const cacheKey =
          opts.cache.keyGenerator?.(request, context) ||
          `route:${request.url}:${vendorId}`;
        result = await applyCache(cacheKey, opts.cache.ttl, () =>
          handler(request, context),
        );
      } else {
        result = await handler(request, context);
      }

      // 4. Return result
      if (result instanceof NextResponse) {
        return result;
      }

      // Add rate limit headers if enabled
      const headers: Record<string, string> = {};
      if (opts.rateLimit?.enabled) {
        const identifier = getIdentifier(request);
        const rateLimitHeaders = await getRateLimitHeaders(
          identifier,
          RateLimitConfigs[opts.rateLimit.config],
        );
        Object.assign(headers, rateLimitHeaders);
      }

      return NextResponse.json(result, { headers });
    } catch (error) {
      return formatErrorResponse(error, opts.errorHandling);
    }
  };
}

/**
 * Wrap route with public access (no auth, but rate limited)
 */
export function withPublicAccess<T = any>(
  handler: RouteHandler<T>,
  options: RouteOptions = {},
): (request: NextRequest) => Promise<NextResponse> {
  const opts = {
    ...defaultOptions,
    ...options,
    rateLimit: {
      enabled: true,
      config: "publicApi" as keyof typeof RateLimitConfigs,
      ...options.rateLimit,
    },
  };

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Rate limiting
      if (opts.rateLimit?.enabled) {
        const rateLimitResponse = await applyRateLimit(
          request,
          opts.rateLimit.config,
        );
        if (rateLimitResponse) return rateLimitResponse;
      }

      const context: RouteContext = {
        request,
      };

      // 2. Caching (if enabled)
      let result: T;
      if (opts.cache?.enabled) {
        const cacheKey =
          opts.cache.keyGenerator?.(request, context) || `route:${request.url}`;
        result = await applyCache(cacheKey, opts.cache.ttl, () =>
          handler(request, context),
        );
      } else {
        result = await handler(request, context);
      }

      // 3. Return result
      if (result instanceof NextResponse) {
        return result;
      }

      // Add rate limit headers
      const headers: Record<string, string> = {};
      if (opts.rateLimit?.enabled) {
        const identifier = getIdentifier(request);
        const rateLimitHeaders = await getRateLimitHeaders(
          identifier,
          RateLimitConfigs[opts.rateLimit.config],
        );
        Object.assign(headers, rateLimitHeaders);
      }

      return NextResponse.json(result, { headers });
    } catch (error) {
      return formatErrorResponse(error, opts.errorHandling);
    }
  };
}

/**
 * Wrap route with admin authentication
 */
export function withAdminAuth<T = any>(
  handler: RouteHandler<T>,
  options: RouteOptions = {},
): (request: NextRequest) => Promise<NextResponse> {
  const opts = { ...defaultOptions, ...options };

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Rate limiting
      if (opts.rateLimit?.enabled) {
        const rateLimitResponse = await applyRateLimit(
          request,
          opts.rateLimit.config,
        );
        if (rateLimitResponse) return rateLimitResponse;
      }

      // 2. Admin authentication (simplified - you can enhance this)
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }

      const context: RouteContext = {
        request,
      };

      // 3. Execute handler
      const result = await handler(request, context);

      // 4. Return result
      if (result instanceof NextResponse) {
        return result;
      }

      return NextResponse.json(result);
    } catch (error) {
      return formatErrorResponse(error, opts.errorHandling);
    }
  };
}

/**
 * Create a cached route handler
 * Shorthand for routes that only need caching
 */
export function cached<T = any>(
  handler: RouteHandler<T>,
  ttl: number = 300,
  keyGenerator?: (request: NextRequest, context: RouteContext) => string,
): (request: NextRequest) => Promise<NextResponse> {
  return withPublicAccess(handler, {
    cache: {
      enabled: true,
      ttl,
      keyGenerator,
    },
  });
}

/**
 * Create a rate-limited route handler
 * Shorthand for routes that only need rate limiting
 */
export function rateLimited<T = any>(
  handler: RouteHandler<T>,
  config: keyof typeof RateLimitConfigs = "publicApi",
): (request: NextRequest) => Promise<NextResponse> {
  return withPublicAccess(handler, {
    rateLimit: {
      enabled: true,
      config,
    },
  });
}
