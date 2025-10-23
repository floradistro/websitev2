-- ============================================================================
-- YACHT CLUB - WHOLESALE/DISTRIBUTOR SYSTEM
-- Adds wholesale marketplace for distributors with access control
-- Only vendors and wholesale-approved customers can access distributor products
-- ============================================================================

-- ============================================================================
-- 1. EXTEND VENDORS TABLE - Add vendor type
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_type_enum') THEN
    CREATE TYPE vendor_type_enum AS ENUM ('standard', 'distributor', 'both');
  END IF;
END $$;

ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS vendor_type vendor_type_enum DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS wholesale_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributor_terms TEXT,
  ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distributor_license_number TEXT,
  ADD COLUMN IF NOT EXISTS distributor_license_expiry DATE;

-- Index for faster vendor type lookups
CREATE INDEX IF NOT EXISTS vendors_vendor_type_idx ON public.vendors(vendor_type) WHERE vendor_type IN ('distributor', 'both');
CREATE INDEX IF NOT EXISTS vendors_wholesale_enabled_idx ON public.vendors(wholesale_enabled) WHERE wholesale_enabled = true;


-- ============================================================================
-- 2. EXTEND CUSTOMERS TABLE - Add wholesale approval
-- ============================================================================
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS is_wholesale_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS wholesale_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wholesale_approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS wholesale_business_name TEXT,
  ADD COLUMN IF NOT EXISTS wholesale_license_number TEXT,
  ADD COLUMN IF NOT EXISTS wholesale_license_expiry DATE,
  ADD COLUMN IF NOT EXISTS wholesale_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS wholesale_application_status TEXT DEFAULT 'none' CHECK (wholesale_application_status IN ('none', 'pending', 'approved', 'rejected'));

-- Index for faster wholesale customer lookups
CREATE INDEX IF NOT EXISTS customers_wholesale_approved_idx ON public.customers(is_wholesale_approved) WHERE is_wholesale_approved = true;
CREATE INDEX IF NOT EXISTS customers_wholesale_application_idx ON public.customers(wholesale_application_status);


-- ============================================================================
-- 3. EXTEND PRODUCTS TABLE - Add wholesale flag
-- ============================================================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS wholesale_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimum_wholesale_quantity DECIMAL(10,2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10,2);

-- Index for wholesale product filtering
CREATE INDEX IF NOT EXISTS products_wholesale_idx ON public.products(is_wholesale) WHERE is_wholesale = true;
CREATE INDEX IF NOT EXISTS products_wholesale_only_idx ON public.products(wholesale_only) WHERE wholesale_only = true;


-- ============================================================================
-- 4. WHOLESALE PRICING TABLE
-- Tier-based pricing for wholesale customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wholesale_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Tier information
  tier_name TEXT NOT NULL, -- e.g., "Bronze", "Silver", "Gold"
  minimum_quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  
  -- Discount information
  discount_percentage DECIMAL(5,2),
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Metadata
  description TEXT,
  terms TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure minimum quantity increases per tier
  UNIQUE(product_id, minimum_quantity)
);

CREATE INDEX IF NOT EXISTS wholesale_pricing_product_idx ON public.wholesale_pricing(product_id);
CREATE INDEX IF NOT EXISTS wholesale_pricing_vendor_idx ON public.wholesale_pricing(vendor_id);
CREATE INDEX IF NOT EXISTS wholesale_pricing_active_idx ON public.wholesale_pricing(is_active) WHERE is_active = true;


-- ============================================================================
-- 5. WHOLESALE APPLICATIONS TABLE
-- Track wholesale approval requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wholesale_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Applicant
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Business information
  business_name TEXT NOT NULL,
  business_type TEXT, -- LLC, Corporation, Sole Proprietor, etc.
  business_address JSONB NOT NULL,
  
  -- License information
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  license_document_url TEXT, -- Supabase Storage URL
  
  -- Tax information
  tax_id TEXT NOT NULL,
  resale_certificate_url TEXT, -- Supabase Storage URL
  
  -- Contact
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Application status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  
  -- Review details
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wholesale_applications_customer_idx ON public.wholesale_applications(customer_id);
CREATE INDEX IF NOT EXISTS wholesale_applications_status_idx ON public.wholesale_applications(status);


