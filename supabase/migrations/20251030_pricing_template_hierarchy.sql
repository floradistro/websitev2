/**
 * Pricing Template Hierarchy
 *
 * Adds parent-child relationship to pricing blueprints:
 * - System templates (parent_template_id = NULL) are base skeletons
 * - Vendor variations reference parent template
 *
 * Example:
 *   Retail Flower (system, no parent) ← Base template
 *   ├─ Deals (system, parent = Retail Flower)
 *   ├─ Exotics (system, parent = Retail Flower)
 *   └─ Top Shelf (system, parent = Retail Flower)
 *
 *   Vendor creates their own from these:
 *   My Deals (vendor-owned, parent = Deals template)
 */

-- Add parent template reference
ALTER TABLE pricing_tier_blueprints
ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES pricing_tier_blueprints(id) ON DELETE SET NULL;

-- Add variation name/identifier
ALTER TABLE pricing_tier_blueprints
ADD COLUMN IF NOT EXISTS variation_name TEXT;

-- Add display metadata
ALTER TABLE pricing_tier_blueprints
ADD COLUMN IF NOT EXISTS is_template_root BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_description TEXT;

-- Create index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_pricing_blueprints_parent
ON pricing_tier_blueprints(parent_template_id);

CREATE INDEX IF NOT EXISTS idx_pricing_blueprints_vendor_parent
ON pricing_tier_blueprints(vendor_id, parent_template_id);

-- Mark "Retail Flower" as the root template
UPDATE pricing_tier_blueprints
SET
  is_template_root = true,
  template_description = 'Standard retail flower pricing structure with common weight breaks'
WHERE name = 'Retail Flower'
  AND vendor_id IS NULL;

-- Link variations to parent
UPDATE pricing_tier_blueprints
SET
  parent_template_id = (SELECT id FROM pricing_tier_blueprints WHERE name = 'Retail Flower' AND vendor_id IS NULL),
  variation_name = 'Deals',
  template_description = 'Value-priced flower tier for budget-conscious customers'
WHERE name = 'Retail Flower - Deals'
  AND vendor_id IS NULL;

UPDATE pricing_tier_blueprints
SET
  parent_template_id = (SELECT id FROM pricing_tier_blueprints WHERE name = 'Retail Flower' AND vendor_id IS NULL),
  variation_name = 'Exotic',
  template_description = 'Premium exotic strains with unique genetics and high potency'
WHERE name = 'Retail Flower - Exotic'
  AND vendor_id IS NULL;

UPDATE pricing_tier_blueprints
SET
  parent_template_id = (SELECT id FROM pricing_tier_blueprints WHERE name = 'Retail Flower' AND vendor_id IS NULL),
  variation_name = 'Top Shelf',
  template_description = 'Premium quality flower at mid-range pricing'
WHERE name = 'Retail Flower - Top Shelf'
  AND vendor_id IS NULL;

-- Mark other root templates
UPDATE pricing_tier_blueprints
SET is_template_root = true
WHERE vendor_id IS NULL
  AND parent_template_id IS NULL
  AND name IN ('Retail Concentrate', 'Retail Edibles', 'Retail Vape', 'Wholesale Cost Plus', 'Wholesale Tiered');

-- Add helpful comments
COMMENT ON COLUMN pricing_tier_blueprints.parent_template_id IS
'Links variations to their parent template. NULL for root templates.';

COMMENT ON COLUMN pricing_tier_blueprints.variation_name IS
'Short name for variation (e.g., "Deals", "Exotic"). Used with parent name.';

COMMENT ON COLUMN pricing_tier_blueprints.is_template_root IS
'TRUE if this is a root template that can have variations';

COMMENT ON COLUMN pricing_tier_blueprints.template_description IS
'User-friendly description of what this template/variation is for';

-- Create view for easy template browsing
CREATE OR REPLACE VIEW pricing_template_hierarchy AS
WITH RECURSIVE template_tree AS (
  -- Root templates
  SELECT
    id,
    vendor_id,
    name,
    variation_name,
    tier_type,
    context,
    parent_template_id,
    is_template_root,
    template_description,
    price_breaks,
    0 as depth,
    name as full_path,
    ARRAY[id] as path_ids
  FROM pricing_tier_blueprints
  WHERE parent_template_id IS NULL

  UNION ALL

  -- Child variations
  SELECT
    ptb.id,
    ptb.vendor_id,
    ptb.name,
    ptb.variation_name,
    ptb.tier_type,
    ptb.context,
    ptb.parent_template_id,
    ptb.is_template_root,
    ptb.template_description,
    ptb.price_breaks,
    tt.depth + 1,
    tt.full_path || ' > ' || COALESCE(ptb.variation_name, ptb.name) as full_path,
    tt.path_ids || ptb.id
  FROM pricing_tier_blueprints ptb
  INNER JOIN template_tree tt ON ptb.parent_template_id = tt.id
)
SELECT * FROM template_tree
ORDER BY depth, full_path;

COMMENT ON VIEW pricing_template_hierarchy IS
'Hierarchical view of pricing templates showing parent-child relationships';
