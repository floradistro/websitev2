/**
 * Optimized API Client with caching, deduplication, and retry logic
 */

import { requestCache } from './request-cache';

interface FetchOptions extends RequestInit {
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  timeout?: number;
}

class APIClient {
  private baseURL: string;
  private abortControllers: Map<string, AbortController>;

  constructor() {
    this.baseURL = '';
    this.abortControllers = new Map();
  }

  /**
   * Abort any pending requests with the same key
   */
  private abortPendingRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  /**
   * Create cache key from URL and options
   */
  private getCacheKey(url: string, options?: FetchOptions): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Enhanced fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: FetchOptions & { signal?: AbortSignal },
    timeout: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Main fetch method with all optimizations
   */
  async fetch<T = any>(
    url: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      cache = true,
      cacheTTL = 60000,
      retries = 2,
      timeout = 30000,
      ...fetchOptions
    } = options;

    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const cacheKey = this.getCacheKey(fullURL, options);

    // Only cache GET requests
    const shouldCache = cache && (!options.method || options.method === 'GET');

    if (shouldCache) {
      return requestCache.get(
        cacheKey,
        () => this.performFetch<T>(fullURL, fetchOptions, retries, timeout),
        cacheTTL
      );
    }

    return this.performFetch<T>(fullURL, fetchOptions, retries, timeout);
  }

  /**
   * Perform actual fetch with retry logic
   */
  private async performFetch<T>(
    url: string,
    options: RequestInit,
    retries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Bulk fetch with parallel requests
   */
  async fetchBulk<T = any>(
    urls: string[],
    options: FetchOptions = {}
  ): Promise<T[]> {
    const promises = urls.map(url => this.fetch<T>(url, options));
    return Promise.all(promises);
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    requestCache.clear();
  }

  /**
   * Invalidate cache for specific pattern
   */
  invalidateCache(pattern: string): void {
    requestCache.invalidate(pattern);
  }
}

// Global singleton
export const apiClient = new APIClient();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiClient.cancelAll();
  });
}
