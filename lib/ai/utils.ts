/**
 * AI Code Feature V2 - Utility Functions
 * Timeout, retry, and error handling utilities
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Execute a promise with a timeout
 * @param promise The promise to execute
 * @param ms Timeout in milliseconds
 * @param fallback Optional fallback value on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback?: T,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Operation timed out after ${ms}ms`)),
      ms,
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (
      fallback !== undefined &&
      error instanceof Error &&
      error.message.includes("timed out")
    ) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Operation timed out, using fallback:`, error.message);
      }
      return fallback;
    }
    throw error;
  }
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms...`,
          lastError.message,
        );
      }
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute multiple promises in parallel with individual timeouts
 * Returns results for successful promises and errors for failed ones
 */
export async function parallelWithTimeouts<T>(
  promises: Array<() => Promise<T>>,
  timeoutMs: number,
): Promise<
  Array<{ success: true; value: T } | { success: false; error: Error }>
> {
  const wrappedPromises = promises.map(async (fn) => {
    try {
      const value = await withTimeout(fn(), timeoutMs);
      return { success: true as const, value };
    } catch (error) {
      return { success: false as const, error: error as Error };
    }
  });

  return Promise.all(wrappedPromises);
}

/**
 * Create an AbortController with automatic timeout
 */
export function createAbortController(timeoutMs: number): AbortController {
  const controller = new AbortController();

  setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);

  return controller;
}

/**
 * Safe JSON parse that doesn't throw
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}
