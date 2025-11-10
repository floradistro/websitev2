/**
 * Centralized Logger Utility
 * Prevents console pollution in production
 * TODO: Integrate with Sentry or similar monitoring service
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Log error messages
   * In production, this should send to monitoring service (Sentry)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.isDevelopment) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[ERROR] ${message}`, error, context);
      }
    }

    // TODO: Send to Sentry in production
    // if (!this.isDevelopment && typeof window !== 'undefined') {
    //   Sentry.captureException(error, { extra: { message, ...context } });
    // }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[WARN] ${message}`, context);
      }
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
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
    if (this.isDevelopment) {
      const duration = Date.now() - startTime;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export default Logger;
