/**
 * Production-Safe Logger
 * Replaces console.log statements to reduce overhead in production
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logs - only in development
   */
  log: isDev ? console.log.bind(console) : () => {},
  
  /**
   * Errors - always logged
   */
  error: console.error.bind(console),
  
  /**
   * Warnings - only in development
   */
  warn: isDev ? console.warn.bind(console) : () => {},
  
  /**
   * Info - only in development
   */
  info: isDev ? console.info.bind(console) : () => {},
  
  /**
   * Debug with context - only in development
   */
  debug: isDev 
    ? (context: string, ...args: any[]) => {
        console.log(`[${context}]`, ...args);
      }
    : () => {},
};

/**
 * Sanitize sensitive data before logging
 */
export function sanitize(data: any): any {
  if (!data) return data;
  
  const sensitive = ['password', 'token', 'secret', 'api_key', 'apiKey'];
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Log with performance timing
 */
export function logWithTiming(label: string, fn: () => void) {
  if (!isDev) {
    fn();
    return;
  }
  
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
}

