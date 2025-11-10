/**
 * API Handler Wrapper
 *
 * Standardizes API endpoint handling with:
 * - Automatic validation
 * - Rate limiting
 * - Error handling
 * - Logging
 * - Performance monitoring
 *
 * Usage:
 * export const POST = apiHandler({
 *   bodySchema: mySchema,
 *   requireAuth: true,
 *   rateLimit: 'api',
 *   handler: async (req, body) => {
 *     return { success: true };
 *   }
 * });
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";
import { toError } from "./errors";
import {
  redisRateLimiter,
  RateLimitConfigs,
  getIdentifier,
  getRateLimitHeaders,
} from "./redis-rate-limiter";

export interface ApiHandlerOptions<TBody = any, TResponse = any> {
  /** Zod schema for request body validation */
  bodySchema?: z.ZodSchema<TBody>;

  /** Require authentication (vendor or customer) */
  requireAuth?: boolean | "vendor" | "customer";

  /** Rate limit configuration */
  rateLimit?: keyof typeof RateLimitConfigs;

  /** The actual handler function */
  handler: (req: NextRequest, body?: TBody) => Promise<TResponse>;

  /** Custom error handler */
  onError?: (error: Error, req: NextRequest) => NextResponse | Promise<NextResponse>;
}

/**
 * Wraps an API handler with standard error handling, validation, and logging
 */
export function apiHandler<TBody = any, TResponse = any>(
  options: ApiHandlerOptions<TBody, TResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = request.nextUrl.pathname;
    const method = request.method;

    try {
      // 1. Rate limiting
      if (options.rateLimit) {
        const rateLimitConfig = RateLimitConfigs[options.rateLimit];
        const identifier = getIdentifier(request);
        const allowed = await redisRateLimiter.check(identifier, rateLimitConfig);

        if (!allowed) {
          const resetTime = await redisRateLimiter.getResetTime(identifier, rateLimitConfig);
          logger.warn("Rate limit exceeded", {
            endpoint,
            method,
            ip: identifier,
            limit: options.rateLimit,
          });

          return NextResponse.json(
            {
              success: false,
              error: rateLimitConfig.message || "Rate limit exceeded",
              retryAfter: resetTime,
            },
            {
              status: 429,
              headers: {
                "Retry-After": resetTime.toString(),
                "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": resetTime.toString(),
              },
            },
          );
        }
      }

      // 2. Authentication (if required)
      if (options.requireAuth) {
        // TODO: Implement actual auth check
        // For now, just a placeholder
        // const authResult = await requireAuth(request, options.requireAuth);
        // if (authResult instanceof NextResponse) return authResult;
      }

      // 3. Body validation
      let body: TBody | undefined;
      if (options.bodySchema && (method === "POST" || method === "PUT" || method === "PATCH")) {
        try {
          const rawBody = await request.json();
          body = options.bodySchema.parse(rawBody);
        } catch (error) {
          if (error instanceof z.ZodError) {
            logger.warn("Validation failed", {
              endpoint,
              method,
              errors: error.issues,
            });

            return NextResponse.json(
              {
                success: false,
                error: "Validation failed",
                details: error.issues.map((e) => ({
                  field: e.path.join("."),
                  message: e.message,
                })),
              },
              { status: 400 },
            );
          }
          throw error;
        }
      }

      // 4. Execute handler
      const result = await options.handler(request, body);

      // 5. Log success
      const duration = Date.now() - startTime;
      logger.info(`${method} ${endpoint}`, {
        duration: `${duration}ms`,
        status: 200,
      });

      // 6. Add rate limit headers
      const headers: Record<string, string> = {};
      if (options.rateLimit) {
        const rateLimitConfig = RateLimitConfigs[options.rateLimit];
        const identifier = getIdentifier(request);
        const rateLimitHeaders = await getRateLimitHeaders(identifier, rateLimitConfig);
        Object.assign(headers, rateLimitHeaders);
      }

      return NextResponse.json(
        { success: true, data: result },
        {
          headers: {
            ...headers,
            "X-Response-Time": `${duration}ms`,
          },
        },
      );
    } catch (error) {
      const err = toError(error);
      const duration = Date.now() - startTime;

      // Log error with full context
      logger.error(`${method} ${endpoint} failed`, err, {
        duration: `${duration}ms`,
        endpoint,
        method,
        stack: err.stack,
      });

      // Call custom error handler if provided
      if (options.onError) {
        return options.onError(err, request);
      }

      // Default error response
      return NextResponse.json(
        {
          success: false,
          error: "An error occurred processing your request",
          ...(process.env.NODE_ENV === "development" && { message: err.message }),
        },
        {
          status: 500,
          headers: {
            "X-Response-Time": `${duration}ms`,
          },
        },
      );
    }
  };
}

/**
 * Simple API wrapper without rate limiting or auth
 * Good for public endpoints that don't need protection
 */
export function publicApiHandler<TResponse = any>(
  handler: (req: NextRequest) => Promise<TResponse>,
) {
  return apiHandler({
    handler,
  });
}

/**
 * Authenticated API wrapper with rate limiting
 * Good for protected endpoints
 */
export function protectedApiHandler<TBody = any, TResponse = any>(
  handler: (req: NextRequest, body?: TBody) => Promise<TResponse>,
  bodySchema?: z.ZodSchema<TBody>,
) {
  return apiHandler({
    bodySchema,
    requireAuth: true,
    rateLimit: "authenticatedApi",
    handler,
  });
}

/**
 * Strict API wrapper for sensitive operations
 * Good for admin/payment endpoints
 */
export function strictApiHandler<TBody = any, TResponse = any>(
  handler: (req: NextRequest, body?: TBody) => Promise<TResponse>,
  bodySchema?: z.ZodSchema<TBody>,
) {
  return apiHandler({
    bodySchema,
    requireAuth: true,
    rateLimit: "adminSensitive",
    handler,
  });
}
