import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Optimized client configuration with connection pooling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'floradistro',
      'x-client-info': 'floradistro-web/1.0.0'
    },
    fetch: (url, options = {}) => {
      // Add timeout to all requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
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

// Singleton for service role client (server-side only)
let serviceSupabaseInstance: SupabaseClient | null = null;

export function getServiceSupabase() {
  if (serviceSupabaseInstance) {
    return serviceSupabaseInstance;
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  serviceSupabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'floradistro-service',
        'x-client-info': 'floradistro-service/1.0.0'
      },
      fetch: (url, options = {}) => {
        // Add timeout to all server requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      }
    }
  });
  
  return serviceSupabaseInstance;
}

// Cleanup on process termination (server-side)
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    serviceSupabaseInstance = null;
  });
  process.on('SIGINT', () => {
    serviceSupabaseInstance = null;
  });
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

