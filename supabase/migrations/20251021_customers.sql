-- ============================================================================
-- FLORA DISTRO - CUSTOMERS & AUTH (Supabase)
-- Complete customer system with unified auth
-- No data loss - full WooCommerce parity
-- ============================================================================

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE, -- WooCommerce customer ID
  
  -- Auth (linked to Supabase auth.users)
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal info
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  
  -- Billing address (JSONB for flexibility)
  billing_address JSONB DEFAULT '{
    "first_name": "",
    "last_name": "",
    "company": "",
    "address_1": "",
    "address_2": "",
    "city": "",
    "state": "",
    "postcode": "",
    "country": "US",
    "email": "",
    "phone": ""
  }',
  
  -- Shipping address (JSONB for flexibility)
  shipping_address JSONB DEFAULT '{
    "first_name": "",
    "last_name": "",
    "company": "",
    "address_1": "",
    "address_2": "",
    "city": "",
    "state": "",
    "postcode": "",
    "country": "US"
  }',
  
  -- Display
  avatar_url TEXT,
  display_name TEXT,
  
  -- Stats (updated by triggers or batch jobs)
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  
  -- Loyalty & Rewards
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  
  -- Preferences
  marketing_opt_in BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'en',
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  
  -- WooCommerce data
  role TEXT DEFAULT 'customer',
  is_paying_customer BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  date_registered TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers(email);
CREATE INDEX IF NOT EXISTS customers_auth_user_idx ON public.customers(auth_user_id);
CREATE INDEX IF NOT EXISTS customers_wordpress_id_idx ON public.customers(wordpress_id);
CREATE INDEX IF NOT EXISTS customers_username_idx ON public.customers(username);
CREATE INDEX IF NOT EXISTS customers_total_spent_idx ON public.customers(total_spent);
CREATE INDEX IF NOT EXISTS customers_loyalty_tier_idx ON public.customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS customers_active_idx ON public.customers(is_active);

-- Full text search
CREATE INDEX IF NOT EXISTS customers_search_idx ON public.customers 
  USING gin(to_tsvector('english', 
    COALESCE(first_name, '') || ' ' || 
    COALESCE(last_name, '') || ' ' || 
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '')
  ));


-- ============================================================================
-- CUSTOMER ADDRESSES TABLE (Alternative to JSONB - for complex address management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Address type
  type TEXT NOT NULL CHECK (type IN ('billing', 'shipping', 'both')),
  
  -- Address details
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  address_1 TEXT NOT NULL,
  address_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  label TEXT, -- e.g., "Home", "Work", "Parents House"
  
  -- Metadata
  delivery_instructions TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS customer_addresses_type_idx ON public.customer_addresses(type);
CREATE INDEX IF NOT EXISTS customer_addresses_default_idx ON public.customer_addresses(is_default);


-- ============================================================================
-- CUSTOMER NOTES TABLE
-- Admin/internal notes about customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Note details
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'support', 'billing', 'fraud', 'vip')),
  
  -- User who created note
  created_by UUID REFERENCES auth.users(id),
  
  -- Visibility
  is_customer_visible BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_notes_customer_idx ON public.customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS customer_notes_type_idx ON public.customer_notes(note_type);


-- ============================================================================
-- CUSTOMER ACTIVITY LOG
-- Track customer actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'logout', 'register', 'password_reset', 
    'profile_update', 'address_update', 'order_placed',
    'review_posted', 'wishlist_add', 'cart_add'
  )),
  
  -- Context
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_activity_customer_idx ON public.customer_activity(customer_id);
CREATE INDEX IF NOT EXISTS customer_activity_type_idx ON public.customer_activity(activity_type);
CREATE INDEX IF NOT EXISTS customer_activity_created_idx ON public.customer_activity(created_at);


-- ============================================================================
-- CUSTOMER LOYALTY TRANSACTIONS
-- Track loyalty points
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Transaction
  points INTEGER NOT NULL, -- Positive for earning, negative for spending
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'spent', 'expired', 'adjusted', 'bonus')),
  
  -- Reference
  reference_type TEXT, -- 'order', 'review', 'referral', 'manual', etc.
  reference_id TEXT,
  
  -- Details
  description TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Balance tracking
  balance_before INTEGER,
  balance_after INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS loyalty_transactions_customer_idx ON public.loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_type_idx ON public.loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS loyalty_transactions_created_idx ON public.loyalty_transactions(created_at);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Customers - can view own data
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
CREATE POLICY "Customers can view own profile"
  ON public.customers FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile"
  ON public.customers FOR UPDATE
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Service role full access to customers" ON public.customers;
CREATE POLICY "Service role full access to customers"
  ON public.customers FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Customer Addresses - can view own addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can view own addresses"
  ON public.customer_addresses FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage own addresses"
  ON public.customer_addresses FOR ALL
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to addresses" ON public.customer_addresses;
CREATE POLICY "Service role full access to addresses"
  ON public.customer_addresses FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Customer Activity - can view own activity
ALTER TABLE public.customer_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own activity" ON public.customer_activity;
CREATE POLICY "Customers can view own activity"
  ON public.customer_activity FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to activity" ON public.customer_activity;
CREATE POLICY "Service role full access to activity"
  ON public.customer_activity FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Loyalty - can view own transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own loyalty" ON public.loyalty_transactions;
CREATE POLICY "Customers can view own loyalty"
  ON public.loyalty_transactions FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to loyalty" ON public.loyalty_transactions;
CREATE POLICY "Service role full access to loyalty"
  ON public.loyalty_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Update customer stats when loyalty points change
CREATE OR REPLACE FUNCTION update_customer_loyalty_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer's loyalty points
  UPDATE public.customers
  SET loyalty_points = loyalty_points + NEW.points
  WHERE id = NEW.customer_id;
  
  -- Set balance_after
  NEW.balance_after := (SELECT loyalty_points FROM public.customers WHERE id = NEW.customer_id);
  
  -- Auto-update tier based on points
  UPDATE public.customers
  SET loyalty_tier = CASE
    WHEN loyalty_points >= 10000 THEN 'platinum'
    WHEN loyalty_points >= 5000 THEN 'gold'
    WHEN loyalty_points >= 2500 THEN 'silver'
    ELSE 'bronze'
  END
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_balance
  BEFORE INSERT ON public.loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION update_customer_loyalty_balance();


-- Log activity when customer updates profile
CREATE OR REPLACE FUNCTION log_customer_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.first_name IS DISTINCT FROM OLD.first_name 
     OR NEW.last_name IS DISTINCT FROM OLD.last_name 
     OR NEW.phone IS DISTINCT FROM OLD.phone THEN
    
    INSERT INTO public.customer_activity (
      customer_id,
      activity_type,
      description
    ) VALUES (
      NEW.id,
      'profile_update',
      'Customer updated their profile'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_profile_updates
  AFTER UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION log_customer_activity();


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.customers TO authenticated, service_role;
GRANT ALL ON public.customer_addresses TO authenticated, service_role;
GRANT ALL ON public.customer_notes TO authenticated, service_role;
GRANT ALL ON public.customer_activity TO authenticated, service_role;
GRANT ALL ON public.loyalty_transactions TO authenticated, service_role;

