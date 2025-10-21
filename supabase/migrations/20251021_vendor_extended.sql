-- ============================================================================
-- FLORA DISTRO - VENDOR EXTENDED FEATURES (Supabase)
-- Completes the vendor portal: branding, COAs, settings, analytics
-- This brings us to 100% Flora Matrix parity
-- ============================================================================

-- ============================================================================
-- 1. VENDOR BRANDING (Store Customization)
-- ============================================================================

-- Add branding fields to existing vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS store_description TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS store_tagline TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{"primary": "#000000", "secondary": "#ffffff", "accent": "#4F46E5"}';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "twitter": "", "website": ""}';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS custom_font TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS return_policy TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS shipping_policy TEXT;


-- ============================================================================
-- 2. VENDOR COAs (Certificates of Analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_coas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- File info
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER, -- Bytes
  file_type TEXT DEFAULT 'application/pdf',
  
  -- COA details
  lab_name TEXT,
  test_date DATE,
  expiry_date DATE,
  batch_number TEXT,
  
  -- Test results (JSONB for flexibility)
  test_results JSONB DEFAULT '{}', -- e.g., {"thc": 22.5, "cbd": 0.5, "terpenes": {...}}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- Admin verified
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_coas_vendor_idx ON public.vendor_coas(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_coas_product_idx ON public.vendor_coas(product_id);
CREATE INDEX IF NOT EXISTS vendor_coas_expiry_idx ON public.vendor_coas(expiry_date);
CREATE INDEX IF NOT EXISTS vendor_coas_active_idx ON public.vendor_coas(is_active);


-- ============================================================================
-- 3. VENDOR SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_settings (
  vendor_id UUID PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notifications JSONB DEFAULT '{
    "new_order": true,
    "low_stock": true,
    "product_review": true,
    "payout_processed": true,
    "email_enabled": true,
    "sms_enabled": false
  }',
  
  -- Payout preferences
  payout_preferences JSONB DEFAULT '{
    "method": "bank_transfer",
    "schedule": "weekly",
    "minimum_amount": 100,
    "bank_name": "",
    "account_number": "",
    "routing_number": ""
  }',
  
  -- Fulfillment settings
  fulfillment_settings JSONB DEFAULT '{
    "processing_time_days": 2,
    "shipping_carriers": [],
    "auto_fulfill": false,
    "require_signature": false
  }',
  
  -- Tax settings
  tax_settings JSONB DEFAULT '{
    "tax_id": "",
    "sales_tax_registered": false,
    "collect_tax": true
  }',
  
  -- Business info
  business_info JSONB DEFAULT '{
    "business_name": "",
    "business_type": "",
    "license_number": "",
    "license_expiry": ""
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 4. VENDOR ANALYTICS (Pre-calculated metrics for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Sales metrics
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  -- Revenue metrics
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  net_revenue DECIMAL(10,2) DEFAULT 0,
  commission_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Product metrics
  total_items_sold INTEGER DEFAULT 0,
  unique_products_sold INTEGER DEFAULT 0,
  top_product_id UUID REFERENCES public.products(id),
  
  -- Customer metrics
  unique_customers INTEGER DEFAULT 0,
  repeat_customers INTEGER DEFAULT 0,
  
  -- Averages
  average_order_value DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vendor_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS vendor_analytics_vendor_idx ON public.vendor_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_analytics_period_idx ON public.vendor_analytics(period_type, period_start);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- COAs - vendors can manage their own
ALTER TABLE public.vendor_coas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own COAs" ON public.vendor_coas;
CREATE POLICY "Vendors can view own COAs"
  ON public.vendor_coas FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Vendors can manage own COAs" ON public.vendor_coas;
CREATE POLICY "Vendors can manage own COAs"
  ON public.vendor_coas FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Service role full access to COAs" ON public.vendor_coas;
CREATE POLICY "Service role full access to COAs"
  ON public.vendor_coas FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Settings - vendors can manage their own
ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own settings" ON public.vendor_settings;
CREATE POLICY "Vendors can view own settings"
  ON public.vendor_settings FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Vendors can update own settings" ON public.vendor_settings;
CREATE POLICY "Vendors can update own settings"
  ON public.vendor_settings FOR UPDATE
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Service role full access to settings" ON public.vendor_settings;
CREATE POLICY "Service role full access to settings"
  ON public.vendor_settings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Analytics - vendors can view their own
ALTER TABLE public.vendor_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own analytics" ON public.vendor_analytics;
CREATE POLICY "Vendors can view own analytics"
  ON public.vendor_analytics FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Service role full access to analytics" ON public.vendor_analytics;
CREATE POLICY "Service role full access to analytics"
  ON public.vendor_analytics FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER vendor_coas_updated_at BEFORE UPDATE ON public.vendor_coas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vendor_settings_updated_at BEFORE UPDATE ON public.vendor_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Create default settings when vendor is created
CREATE OR REPLACE FUNCTION create_default_vendor_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vendor_settings (vendor_id)
  VALUES (NEW.id)
  ON CONFLICT (vendor_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_vendor_settings
  AFTER INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION create_default_vendor_settings();


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.vendor_coas TO authenticated, service_role;
GRANT ALL ON public.vendor_settings TO authenticated, service_role;
GRANT ALL ON public.vendor_analytics TO authenticated, service_role;

