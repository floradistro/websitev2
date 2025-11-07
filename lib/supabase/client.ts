import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use Supabase connection pooler for better scalability
// Pooler endpoint: Add .pooler suffix to project host for transaction mode
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
}

// Singleton instance to prevent multiple GoTrueClient warnings
let supabaseInstance: SupabaseClient | null = null;
let clientInstanceCount = 0;

function createSupabaseClient() {
  if (supabaseInstance) {
    console.log('✅ Returning existing Supabase client instance');
    return supabaseInstance;
  }

  clientInstanceCount++;
  console.log('🔵 Creating Supabase client instance #', clientInstanceCount);

  if (clientInstanceCount > 1) {
    console.error('❌ MULTIPLE CLIENT INSTANCES DETECTED!', new Error().stack);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true, // Enable auto-refresh to maintain sessions
      persistSession: true, // Enable session persistence to prevent 401 errors
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'whaletools-auth-token',
    },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'yachtclub',
      'x-client-info': 'yachtclub-web/2.0.0',
      'Connection': 'keep-alive', // Reuse connections
    },
    fetch: (url, options = {}) => {
      // Add timeout to all requests with connection pooling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
        keepalive: true, // Enable connection reuse
      }).finally(() => clearTimeout(timeoutId));
    }
  },
    // Performance settings - reduced realtime to save resources
    realtime: {
      params: {
        eventsPerSecond: 5
      }
    }
  });

  return supabaseInstance;
}

// Export singleton instance
export const supabase = createSupabaseClient();

// Singleton for service role client (server-side only)
let serviceSupabaseInstance: SupabaseClient | null = null;
let serviceInstanceCount = 0;

export function getServiceSupabase() {
  if (serviceSupabaseInstance) {
    return serviceSupabaseInstance;
  }

  serviceInstanceCount++;
  console.log('🟢 Creating Supabase SERVICE instance #', serviceInstanceCount);

  if (serviceInstanceCount > 1) {
    console.error('❌ MULTIPLE SERVICE INSTANCES DETECTED!', new Error().stack);
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for service role access');
  }

  // Use pooler URL for service role (better for high-concurrency serverless)
  // NOTE: In production, use environment variable for pooler URL
  const poolerUrl = process.env.SUPABASE_POOLER_URL || supabaseUrl || '';

  serviceSupabaseInstance = createClient(poolerUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'yachtclub-service',
        'x-client-info': 'yachtclub-service/2.0.0',
        'Connection': 'keep-alive',
      },
      fetch: (url, options = {}) => {
        // Add timeout to all server requests with connection reuse
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        return fetch(url, {
          ...options,
          signal: controller.signal,
          keepalive: true, // Reuse connections across requests
        }).finally(() => clearTimeout(timeoutId));
      }
    }
  });
  
  return serviceSupabaseInstance;
}

export type Vendor = {
  id: string;
  email: string;
  store_name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending';
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  total_locations: number;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  name: string;
  slug: string;
  type: 'retail' | 'vendor' | 'warehouse' | 'distribution';
  vendor_id: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  is_active: boolean;
  is_primary: boolean;
  pos_enabled: boolean;
  pricing_tier: 'standard' | 'premium' | 'enterprise' | 'custom';
  billing_status: 'active' | 'suspended' | 'trial' | 'cancelled';
  monthly_fee: number;
  trial_end_date: string | null;
  billing_start_date: string;
  accepts_online_orders: boolean;
  accepts_transfers: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
};

