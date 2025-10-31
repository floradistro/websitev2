/**
 * EMERGENCY FIX: Link All Existing Customers to Flora Distro
 *
 * All 10,000+ customers belong to Flora Distro but were never
 * properly linked via the vendor_customers junction table.
 */

-- Flora Distro vendor ID
DO $$
DECLARE
  flora_vendor_id UUID := 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
  linked_count INTEGER := 0;
BEGIN

  -- Link all customers that aren't already linked to Flora Distro
  -- Use simple defaults since customer table doesn't have vendor-specific fields
  INSERT INTO vendor_customers (
    vendor_id,
    customer_id,
    vendor_customer_number,
    loyalty_points,
    loyalty_tier,
    total_orders,
    total_spent
  )
  SELECT
    flora_vendor_id,
    c.id,
    'FLORA-' || LPAD(ROW_NUMBER() OVER (ORDER BY c.created_at)::TEXT, 5, '0'),
    0, -- Default loyalty points
    'bronze', -- Default tier
    0, -- Default orders
    0 -- Default spent
  FROM customers c
  WHERE NOT EXISTS (
    -- Skip customers already linked to Flora Distro
    SELECT 1 FROM vendor_customers vc
    WHERE vc.customer_id = c.id
    AND vc.vendor_id = flora_vendor_id
  );

  -- Get count of newly linked customers
  GET DIAGNOSTICS linked_count = ROW_COUNT;

  RAISE NOTICE 'Successfully linked % customers to Flora Distro', linked_count;

END $$;

-- Verify the linking
SELECT
  'Flora Distro' as vendor,
  COUNT(*) as total_customers
FROM vendor_customers
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
