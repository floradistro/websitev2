-- ============================================================================
-- ADD FLORA DISTRO LOCATIONS TO SUPABASE
-- Migrates existing WP locations to Supabase as vendor locations
-- ============================================================================

-- First, ensure Flora Distro vendor exists
-- If not, we'll need to create one (adjust email/details as needed)
DO $$
DECLARE
  v_flora_vendor_id UUID;
BEGIN
  -- Try to find Flora Distro vendor by common identifiers
  SELECT id INTO v_flora_vendor_id 
  FROM public.vendors 
  WHERE slug = 'flora-distro' OR store_name ILIKE '%flora%distro%'
  LIMIT 1;

  -- If Flora Distro doesn't exist as a vendor, we'll insert locations without vendor_id
  -- (They'll be retail/house locations)
  
  -- ============================================================================
  -- LOCATION 1: Salisbury
  -- ============================================================================
  INSERT INTO public.locations (
    name,
    slug,
    type,
    vendor_id,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    country,
    phone,
    email,
    is_default,
    is_active,
    is_primary,
    pos_enabled,
    accepts_online_orders,
    accepts_transfers,
    pricing_tier,
    billing_status,
    settings
  ) VALUES (
    'Salisbury',
    'salisbury',
    'retail',
    v_flora_vendor_id,
    '111 W Bank Street',
    NULL,
    'Salisbury',
    'NC',
    '28144',
    'US',
    '(704) 633-8889',
    'salisbury@floradistro.com',
    false,
    true,
    false,
    true,
    true,
    true,
    'standard',
    'active',
    '{}'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    updated_at = NOW();

  -- ============================================================================
  -- LOCATION 2: Charlotte Monroe
  -- ============================================================================
  INSERT INTO public.locations (
    name,
    slug,
    type,
    vendor_id,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    country,
    phone,
    email,
    is_default,
    is_active,
    is_primary,
    pos_enabled,
    accepts_online_orders,
    accepts_transfers,
    pricing_tier,
    billing_status,
    settings
  ) VALUES (
    'Charlotte Monroe',
    'charlotte-monroe',
    'retail',
    v_flora_vendor_id,
    '3130 Monroe Road',
    NULL,
    'Charlotte',
    'NC',
    '28205',
    'US',
    '(704) 334-4200',
    'monroe@floradistro.com',
    false,
    true,
    false,
    true,
    true,
    true,
    'standard',
    'active',
    '{}'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    updated_at = NOW();

  -- ============================================================================
  -- LOCATION 3: Charlotte Central (Nations Ford)
  -- ============================================================================
  INSERT INTO public.locations (
    name,
    slug,
    type,
    vendor_id,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    country,
    phone,
    email,
    is_default,
    is_active,
    is_primary,
    pos_enabled,
    accepts_online_orders,
    accepts_transfers,
    pricing_tier,
    billing_status,
    settings
  ) VALUES (
    'Charlotte Central',
    'charlotte-central',
    'retail',
    v_flora_vendor_id,
    '5115 Nations Ford Road',
    NULL,
    'Charlotte',
    'NC',
    '28217',
    'US',
    '(704) 525-5500',
    'central@floradistro.com',
    false,
    true,
    false,
    true,
    true,
    true,
    'standard',
    'active',
    '{}'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    updated_at = NOW();

  -- ============================================================================
  -- LOCATION 4: Blowing Rock
  -- ============================================================================
  INSERT INTO public.locations (
    name,
    slug,
    type,
    vendor_id,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    country,
    phone,
    email,
    is_default,
    is_active,
    is_primary,
    pos_enabled,
    accepts_online_orders,
    accepts_transfers,
    pricing_tier,
    billing_status,
    settings
  ) VALUES (
    'Blowing Rock',
    'blowing-rock',
    'retail',
    v_flora_vendor_id,
    '3894 US 321',
    NULL,
    'Blowing Rock',
    'NC',
    '28605',
    'US',
    '(828) 295-7575',
    'blowingrock@floradistro.com',
    false,
    true,
    false,
    true,
    true,
    true,
    'standard',
    'active',
    '{}'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    updated_at = NOW();

  -- ============================================================================
  -- LOCATION 5: Elizabethton
  -- ============================================================================
  INSERT INTO public.locations (
    name,
    slug,
    type,
    vendor_id,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    country,
    phone,
    email,
    is_default,
    is_active,
    is_primary,
    pos_enabled,
    accepts_online_orders,
    accepts_transfers,
    pricing_tier,
    billing_status,
    settings
  ) VALUES (
    'Elizabethton',
    'elizabethton',
    'retail',
    v_flora_vendor_id,
    '2157 W Elk Ave',
    NULL,
    'Elizabethton',
    'TN',
    '37643',
    'US',
    '(423) 543-2200',
    'elizabethton@floradistro.com',
    false,
    true,
    false,
    true,
    true,
    true,
    'standard',
    'active',
    '{}'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    updated_at = NOW();

  -- ============================================================================
  -- LOCATION 6: Warehouse (Charlotte)
  -- ============================================================================
  INSERT INTO public.locations (
    name,
    slug,
    type,
    vendor_id,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    country,
    phone,
    email,
    is_default,
    is_active,
    is_primary,
    pos_enabled,
    accepts_online_orders,
    accepts_transfers,
    pricing_tier,
    billing_status,
    monthly_fee,
    settings
  ) VALUES (
    'Warehouse',
    'warehouse-charlotte',
    'warehouse',
    v_flora_vendor_id,
    '446 Crompton St',
    NULL,
    'Charlotte',
    'NC',
    '28273',
    'US',
    '(704) 525-5500',
    'warehouse@floradistro.com',
    true,
    true,
    true,
    false,
    false,
    true,
    'standard',
    'active',
    0.00,
    '{}'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    is_primary = true,
    updated_at = NOW();

  RAISE NOTICE 'Flora Distro locations created/updated successfully';
END $$;

-- ============================================================================
-- UPDATE VENDOR TOTAL LOCATIONS COUNT
-- ============================================================================
DO $$
BEGIN
  -- Update vendors table to reflect total locations
  UPDATE public.vendors v
  SET total_locations = (
    SELECT COUNT(*) FROM public.locations l WHERE l.vendor_id = v.id
  )
  WHERE EXISTS (
    SELECT 1 FROM public.locations WHERE vendor_id = v.id
  );
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify locations were created:
-- SELECT 
--   l.name,
--   l.type,
--   l.address_line1,
--   l.city,
--   l.state,
--   l.zip,
--   l.is_active,
--   l.is_primary,
--   v.store_name as vendor
-- FROM public.locations l
-- LEFT JOIN public.vendors v ON l.vendor_id = v.id
-- ORDER BY l.type, l.name;

