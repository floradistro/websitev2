/**
 * Stable API Layer - Production Grade
 * This layer ensures API calls NEVER break the application
 */

import axios, { AxiosError } from 'axios';

const baseUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://api.floradistro.com';

// Response type that's always safe
interface SafeResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  statusCode: number;
}

/**
 * STABLE API CALL - NEVER THROWS, ALWAYS RETURNS
 * This is the bulletproof wrapper for all API calls
 */
export async function stableApiCall<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    headers?: Record<string, string>;
    timeout?: number;
    maxRetries?: number;
  } = {}
): Promise<SafeResponse<T>> {
  const {
    method = 'GET',
    data = null,
    headers = {},
    timeout = 10000,
    maxRetries = 2
  } = options;

  let lastError: any = null;

  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add cache buster
      const separator = url.includes('?') ? '&' : '?';
      const urlWithCache = `${url}${separator}_t=${Date.now()}&_attempt=${attempt}`;

      // Make request
      const response = await axios({
        method: method.toLowerCase() as any,
        url: urlWithCache,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout,
        validateStatus: () => true, // Accept any status code
      });

      // Parse response (handle HTML+JSON mix from WordPress)
      let responseData = response.data;
      
      if (typeof responseData === 'string') {
        // Extract JSON from end of string (WordPress debug may prefix HTML)
        const jsonMatch = responseData.match(/\{[\s\S]*\}$/);
        if (jsonMatch) {
          try {
            responseData = JSON.parse(jsonMatch[0]);
          } catch (e) {
            // Couldn't parse, treat as error
            return {
              success: false,
              data: null,
              error: 'Invalid JSON response from server',
              statusCode: response.status
            };
          }
        } else {
          // No JSON found in response
          return {
            success: false,
            data: null,
            error: 'No valid JSON in response',
            statusCode: response.status
          };
        }
      }

      // Check if response indicates success
      const isSuccess = response.status >= 200 && response.status < 300;
      const hasSuccessFlag = responseData?.success === true;
      const hasData = responseData !== null && responseData !== undefined;

      if (isSuccess && hasData) {
        return {
          success: true,
          data: responseData,
          error: null,
          statusCode: response.status
        };
      }

      // Server returned error
      return {
        success: false,
        data: null,
        error: responseData?.message || responseData?.error || `HTTP ${response.status}`,
        statusCode: response.status
      };

    } catch (error: any) {
      lastError = error;
      
      // If this isn't the last retry, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // All retries failed
  return {
    success: false,
    data: null,
    error: lastError?.message || 'Request failed after retries',
    statusCode: lastError?.response?.status || 500
  };
}

/**
 * WordPress Vendor API - Stable Wrappers
 */
export class StableVendorAPI {
  private authHeader: string | null = null;

  setAuth(authToken: string) {
    this.authHeader = `Basic ${authToken}`;
  }

  private getHeaders() {
    return this.authHeader ? { 'Authorization': this.authHeader } : {};
  }

  async getSettings() {
    return stableApiCall(
      `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/settings`,
      { headers: this.getHeaders() }
    );
  }

  async updateSettings(settings: any) {
    return stableApiCall(
      `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/settings`,
      {
        method: 'PUT',
        data: settings,
        headers: this.getHeaders()
      }
    );
  }

  async getProducts(page = 1, perPage = 100) {
    return stableApiCall(
      `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/products`,
      {
        headers: this.getHeaders(),
        timeout: 15000
      }
    );
  }

  async createProduct(productData: any) {
    return stableApiCall(
      `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/products`,
      {
        method: 'POST',
        data: productData,
        headers: this.getHeaders(),
        timeout: 30000,
        maxRetries: 1 // Don't retry POST (might duplicate)
      }
    );
  }

  async getDashboard() {
    return stableApiCall(
      `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/dashboard`,
      { headers: this.getHeaders() }
    );
  }
}

// Singleton instance
export const vendorAPI = new StableVendorAPI();

/**
 * Response Validator - Ensures data shape is correct
 */
export function validateResponse<T>(
  response: SafeResponse<T>,
  requiredFields: string[] = []
): { isValid: boolean; error?: string } {
  if (!response.success) {
    return { isValid: false, error: response.error || 'Request failed' };
  }

  if (!response.data) {
    return { isValid: false, error: 'No data in response' };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in response.data)) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  return { isValid: true };
}

/**
 * Safe Fetch with Timeout
 */
export async function safeFetch<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  timeoutMs = 10000
): Promise<T> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );

    return await Promise.race([fetcher(), timeout]);
  } catch (error) {
    console.warn('API call failed, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    return fallback;
  }
}

/**
 * Batch API Calls - Prevents overwhelming server
 */
export async function batchApiCalls<T>(
  calls: Array<() => Promise<T>>,
  concurrency = 3
): Promise<T[]> {
  const results: T[] = [];
  const queue = [...calls];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.allSettled(batch.map(call => call()));
    
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ).filter(Boolean) as T[]);
  }

  return results;
}

/**
 * Cache Layer - Prevents redundant requests
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export async function cachedApiCall<T>(
  key: string,
  fetcher: () => Promise<SafeResponse<T>>,
  ttl = CACHE_TTL
): Promise<SafeResponse<T>> {
  const cached = cache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < ttl) {
    console.log('📦 Cache hit:', key);
    return cached.data;
  }

  const result = await fetcher();
  
  if (result.success) {
    cache.set(key, { data: result, timestamp: Date.now() });
  }
  
  return result;
}

/**
 * Clear cache
 */
export function clearApiCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

