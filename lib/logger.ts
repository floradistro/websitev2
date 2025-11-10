/**
 * Structured Logger with Sentry Integration
 *
 * Replaces console.log with proper structured logging that integrates with Sentry.
 * Use this throughout the application instead of console.log.
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * logger.error('Payment failed', error, { orderId: '456', amount: 99.99 });
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Trace level - Extremely detailed debugging (development only)
   */
  trace(message: string, context?: LogContext) {
    if (!this.isDevelopment) return;

    console.trace(`[TRACE] ${message}`, context || "");
    Sentry.addBreadcrumb({
      category: "trace",
      message,
      level: "debug",
      data: context,
    });
  }

  /**
   * Debug level - Detailed debugging information (development only)
   */
  debug(message: string, context?: LogContext) {
    if (!this.isDevelopment) return;

    console.log(`[DEBUG] ${message}`, context || "");
    Sentry.addBreadcrumb({
      category: "debug",
      message,
      level: "debug",
      data: context,
    });
  }

  /**
   * Info level - Normal operational messages
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || "");
    }

    Sentry.addBreadcrumb({
      category: "info",
      message,
      level: "info",
      data: context,
    });
  }

  /**
   * Warn level - Warning messages for potential issues
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context || "");

    Sentry.addBreadcrumb({
      category: "warning",
      message,
      level: "warning",
      data: context,
    });

    // Capture warnings in Sentry
    Sentry.captureMessage(message, {
      level: "warning",
      contexts: { details: context },
    });
  }

  /**
   * Error level - Error conditions (recoverable)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error || "", context || "");

    // If an error object is provided, capture it with Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        contexts: { details: context },
        tags: { message },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        contexts: { details: context },
      });
    }
  }

  /**
   * Fatal level - Critical system failures (unrecoverable)
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`[FATAL] ${message}`, error || "", context || "");

    if (error instanceof Error) {
      Sentry.captureException(error, {
        level: "fatal",
        contexts: { details: context },
        tags: { message, severity: "critical" },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "fatal",
        contexts: { details: context },
        tags: { severity: "critical" },
      });
    }
  }

  /**
   * Log API errors with standardized format
   */
  apiError(endpoint: string, error: Error | unknown, statusCode?: number) {
    const message = `API Error: ${endpoint}`;
    const context = {
      endpoint,
      statusCode,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };

    this.error(message, error, context);
  }

  /**
   * Log database errors
   */
  dbError(operation: string, error: Error | unknown, table?: string) {
    const message = `Database Error: ${operation}`;
    const context = {
      operation,
      table,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };

    this.error(message, error, context);
  }

  /**
   * Performance measurement
   */
  measure(label: string, startTime: number) {
    const duration = Date.now() - startTime;

    if (this.isDevelopment) {
      console.log(`[PERF] ${label}: ${duration}ms`);
    }

    // Send to Sentry as breadcrumb
    Sentry.addBreadcrumb({
      category: "performance",
      message: `${label}: ${duration}ms`,
      level: "info",
      data: { label, duration },
    });

    // Alert if slow operation
    if (duration > 1000) {
      this.warn(`Slow operation detected: ${label}`, { duration });
    }
  }

  /**
   * Create a child logger with preset context
   * Useful for tracking operations across multiple log calls
   *
   * @example
   * const orderLogger = logger.child({ orderId: '123', vendorId: '456' });
   * orderLogger.info('Processing order');
   * orderLogger.info('Payment completed');
   */
  child(baseContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalMethods = {
      trace: childLogger.trace.bind(childLogger),
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
      fatal: childLogger.fatal.bind(childLogger),
      apiError: childLogger.apiError.bind(childLogger),
      dbError: childLogger.dbError.bind(childLogger),
      measure: childLogger.measure.bind(childLogger),
    };

    // Override methods to include base context
    childLogger.trace = (message, context) =>
      originalMethods.trace(message, { ...baseContext, ...context });
    childLogger.debug = (message, context) =>
      originalMethods.debug(message, { ...baseContext, ...context });
    childLogger.info = (message, context) =>
      originalMethods.info(message, { ...baseContext, ...context });
    childLogger.warn = (message, context) =>
      originalMethods.warn(message, { ...baseContext, ...context });
    childLogger.error = (message, error, context) =>
      originalMethods.error(message, error, { ...baseContext, ...context });
    childLogger.fatal = (message, error, context) =>
      originalMethods.fatal(message, error, { ...baseContext, ...context });

    return childLogger;
  }

  /**
   * Set user context for all subsequent logs
   */
  setUser(user: { id: string; email?: string; role?: string; vendorId?: string }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      vendor_id: user.vendorId,
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    Sentry.setUser(null);
  }

  /**
   * Set a tag that will be applied to all subsequent events
   */
  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  /**
   * Set context that will be applied to all subsequent events
   */
  setContext(name: string, context: LogContext) {
    Sentry.setContext(name, context);
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a scoped logger for a specific component/module
 *
 * @example
 * const paymentLogger = createLogger('payment', { vendorId: '123' });
 * paymentLogger.info('Processing payment');
 */
export function createLogger(component: string, baseContext?: LogContext): Logger {
  return logger.child({
    component,
    ...baseContext,
  });
}

// Export class for testing
export default Logger;
