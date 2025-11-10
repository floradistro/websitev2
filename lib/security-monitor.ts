/**
 * Security Event Monitoring
 *
 * Tracks security events, failed auth attempts, rate limiting, and suspicious activity.
 * Integrates with Sentry for alerting and analysis.
 */

import { logger } from "./logger";
import * as Sentry from "@sentry/nextjs";

export enum SecurityEventType {
  AUTH_SUCCESS = "auth_success",
  AUTH_FAILURE = "auth_failure",
  AUTH_UNAUTHORIZED = "auth_unauthorized",
  AUTH_FORBIDDEN = "auth_forbidden",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  TOKEN_EXPIRED = "token_expired",
  TOKEN_INVALID = "token_invalid",
  CSRF_VIOLATION = "csrf_violation",
  SQL_INJECTION_ATTEMPT = "sql_injection_attempt",
}

interface SecurityEventContext {
  userId?: string;
  vendorId?: string;
  email?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  reason?: string;
  [key: string]: any;
}

class SecurityMonitor {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Log a security event
   */
  logEvent(
    eventType: SecurityEventType,
    context: SecurityEventContext,
    severity: "info" | "warning" | "error" = "info",
  ) {
    const message = `Security Event: ${eventType}`;

    // Add security event breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: "security",
      message: `${eventType}: ${context.endpoint || "unknown"}`,
      level: severity,
      data: context,
    });

    // Tag event for easier filtering in Sentry
    Sentry.setTag("security_event", eventType);
    if (context.ip) Sentry.setTag("ip_address", context.ip);
    if (context.userId) Sentry.setTag("user_id", context.userId);

    // Log based on severity
    switch (severity) {
      case "error":
        logger.error(message, undefined, context);
        break;
      case "warning":
        logger.warn(message, context);
        break;
      case "info":
        logger.info(message, context);
        break;
    }

    // Development console logging for visibility
    if (this.isDevelopment) {
      const emoji = this.getEmojiForEvent(eventType);
      console.log(
        `${emoji} [SECURITY] ${eventType}`,
        context.endpoint || "",
        context,
      );
    }
  }

  /**
   * Log successful authentication
   */
  logAuthSuccess(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.AUTH_SUCCESS, context, "info");
  }

  /**
   * Log failed authentication attempt
   */
  logAuthFailure(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.AUTH_FAILURE, context, "warning");

    // Check for brute force attempts (multiple failures from same IP)
    this.checkBruteForce(context);
  }

  /**
   * Log unauthorized access attempt (401)
   */
  logUnauthorized(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.AUTH_UNAUTHORIZED, context, "warning");
  }

  /**
   * Log forbidden access attempt (403)
   */
  logForbidden(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.AUTH_FORBIDDEN, context, "warning");
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, context, "warning");

    // Check if this IP is hitting rate limits too frequently
    this.checkSuspiciousRateLimiting(context);
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, context, "error");
  }

  /**
   * Log expired token attempt
   */
  logTokenExpired(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.TOKEN_EXPIRED, context, "info");
  }

  /**
   * Log invalid token attempt
   */
  logTokenInvalid(context: SecurityEventContext) {
    this.logEvent(SecurityEventType.TOKEN_INVALID, context, "warning");
  }

  /**
   * Check for brute force attack patterns
   * (This is a simplified version - in production, use Redis for distributed tracking)
   */
  private bruteForceTracker = new Map<string, number>();

  private checkBruteForce(context: SecurityEventContext) {
    if (!context.ip) return;

    const key = `${context.ip}:${context.endpoint}`;
    const attempts = (this.bruteForceTracker.get(key) || 0) + 1;
    this.bruteForceTracker.set(key, attempts);

    // Alert on 5+ failed attempts within tracking window
    if (attempts >= 5) {
      this.logSuspiciousActivity({
        ...context,
        reason: "Potential brute force attack detected",
        failedAttempts: attempts,
      });
    }

    // Cleanup old entries after 15 minutes
    setTimeout(
      () => {
        this.bruteForceTracker.delete(key);
      },
      15 * 60 * 1000,
    );
  }

  /**
   * Check for suspicious rate limiting patterns
   */
  private rateLimitTracker = new Map<string, number>();

  private checkSuspiciousRateLimiting(context: SecurityEventContext) {
    if (!context.ip) return;

    const key = context.ip;
    const rateLimitHits = (this.rateLimitTracker.get(key) || 0) + 1;
    this.rateLimitTracker.set(key, rateLimitHits);

    // Alert on 10+ rate limit hits (potential abuse/scraping)
    if (rateLimitHits >= 10) {
      this.logSuspiciousActivity({
        ...context,
        reason: "Excessive rate limiting detected - potential abuse",
        rateLimitHits,
      });
    }

    // Cleanup old entries after 30 minutes
    setTimeout(
      () => {
        this.rateLimitTracker.delete(key);
      },
      30 * 60 * 1000,
    );
  }

  /**
   * Get emoji for event type (development only)
   */
  private getEmojiForEvent(eventType: SecurityEventType): string {
    const emojiMap: Record<SecurityEventType, string> = {
      [SecurityEventType.AUTH_SUCCESS]: "✅",
      [SecurityEventType.AUTH_FAILURE]: "❌",
      [SecurityEventType.AUTH_UNAUTHORIZED]: "🚫",
      [SecurityEventType.AUTH_FORBIDDEN]: "⛔",
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: "⏱️",
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: "🚨",
      [SecurityEventType.TOKEN_EXPIRED]: "⏰",
      [SecurityEventType.TOKEN_INVALID]: "🔑",
      [SecurityEventType.CSRF_VIOLATION]: "🛡️",
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: "💉",
    };

    return emojiMap[eventType] || "🔒";
  }

  /**
   * Get security metrics for monitoring dashboard
   */
  getMetrics() {
    return {
      bruteForceAttempts: this.bruteForceTracker.size,
      rateLimitViolations: this.rateLimitTracker.size,
    };
  }

  /**
   * Clear all tracking data (for testing)
   */
  clearTracking() {
    this.bruteForceTracker.clear();
    this.rateLimitTracker.clear();
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

/**
 * Helper function to extract request metadata for security logging
 */
export function getRequestMetadata(request: Request): SecurityEventContext {
  const headers = request.headers;

  return {
    ip: getClientIP(request),
    userAgent: headers.get("user-agent") || undefined,
    endpoint: new URL(request.url).pathname,
    method: request.method,
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string | undefined {
  const headers = request.headers;

  // Try various IP header formats
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  return undefined;
}