-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Wholesale Pricing - Only accessible to wholesale-approved users and vendors
ALTER TABLE public.wholesale_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wholesale approved customers can view pricing" ON public.wholesale_pricing;
CREATE POLICY "Wholesale approved customers can view pricing"
  ON public.wholesale_pricing FOR SELECT
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
    AND (
      -- Wholesale-approved customers can see pricing
      auth.uid() IN (
        SELECT auth_user_id FROM public.customers 
        WHERE is_wholesale_approved = true
      )
      OR
      -- Vendors can see their own pricing
      vendor_id IN (
        SELECT id FROM public.vendors 
        WHERE auth.uid()::text = id::text
      )
    )
  );

DROP POLICY IF EXISTS "Vendors can manage own wholesale pricing" ON public.wholesale_pricing;
CREATE POLICY "Vendors can manage own wholesale pricing"
  ON public.wholesale_pricing FOR ALL
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE auth.uid()::text = id::text
    )
  );

DROP POLICY IF EXISTS "Service role full access to wholesale pricing" ON public.wholesale_pricing;
CREATE POLICY "Service role full access to wholesale pricing"
  ON public.wholesale_pricing FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Wholesale Applications - Customers can view/create their own
ALTER TABLE public.wholesale_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own applications" ON public.wholesale_applications;
CREATE POLICY "Customers can view own applications"
  ON public.wholesale_applications FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can create applications" ON public.wholesale_applications;
CREATE POLICY "Customers can create applications"
  ON public.wholesale_applications FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to applications" ON public.wholesale_applications;
CREATE POLICY "Service role full access to applications"
  ON public.wholesale_applications FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Update Products RLS - Hide wholesale-only products from non-wholesale users
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
  ON public.products FOR SELECT
  USING (
    status = 'published' 
    AND (
      -- Regular products visible to all
      wholesale_only = false 
      OR
      -- Wholesale products visible to approved customers
      (
        wholesale_only = true 
        AND (
          auth.uid() IN (
            SELECT auth_user_id FROM public.customers 
            WHERE is_wholesale_approved = true
          )
          OR
          -- Vendors can see all products
          auth.uid()::text IN (
            SELECT id::text FROM public.vendors
          )
        )
      )
    )
  );


-- ============================================================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER wholesale_pricing_updated_at 
  BEFORE UPDATE ON public.wholesale_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER wholesale_applications_updated_at 
  BEFORE UPDATE ON public.wholesale_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Auto-approve customer when application is approved
CREATE OR REPLACE FUNCTION approve_wholesale_customer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.customers
    SET 
      is_wholesale_approved = true,
      wholesale_approved_at = NOW(),
      wholesale_approved_by = NEW.reviewed_by,
      wholesale_application_status = 'approved',
      wholesale_business_name = NEW.business_name,
      wholesale_license_number = NEW.license_number,
      wholesale_license_expiry = NEW.license_expiry,
      wholesale_tax_id = NEW.tax_id
    WHERE id = NEW.customer_id;
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    UPDATE public.customers
    SET wholesale_application_status = 'rejected'
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approve_wholesale_trigger
  AFTER UPDATE ON public.wholesale_applications
  FOR EACH ROW 
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION approve_wholesale_customer();


-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has wholesale access
CREATE OR REPLACE FUNCTION has_wholesale_access(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.customers 
    WHERE auth_user_id = user_id 
      AND is_wholesale_approved = true
  ) OR EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE auth.uid()::text = id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get best wholesale price for a product
CREATE OR REPLACE FUNCTION get_wholesale_price(
  p_product_id UUID, 
  p_quantity DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  best_price DECIMAL;
BEGIN
  SELECT unit_price INTO best_price
  FROM public.wholesale_pricing
  WHERE product_id = p_product_id
    AND is_active = true
    AND minimum_quantity <= p_quantity
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  ORDER BY minimum_quantity DESC
  LIMIT 1;
  
  RETURN COALESCE(best_price, 
    (SELECT wholesale_price FROM public.products WHERE id = p_product_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 9. GRANTS
-- ============================================================================

GRANT ALL ON public.wholesale_pricing TO authenticated, service_role;
GRANT ALL ON public.wholesale_applications TO authenticated, service_role;


-- ============================================================================
-- 10. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.wholesale_pricing IS 'Tier-based wholesale pricing for distributor products';
COMMENT ON TABLE public.wholesale_applications IS 'Customer applications for wholesale access';
COMMENT ON COLUMN public.vendors.vendor_type IS 'Type of vendor: standard (retail), distributor (wholesale), or both';
COMMENT ON COLUMN public.customers.is_wholesale_approved IS 'Whether customer has been approved for wholesale purchasing';
COMMENT ON COLUMN public.products.wholesale_only IS 'If true, product only visible to wholesale-approved users';

