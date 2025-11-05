-- ============================================================================
-- ARCHIVE OLD PRICING SYSTEM TABLES
-- Migration Date: 2025-11-05
--
-- This script archives the old pricing system tables after successful
-- migration to the new embedded pricing_data system.
--
-- SAFETY: Tables are renamed (not dropped) so they can be restored if needed.
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify migration was successful
-- ============================================================================

-- Check that all products have pricing_data
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM products
  WHERE pricing_data IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Migration incomplete: % products missing pricing_data', missing_count;
  END IF;

  RAISE NOTICE '✅ All products have pricing_data';
END $$;

-- ============================================================================
-- STEP 2: Create backup/archive schema
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS archived_pricing_system;

COMMENT ON SCHEMA archived_pricing_system IS 'Archive of old pricing system tables from 2025-11-05 migration. Can be dropped after verification period.';

-- ============================================================================
-- STEP 3: Move old tables to archive schema
-- ============================================================================

-- Move product_pricing_assignments
ALTER TABLE IF EXISTS product_pricing_assignments
  SET SCHEMA archived_pricing_system;

-- Move pricing_tier_blueprints
ALTER TABLE IF EXISTS pricing_tier_blueprints
  SET SCHEMA archived_pricing_system;

-- Move vendor_pricing_configs
ALTER TABLE IF EXISTS vendor_pricing_configs
  SET SCHEMA archived_pricing_system;

-- ============================================================================
-- STEP 4: Create documentation view
-- ============================================================================

CREATE OR REPLACE VIEW archived_pricing_system.migration_summary AS
SELECT
  'Old System Tables' as category,
  'product_pricing_assignments' as table_name,
  (SELECT COUNT(*) FROM archived_pricing_system.product_pricing_assignments) as record_count,
  'Product-to-blueprint assignments' as description
UNION ALL
SELECT
  'Old System Tables',
  'pricing_tier_blueprints',
  (SELECT COUNT(*) FROM archived_pricing_system.pricing_tier_blueprints),
  'Blueprint definitions with price breaks'
UNION ALL
SELECT
  'Old System Tables',
  'vendor_pricing_configs',
  (SELECT COUNT(*) FROM archived_pricing_system.vendor_pricing_configs),
  'Vendor-specific pricing values'
UNION ALL
SELECT
  'New System',
  'products.pricing_data',
  (SELECT COUNT(*) FROM products WHERE pricing_data IS NOT NULL),
  'Products with embedded pricing'
UNION ALL
SELECT
  'New System',
  'pricing_tier_templates',
  (SELECT COUNT(*) FROM pricing_tier_templates),
  'UI templates for pricing structures';

COMMENT ON VIEW archived_pricing_system.migration_summary IS 'Summary of pricing system migration showing old vs new record counts';

-- ============================================================================
-- STEP 5: Create rollback script (for emergencies)
-- ============================================================================

COMMENT ON SCHEMA archived_pricing_system IS
'Archive of old pricing system tables from 2025-11-05 migration.

ROLLBACK INSTRUCTIONS (if needed):
1. Move tables back to public schema:
   ALTER TABLE archived_pricing_system.product_pricing_assignments SET SCHEMA public;
   ALTER TABLE archived_pricing_system.pricing_tier_blueprints SET SCHEMA public;
   ALTER TABLE archived_pricing_system.vendor_pricing_configs SET SCHEMA public;

2. Drop new system:
   DROP TABLE pricing_tier_templates CASCADE;
   ALTER TABLE products DROP COLUMN pricing_data;

3. Revert API endpoints to use old system

After 30 days of successful operation, this schema can be permanently dropped:
DROP SCHEMA archived_pricing_system CASCADE;
';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View migration summary
SELECT * FROM archived_pricing_system.migration_summary ORDER BY category, table_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ OLD PRICING SYSTEM ARCHIVED SUCCESSFULLY';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Old tables moved to: archived_pricing_system schema';
  RAISE NOTICE 'New system active: products.pricing_data column';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Monitor all systems (vendor dashboard, POS, TV menus)';
  RAISE NOTICE '2. Verify pricing displays correctly everywhere';
  RAISE NOTICE '3. After 30 days: DROP SCHEMA archived_pricing_system CASCADE;';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
