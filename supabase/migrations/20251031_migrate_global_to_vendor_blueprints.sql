-- Migration: Convert global pricing tier blueprints to vendor-specific ones
-- This ensures each vendor owns their own pricing rules

-- Step 1: Create vendor-specific copies of global blueprints currently in use
INSERT INTO pricing_tier_blueprints (
  vendor_id,
  name,
  slug,
  description,
  tier_type,
  quality_tier,
  context,
  price_breaks,
  applicable_to_categories,
  is_active,
  display_order
)
SELECT DISTINCT
  vpc.vendor_id,
  ptb.name || ' (Custom)',
  ptb.slug || '-' || vpc.vendor_id,
  ptb.description,
  ptb.tier_type,
  ptb.quality_tier,
  ptb.context,
  ptb.price_breaks,
  ptb.applicable_to_categories,
  ptb.is_active,
  ptb.display_order
FROM vendor_pricing_configs vpc
JOIN pricing_tier_blueprints ptb ON ptb.id = vpc.blueprint_id
WHERE ptb.vendor_id IS NULL;

-- Step 2: Create a temporary mapping table to track old blueprint ID -> new blueprint ID per vendor
CREATE TEMP TABLE blueprint_migration_map AS
SELECT
  vpc.vendor_id,
  vpc.blueprint_id as old_blueprint_id,
  new_ptb.id as new_blueprint_id
FROM vendor_pricing_configs vpc
JOIN pricing_tier_blueprints old_ptb ON old_ptb.id = vpc.blueprint_id
JOIN pricing_tier_blueprints new_ptb ON
  new_ptb.vendor_id = vpc.vendor_id
  AND new_ptb.slug = old_ptb.slug || '-' || vpc.vendor_id
WHERE old_ptb.vendor_id IS NULL;

-- Step 3: Update vendor_pricing_configs to use new vendor-specific blueprints
UPDATE vendor_pricing_configs vpc
SET blueprint_id = bmm.new_blueprint_id
FROM blueprint_migration_map bmm
WHERE vpc.vendor_id = bmm.vendor_id
  AND vpc.blueprint_id = bmm.old_blueprint_id;

-- Step 4: Update product_pricing_assignments to use new vendor-specific blueprints
-- First, get the vendor_id for each product
UPDATE product_pricing_assignments ppa
SET blueprint_id = bmm.new_blueprint_id
FROM products p, blueprint_migration_map bmm
WHERE ppa.product_id = p.id
  AND p.vendor_id = bmm.vendor_id
  AND ppa.blueprint_id = bmm.old_blueprint_id;

-- Step 5: Delete the global pricing tier blueprints (CASCADE will handle related records)
DELETE FROM pricing_tier_blueprints
WHERE vendor_id IS NULL;

-- Verification queries (run these manually after migration)
-- SELECT COUNT(*) FROM pricing_tier_blueprints WHERE vendor_id IS NULL; -- Should be 0
-- SELECT COUNT(*) FROM vendor_pricing_configs WHERE blueprint_id IN (SELECT id FROM pricing_tier_blueprints WHERE vendor_id IS NULL); -- Should be 0
-- SELECT COUNT(*) FROM product_pricing_assignments WHERE blueprint_id IN (SELECT id FROM pricing_tier_blueprints WHERE vendor_id IS NULL); -- Should be 0
