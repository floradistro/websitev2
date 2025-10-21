-- ============================================================================
-- ENHANCE EXISTING LOCATIONS TABLE FOR MULTI-LOCATION BILLING
-- Adds POS and billing features to existing locations infrastructure
-- No duplicate tables - uses existing inventory/POS/transfer system
-- ============================================================================

-- ============================================================================
-- 1. ADD BILLING & POS COLUMNS TO EXISTING LOCATIONS TABLE
-- ============================================================================

ALTER TABLE public.locations 
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pos_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'standard' 
    CHECK (pricing_tier IN ('standard', 'premium', 'enterprise', 'custom')),
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'active'
    CHECK (billing_status IN ('active', 'suspended', 'trial', 'cancelled')),
  ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 49.99,
  ADD COLUMN IF NOT EXISTS trial_end_date DATE,
  ADD COLUMN IF NOT EXISTS billing_start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS business_license TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS locations_is_primary_idx ON public.locations(is_primary);
CREATE INDEX IF NOT EXISTS locations_pos_enabled_idx ON public.locations(pos_enabled);
CREATE INDEX IF NOT EXISTS locations_billing_status_idx ON public.locations(billing_status);
CREATE INDEX IF NOT EXISTS locations_pricing_tier_idx ON public.locations(pricing_tier);

COMMENT ON COLUMN public.locations.is_primary IS 'Primary/main location for a vendor (usually warehouse)';
COMMENT ON COLUMN public.locations.pos_enabled IS 'Whether this location can process POS transactions';
COMMENT ON COLUMN public.locations.pricing_tier IS 'Pricing tier for this location (standard/premium/enterprise/custom)';
COMMENT ON COLUMN public.locations.billing_status IS 'Billing status (active/suspended/trial/cancelled)';
COMMENT ON COLUMN public.locations.monthly_fee IS 'Monthly fee for this location (0 for primary/warehouse)';


-- ============================================================================
-- 2. SET EXISTING VENDOR WAREHOUSES AS PRIMARY AND FREE
-- ============================================================================

-- Mark existing vendor warehouses as primary and free
UPDATE public.locations 
SET 
  is_primary = true, 
  monthly_fee = 0,
  pos_enabled = true,
  billing_status = 'active'
WHERE type IN ('vendor', 'warehouse') 
  AND is_default = true
  AND vendor_id IS NOT NULL;

-- Mark any retail locations as billable
UPDATE public.locations 
SET 
  is_primary = false, 
  monthly_fee = 49.99,
  pos_enabled = true,
  billing_status = 'active'
WHERE type = 'retail' 
  AND vendor_id IS NOT NULL;


-- ============================================================================
-- 3. ADD LOCATION COUNT TO VENDORS TABLE
-- ============================================================================

ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS total_locations INTEGER DEFAULT 0;

-- Update existing counts
UPDATE public.vendors v
SET total_locations = (
  SELECT COUNT(*) 
  FROM public.locations l 
  WHERE l.vendor_id = v.id
);

CREATE INDEX IF NOT EXISTS vendors_total_locations_idx ON public.vendors(total_locations);


-- ============================================================================
-- 4. CREATE TRIGGER TO AUTO-UPDATE LOCATION COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendor_location_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count on INSERT or DELETE
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vendors 
    SET total_locations = (
      SELECT COUNT(*) FROM public.locations WHERE vendor_id = NEW.vendor_id
    )
    WHERE id = NEW.vendor_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vendors 
    SET total_locations = (
      SELECT COUNT(*) FROM public.locations WHERE vendor_id = OLD.vendor_id
    )
    WHERE id = OLD.vendor_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.vendor_id != OLD.vendor_id THEN
    -- Handle vendor_id change (rare but possible)
    UPDATE public.vendors 
    SET total_locations = (
      SELECT COUNT(*) FROM public.locations WHERE vendor_id = NEW.vendor_id
    )
    WHERE id = NEW.vendor_id;
    
    UPDATE public.vendors 
    SET total_locations = (
      SELECT COUNT(*) FROM public.locations WHERE vendor_id = OLD.vendor_id
    )
    WHERE id = OLD.vendor_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vendor_location_count_trigger ON public.locations;
CREATE TRIGGER update_vendor_location_count_trigger
  AFTER INSERT OR DELETE OR UPDATE OF vendor_id ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_vendor_location_count();


-- ============================================================================
-- 5. CREATE TRIGGER TO MANAGE PRIMARY LOCATION
-- ============================================================================

CREATE OR REPLACE FUNCTION manage_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first location for a vendor, make it primary
  IF TG_OP = 'INSERT' AND NEW.vendor_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM public.locations WHERE vendor_id = NEW.vendor_id) = 1 THEN
      NEW.is_primary = true;
      NEW.monthly_fee = 0; -- First location is free
    END IF;
  END IF;
  
  -- If setting a new primary, unset others
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_primary = true AND NEW.vendor_id IS NOT NULL THEN
    UPDATE public.locations 
    SET is_primary = false 
    WHERE vendor_id = NEW.vendor_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS manage_primary_location_trigger ON public.locations;
