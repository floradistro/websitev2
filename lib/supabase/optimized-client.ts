/**
 * Optimized Supabase Client with Connection Pooling and Performance Enhancements
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side singleton with optimizations
let clientInstance: SupabaseClient | null = null;

export function getOptimizedClient() {
  if (clientInstance) {
    return clientInstance;
  }

  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // More secure
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'floradistro',
        'x-client-info': 'floradistro-web/1.0.0',
      },
      fetch: (url, options = {}) => {
        // Add timeout to all requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 5, // Rate limit realtime
      },
    },
  });

  return clientInstance;
}

// Server-side singleton with service role
let serviceInstance: SupabaseClient | null = null;

export function getOptimizedServiceClient() {
  if (serviceInstance) {
    return serviceInstance;
  }

  serviceInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'floradistro-service',
        'x-client-info': 'floradistro-service/1.0.0',
      },
      fetch: (url, options = {}) => {
        // Add timeout to all requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
    },
  });

  return serviceInstance;
}

/**
 * Batch query executor - executes multiple queries in parallel
 */
export async function batchQuery<T = any>(
  client: SupabaseClient,
  queries: Array<() => Promise<any>>
): Promise<T[]> {
  const results = await Promise.allSettled(queries.map(q => q()));
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error('Batch query failed:', result.reason);
      return null;
    }
  });
}

/**
 * Retry wrapper for failed queries
 */
export async function retryQuery<T = any>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 4xx errors
      if (error.code && error.code.startsWith('4')) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Query failed after retries');
}

/**
 * Cleanup function for browser
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Clean up connections
    clientInstance = null;
    serviceInstance = null;
  });
}

