-- ============================================================================
-- PRICING SYSTEM REDESIGN: Simplified Architecture
-- Migration Date: 2025-11-05
--
-- GOALS:
-- 1. Add pricing_data JSONB column to products (embedded pricing)
-- 2. Convert blueprints to templates (UI helpers only)
-- 3. Maintain category assignments
-- 4. Preserve all existing product pricing assignments
-- 5. Enable gradual migration (dual-mode support)
--
-- SAFETY: This is NON-DESTRUCTIVE. Old tables remain until verified.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new pricing_data column to products
-- ============================================================================
ALTER TABLE products
ADD COLUMN IF NOT EXISTS pricing_data JSONB;

CREATE INDEX IF NOT EXISTS idx_products_pricing_data ON products USING gin(pricing_data);

COMMENT ON COLUMN products.pricing_data IS 'Embedded pricing configuration with all tiers and prices. Format: {mode: "single"|"tiered", single_price: number, tiers: [{id, label, quantity, unit, price, enabled}], template_id: uuid}';

-- ============================================================================
-- STEP 2: Create pricing_tier_templates (renamed from blueprints)
-- This table becomes UI-only, not a runtime dependency
-- ============================================================================
CREATE TABLE IF NOT EXISTS pricing_tier_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- Quality tier for categorization
  quality_tier TEXT,

  -- Category assignment - IMPORTANT: keeps your organization
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Template structure (default tiers vendors can copy)
  default_tiers JSONB NOT NULL DEFAULT '[]',
  -- Example:
  -- [
  --   {"id": "1g", "label": "1 gram", "quantity": 1, "unit": "g", "default_price": null},
  --   {"id": "3_5g", "label": "3.5g (Eighth)", "quantity": 3.5, "unit": "g", "default_price": null}
  -- ]

  -- Display & Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Enforce unique slug per vendor
  UNIQUE(vendor_id, slug)
);

CREATE INDEX idx_pricing_templates_vendor ON pricing_tier_templates(vendor_id);
CREATE INDEX idx_pricing_templates_category ON pricing_tier_templates(category_id);
CREATE INDEX idx_pricing_templates_active ON pricing_tier_templates(is_active);

COMMENT ON TABLE pricing_tier_templates IS 'UI templates for pricing structures. Used as starting points when creating products, NOT runtime dependencies.';

-- ============================================================================
-- STEP 3: Migrate existing blueprints to templates
-- Preserve all blueprint data, convert to template format
-- ============================================================================
INSERT INTO pricing_tier_templates (
  id,
  name,
  slug,
  description,
  vendor_id,
  quality_tier,
  category_id,
  default_tiers,
  is_active,
  display_order,
  created_at
)
SELECT
  ptb.id,
  ptb.name,
  ptb.slug,
  ptb.description,
  ptb.vendor_id,
  ptb.quality_tier,
  -- Get first category from applicable_to_categories array
  (CASE
    WHEN ptb.applicable_to_categories IS NOT NULL AND array_length(ptb.applicable_to_categories, 1) > 0
    THEN ptb.applicable_to_categories[1]
    ELSE NULL
  END),
  -- Convert price_breaks to default_tiers format (no prices yet)
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', pb->>'break_id',
        'label', pb->>'label',
        'quantity', (pb->>'qty')::numeric,
        'unit', pb->>'unit',
        'default_price', NULL,
        'sort_order', (pb->>'sort_order')::int
      )
      ORDER BY (pb->>'sort_order')::int
    )
    FROM jsonb_array_elements(ptb.price_breaks) pb
  ),
  ptb.is_active,
  ptb.display_order,
  ptb.created_at
FROM pricing_tier_blueprints ptb
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 4: Migrate product pricing data to embedded format
-- This is the critical migration that consolidates 3 tables into 1 JSONB column
-- ============================================================================
UPDATE products p
SET pricing_data = (
  SELECT jsonb_build_object(
    'mode', CASE
      WHEN ppa.id IS NOT NULL THEN 'tiered'
      ELSE 'single'
    END,
    'single_price', p.regular_price,
    'template_id', ptb.id,
    'template_name', ptb.name,
    'tiers', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pb->>'break_id',
            'label', pb->>'label',
            'quantity', (pb->>'qty')::numeric,
            'unit', pb->>'unit',
            'price', COALESCE(
              -- Priority 1: Product-specific override
              (ppa.price_overrides->(pb->>'break_id')->>'price')::numeric,
              -- Priority 2: Vendor pricing config
              (vpc.pricing_values->(pb->>'break_id')->>'price')::numeric,
              -- Priority 3: null (will need to be set)
              NULL
            ),
            'enabled', COALESCE(
              -- Check product override first
              (ppa.price_overrides->(pb->>'break_id')->>'enabled')::boolean,
              -- Then vendor config
              (vpc.pricing_values->(pb->>'break_id')->>'enabled')::boolean,
              -- Default to true
              true
            ),
            'sort_order', (pb->>'sort_order')::int
          )
          ORDER BY (pb->>'sort_order')::int
        )
        FROM jsonb_array_elements(ptb.price_breaks) pb
      ),
      '[]'::jsonb
    )
  )
  FROM product_pricing_assignments ppa
  LEFT JOIN pricing_tier_blueprints ptb ON ptb.id = ppa.blueprint_id
  LEFT JOIN vendor_pricing_configs vpc ON vpc.blueprint_id = ptb.id AND vpc.vendor_id = p.vendor_id AND vpc.is_active = true
  WHERE ppa.product_id = p.id
    AND ppa.is_active = true
)
WHERE EXISTS (
  SELECT 1 FROM product_pricing_assignments ppa
  WHERE ppa.product_id = p.id AND ppa.is_active = true
);

