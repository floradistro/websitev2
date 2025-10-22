-- ============================================================================
-- VERIFY VENDOR PRICING TIER SYSTEM
-- Run these queries to confirm everything is working
-- ============================================================================

-- 1. Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pricing_tier_blueprints', 'vendor_pricing_configs', 'product_pricing_assignments')
ORDER BY table_name;

-- Expected: 3 rows


-- 2. Check 5 blueprints were seeded
SELECT 
  name,
  slug,
  tier_type,
  is_default,
  jsonb_array_length(price_breaks) as num_breaks,
  is_active
FROM pricing_tier_blueprints 
ORDER BY display_order;

-- Expected: 5 rows
-- Retail Cannabis Flower (default, 5 breaks)
-- Wholesale Tiers (4 breaks)
-- Medical Patient Discount (1 break)
-- Staff Discount (1 break)
-- Retail Concentrates (4 breaks)


-- 3. View "Retail Cannabis Flower" price breaks
SELECT 
  name,
  price_breaks
FROM pricing_tier_blueprints 
WHERE slug = 'retail-flower';

-- Expected: 1 row with 1g, 3.5g, 7g, 14g, 28g breaks


-- 4. Check views were created
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('vendor_pricing_comparison', 'product_pricing_overview')
ORDER BY viewname;

-- Expected: 2 rows


-- 5. Check helper functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_vendor_pricing', 'get_product_pricing', 'get_product_all_pricing')
ORDER BY routine_name;

-- Expected: 3 rows


-- 6. Test vendor_pricing_comparison view (will be empty until vendors configure)
SELECT COUNT(*) as total_configs 
FROM vendor_pricing_comparison;

-- Expected: 0 (no configs yet)


-- ============================================================================
-- READY TO USE ✅
-- ============================================================================

-- Next steps:
-- 1. Go to http://localhost:3000/vendor/pricing (as a vendor)
-- 2. Configure pricing for "Retail Cannabis Flower"
-- 3. Query: SELECT * FROM vendor_pricing_comparison;