CREATE TRIGGER manage_primary_location_trigger
  BEFORE INSERT OR UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION manage_primary_location();


-- ============================================================================
-- 6. CREATE VIEW FOR BILLABLE LOCATIONS
-- ============================================================================

CREATE OR REPLACE VIEW public.billable_locations AS
SELECT 
  l.*,
  v.store_name as vendor_name,
  v.email as vendor_email,
  CASE 
    WHEN l.is_primary THEN 'Included'
    WHEN l.billing_status = 'trial' THEN 'Trial'
    WHEN l.billing_status = 'active' THEN 'Billed'
    ELSE 'N/A'
  END as billing_type
FROM public.locations l
JOIN public.vendors v ON l.vendor_id = v.id
WHERE l.vendor_id IS NOT NULL
ORDER BY v.store_name, l.is_primary DESC, l.created_at;

COMMENT ON VIEW public.billable_locations IS 'All vendor locations with billing information';


-- ============================================================================
-- 7. CREATE VIEW FOR VENDOR BILLING SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW public.vendor_billing_summary AS
SELECT 
  v.id as vendor_id,
  v.store_name,
  v.email,
  v.total_locations,
  COUNT(l.id) FILTER (WHERE l.is_primary) as primary_locations,
  COUNT(l.id) FILTER (WHERE NOT l.is_primary) as additional_locations,
  SUM(l.monthly_fee) FILTER (WHERE l.billing_status = 'active') as monthly_total,
  COUNT(l.id) FILTER (WHERE l.billing_status = 'trial') as trial_locations,
  COUNT(l.id) FILTER (WHERE l.pos_enabled) as pos_enabled_locations
FROM public.vendors v
LEFT JOIN public.locations l ON l.vendor_id = v.id
GROUP BY v.id, v.store_name, v.email, v.total_locations
ORDER BY v.store_name;

COMMENT ON VIEW public.vendor_billing_summary IS 'Summary of vendor locations and billing';


-- ============================================================================
-- 8. UPDATE RLS POLICIES (if needed)
-- ============================================================================

-- Vendors can create their own locations
DROP POLICY IF EXISTS "Vendors can create own locations" ON public.locations;
CREATE POLICY "Vendors can create own locations"
  ON public.locations FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Vendors can update their own locations
DROP POLICY IF EXISTS "Vendors can update own locations" ON public.locations;
CREATE POLICY "Vendors can update own locations"
  ON public.locations FOR UPDATE
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Vendors can delete non-primary locations
DROP POLICY IF EXISTS "Vendors can delete own non-primary locations" ON public.locations;
CREATE POLICY "Vendors can delete own non-primary locations"
  ON public.locations FOR DELETE
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text)
    AND is_primary = false
  );


-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to get billable amount for a vendor
CREATE OR REPLACE FUNCTION get_vendor_monthly_billing(vendor_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT COALESCE(SUM(monthly_fee), 0)
  FROM public.locations
  WHERE vendor_id = vendor_uuid
    AND billing_status = 'active'
    AND NOT is_primary;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_vendor_monthly_billing IS 'Calculate total monthly billing for a vendor (excluding primary location)';


-- Function to check if vendor can add more locations
CREATE OR REPLACE FUNCTION can_vendor_add_location(vendor_uuid UUID, max_locations INTEGER DEFAULT 50)
RETURNS BOOLEAN AS $$
  SELECT COUNT(*) < max_locations
  FROM public.locations
  WHERE vendor_id = vendor_uuid;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION can_vendor_add_location IS 'Check if vendor is under location limit';


-- ============================================================================
-- 10. CREATE SAMPLE QUERIES FOR REFERENCE
-- ============================================================================

-- Get all locations for a vendor with billing info
COMMENT ON TABLE public.locations IS 
'Locations table - handles retail stores, warehouses, distribution centers.
Primary location (is_primary=true) is free, additional locations are $49.99/mo.
Linked to inventory, pos_transactions, and stock_transfers.

Example queries:
-- Get all vendor locations with billing:
SELECT * FROM billable_locations WHERE vendor_id = ''uuid'';

-- Get vendor billing summary:
SELECT * FROM vendor_billing_summary WHERE vendor_id = ''uuid'';

-- Calculate monthly bill:
SELECT get_vendor_monthly_billing(''uuid'');

-- Add new retail location:
INSERT INTO locations (name, slug, type, vendor_id, city, state, monthly_fee)
VALUES (''Store 2'', ''store-2'', ''retail'', ''uuid'', ''LA'', ''CA'', 49.99);
';


-- ============================================================================
-- COMPLETE - NO DUPLICATE TABLES CREATED
-- ============================================================================

-- Summary of changes:
-- ✅ Enhanced existing locations table with billing columns
-- ✅ Existing inventory table still works (location_id FK)
-- ✅ Existing pos_transactions still works (location_id FK)
-- ✅ Existing stock_transfers still works (from/to location_id)
-- ✅ Existing stock_movements still works (location references)
-- ✅ No data duplication
-- ✅ Single source of truth maintained
-- ✅ Industry best practices followed