-- For products without assignments (single pricing only)
UPDATE products
SET pricing_data = jsonb_build_object(
  'mode', 'single',
  'single_price', regular_price,
  'tiers', '[]'::jsonb
)
WHERE pricing_data IS NULL;

-- ============================================================================
-- STEP 5: Create backup views for rollback safety
-- ============================================================================
CREATE OR REPLACE VIEW pricing_migration_backup AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.regular_price as old_single_price,
  p.pricing_data as new_pricing_data,
  ppa.id as assignment_id,
  ppa.blueprint_id,
  ptb.name as blueprint_name,
  vpc.pricing_values as vendor_config_values
FROM products p
LEFT JOIN product_pricing_assignments ppa ON ppa.product_id = p.id AND ppa.is_active = true
LEFT JOIN pricing_tier_blueprints ptb ON ptb.id = ppa.blueprint_id
LEFT JOIN vendor_pricing_configs vpc ON vpc.blueprint_id = ptb.id AND vpc.vendor_id = p.vendor_id;

-- ============================================================================
-- STEP 6: Create validation query to verify migration
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_pricing_migration()
RETURNS TABLE (
  check_name TEXT,
  passed BOOLEAN,
  details TEXT
) AS $$
BEGIN
  -- Check 1: All products have pricing_data
  RETURN QUERY
  SELECT
    'All products have pricing_data'::TEXT,
    COUNT(*) = 0,
    CONCAT(COUNT(*), ' products missing pricing_data')::TEXT
  FROM products
  WHERE pricing_data IS NULL;

  -- Check 2: All assigned products have tiers
  RETURN QUERY
  SELECT
    'Assigned products have tier data'::TEXT,
    COUNT(*) = 0,
    CONCAT(COUNT(*), ' products with assignments but no tiers')::TEXT
  FROM products p
  JOIN product_pricing_assignments ppa ON ppa.product_id = p.id AND ppa.is_active = true
  WHERE jsonb_array_length(p.pricing_data->'tiers') = 0;

  -- Check 3: Pricing values preserved
  RETURN QUERY
  SELECT
    'Tier prices are numeric'::TEXT,
    COUNT(*) = 0,
    CONCAT(COUNT(*), ' tiers with non-numeric prices')::TEXT
  FROM products p,
    jsonb_array_elements(p.pricing_data->'tiers') tier
  WHERE tier->>'price' IS NOT NULL
    AND NOT (tier->>'price' ~ '^[0-9]+\.?[0-9]*$');

  -- Check 4: Template references valid
  RETURN QUERY
  SELECT
    'Template IDs are valid'::TEXT,
    COUNT(*) = 0,
    CONCAT(COUNT(*), ' products with invalid template_id')::TEXT
  FROM products p
  WHERE p.pricing_data->>'template_id' IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pricing_tier_templates t
      WHERE t.id::text = p.pricing_data->>'template_id'
    );

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Run validation
-- ============================================================================
-- SELECT * FROM validate_pricing_migration();

-- ============================================================================
-- NOTES FOR MANUAL VERIFICATION
-- ============================================================================
-- 1. Check sample products:
--    SELECT name, pricing_data FROM products WHERE name IN ('101 Runtz', 'GMO', 'Black Cherry Gelato');
--
-- 2. Compare tier counts:
--    SELECT COUNT(*) FROM product_pricing_assignments WHERE is_active = true;
--    SELECT COUNT(*) FROM products WHERE jsonb_array_length(pricing_data->'tiers') > 0;
--
-- 3. Verify pricing templates created:
--    SELECT name, category_id, jsonb_array_length(default_tiers) as tier_count
--    FROM pricing_tier_templates
--    ORDER BY name;
--
-- 4. Test pricing retrieval:
--    SELECT name,
--           pricing_data->>'mode' as mode,
--           pricing_data->'tiers' as tiers
--    FROM products
--    WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
--    LIMIT 5;

-- ============================================================================
-- ROLLBACK PLAN (if needed)
-- ============================================================================
-- To rollback this migration:
-- 1. ALTER TABLE products DROP COLUMN pricing_data;
-- 2. DROP TABLE pricing_tier_templates CASCADE;
-- 3. DROP VIEW pricing_migration_backup CASCADE;
-- 4. DROP FUNCTION validate_pricing_migration CASCADE;
--
-- The original tables (pricing_tier_blueprints, vendor_pricing_configs,
-- product_pricing_assignments) remain untouched and functional.
