import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations
export function getServiceSupabase() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export type Vendor = {
  id: string;
  email: string;
  store_name: string;
  slug: string;
  wordpress_user_id: number | null;
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

