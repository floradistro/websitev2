/**
 * API Request/Response Logger
 *
 * Provides comprehensive logging for all API requests with:
 * - Request ID tracking for correlation
 * - Request/response payload logging (sanitized)
 * - Performance metrics
 * - Error tracking
 * - Security event monitoring
 *
 * Usage:
 * import { logApiRequest, logApiResponse, logApiError } from '@/lib/api-logger';
 *
 * const requestId = logApiRequest(request);
 * const result = await handler();
 * logApiResponse(requestId, result, statusCode);
 */

import { NextRequest } from "next/server";
import { logger } from "./logger";
import { nanoid } from "nanoid";

// Fields to sanitize in request/response bodies
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "apiKey",
  "api_key",
  "secret",
  "authorization",
  "auth",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "creditCard",
  "credit_card",
  "cvv",
  "ssn",
  "social_security",
];

// Headers to sanitize
const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "x-auth-token",
  "x-access-token",
];

/**
 * Sanitize object by redacting sensitive fields
 */
function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 10) return "[Max depth reached]";
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive fields
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object") {
        sanitized[key] = sanitizeObject(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize headers by redacting sensitive ones
 */
function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.includes(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Extract client IP from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Generate a unique request ID for correlation
 */
export function generateRequestId(): string {
  return nanoid(16);
}

/**
 * Log incoming API request
 * Returns request ID for correlation with response
 */
export function logApiRequest(
  request: NextRequest,
  body?: any,
  requestId?: string
): string {
  const id = requestId || generateRequestId();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  const queryParams = Object.fromEntries(request.nextUrl.searchParams);

  const logData: Record<string, any> = {
    requestId: id,
    endpoint,
    method,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  };

  // Add query params if present
  if (Object.keys(queryParams).length > 0) {
    logData.queryParams = sanitizeObject(queryParams);
  }

  // Add body if present (POST/PUT/PATCH)
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    logData.body = sanitizeObject(body);
  }

  // Add headers (sanitized)
  if (process.env.NODE_ENV === "development") {
    logData.headers = sanitizeHeaders(request.headers);
  }

  logger.info(`API Request: ${method} ${endpoint}`, logData);

  return id;
}

/**
 * Log successful API response
 */
export function logApiResponse(
  requestId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseData?: any,
  duration?: number
): void {
  const logData: Record<string, any> = {
    requestId,
    endpoint,
    method,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (duration !== undefined) {
    logData.duration = `${duration.toFixed(2)}ms`;
  }

  // In development, log response data (sanitized)
  if (process.env.NODE_ENV === "development" && responseData) {
    logData.response = sanitizeObject(responseData);
  }

  // Log as info for 2xx, warn for 4xx, error for 5xx
  if (statusCode >= 500) {
    logger.error(`API Response: ${method} ${endpoint}`, new Error(`HTTP ${statusCode}`), logData);
  } else if (statusCode >= 400) {
    logger.warn(`API Response: ${method} ${endpoint}`, logData);
  } else {
    logger.info(`API Response: ${method} ${endpoint}`, logData);
  }
}

/**
 * Log API error with full context
 */
export function logApiError(
  requestId: string,
  endpoint: string,
  method: string,
  error: Error,
  body?: any,
  duration?: number
): void {
  const logData: Record<string, any> = {
    requestId,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    errorMessage: error.message,
    errorName: error.name,
    stack: error.stack,
  };

  if (duration !== undefined) {
    logData.duration = `${duration.toFixed(2)}ms`;
  }

  if (body) {
    logData.requestBody = sanitizeObject(body);
  }

  logger.error(`API Error: ${method} ${endpoint}`, error, logData);
}

/**
 * Log security event (e.g., rate limit, auth failure)
 */
export function logSecurityEvent(
  event: string,
  request: NextRequest,
  details?: Record<string, any>
): void {
  const ip = getClientIp(request);
  const endpoint = request.nextUrl.pathname;
  const method = request.method;

  logger.warn(`Security Event: ${event}`, {
    event,
    endpoint,
    method,
    ip,
    userAgent: getUserAgent(request),
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Log performance metric
 */
export function logPerformanceMetric(
  metric: string,
  value: number,
  unit: "ms" | "bytes" | "count",
  context?: Record<string, any>
): void {
  logger.info(`Performance: ${metric}`, {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

/**
 * Create request context for correlation across logs
 */
export interface RequestContext {
  requestId: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent: string;
  startTime: number;
}

/**
 * Initialize request context
 */
export function createRequestContext(
  request: NextRequest,
  requestId?: string
): RequestContext {
  return {
    requestId: requestId || generateRequestId(),
    endpoint: request.nextUrl.pathname,
    method: request.method,
    ip: getClientIp(request),
    userAgent: getUserAgent(request),
    startTime: Date.now(),
  };
}

/**
 * Log with request context
 */
export function logWithContext(
  level: "info" | "warn" | "error",
  message: string,
  context: RequestContext,
  additionalData?: Record<string, any>
): void {
  const duration = Date.now() - context.startTime;

  const logData = {
    requestId: context.requestId,
    endpoint: context.endpoint,
    method: context.method,
    ip: context.ip,
    duration: `${duration.toFixed(2)}ms`,
    ...additionalData,
  };

  switch (level) {
    case "info":
      logger.info(message, logData);
      break;
    case "warn":
      logger.warn(message, logData);
      break;
    case "error":
      logger.error(message, new Error(message), logData);
      break;
  }
}
