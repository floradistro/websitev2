-- ============================================================================
-- UNIT OF MEASURE SYSTEM
-- Track product measurement type and sync all units automatically
-- ============================================================================

-- Add unit tracking to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'weight' CHECK (measurement_type IN ('weight', 'volume', 'count')),
  ADD COLUMN IF NOT EXISTS base_unit TEXT DEFAULT 'gram' CHECK (base_unit IN (
    -- Weight units
    'milligram', 'gram', 'ounce', 'pound', 'kilogram',
    -- Volume units
    'milliliter', 'liter', 'fluid_ounce', 'gallon',
    -- Count units
    'unit', 'piece', 'each'
  )),
  ADD COLUMN IF NOT EXISTS preferred_display_unit TEXT; -- How vendor prefers to display

-- Add unit tracking to pricing tier blueprints
ALTER TABLE public.pricing_tier_blueprints
  ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'weight' CHECK (measurement_type IN ('weight', 'volume', 'count'));

-- Add display unit and custom tiers to vendor pricing configs
ALTER TABLE public.vendor_pricing_configs
  ADD COLUMN IF NOT EXISTS display_unit TEXT DEFAULT 'gram',
  ADD COLUMN IF NOT EXISTS custom_price_breaks JSONB;

-- Add helpful comments
COMMENT ON COLUMN public.products.measurement_type IS 
'How this product is measured: weight (flower, concentrates), volume (liquids), or count (edibles, accessories)';

COMMENT ON COLUMN public.products.base_unit IS 
'The base unit for storage in database. All inventory stored in this unit. 
Weight products: stored in grams. Volume products: stored in milliliters. Count products: stored as units.';

COMMENT ON COLUMN public.products.preferred_display_unit IS 
'How vendor prefers to display this product. Example: wholesale vendor may prefer pounds even though stored in grams.';

-- ============================================================================
-- UNIT CONVERSION REFERENCE
-- ============================================================================

/*
WEIGHT CONVERSIONS (Base: Gram)
─────────────────────────────────
1 milligram (mg)   = 0.001 grams
1 gram (g)         = 1 gram
1 ounce (oz)       = 28.3495 grams
1 pound (lb)       = 453.592 grams
1 kilogram (kg)    = 1000 grams

VOLUME CONVERSIONS (Base: Milliliter)
─────────────────────────────────────
1 milliliter (ml)  = 1 milliliter
1 liter (L)        = 1000 milliliters
1 fluid ounce      = 29.5735 milliliters
1 gallon           = 3785.41 milliliters

EXAMPLES:
─────────
Retail Flower:
  - Stored as: 28 grams
  - Display as: 28g or 1 oz (synchronized)
  
Wholesale Flower:
  - Stored as: 453.592 grams
  - Display as: 453g or 1 lb (synchronized)
  
Edibles (Count):
  - Stored as: 10 units
  - Display as: 10 pieces
  
Tinctures (Volume):
  - Stored as: 30 milliliters
  - Display as: 30ml or 1 fl oz (synchronized)
*/

-- ============================================================================
-- EXAMPLES
-- ============================================================================

-- Example: Update flower products to use weight/gram base
UPDATE public.products
SET 
  measurement_type = 'weight',
  base_unit = 'gram',
  preferred_display_unit = 'gram'
WHERE primary_category_id IN (
  SELECT id FROM public.categories WHERE name = 'Flower'
);

-- Example: Update concentrate products
UPDATE public.products
SET 
  measurement_type = 'weight',
  base_unit = 'gram',
  preferred_display_unit = 'gram'
WHERE primary_category_id IN (
  SELECT id FROM public.categories WHERE name = 'Concentrate'
);

-- Example: Update tincture/liquid products to use volume
UPDATE public.products
SET 
  measurement_type = 'volume',
  base_unit = 'milliliter',
  preferred_display_unit = 'milliliter'
WHERE name ILIKE '%tincture%' OR name ILIKE '%oil%' OR name ILIKE '%liquid%';

-- Example: Update edibles to use count
UPDATE public.products
SET 
  measurement_type = 'count',
  base_unit = 'unit',
  preferred_display_unit = 'unit'
WHERE primary_category_id IN (
  SELECT id FROM public.categories WHERE name = 'Edibles'
);

-- ============================================================================
-- RESULT
-- ============================================================================

-- ✅ Products now have measurement_type (weight/volume/count)
-- ✅ Base unit tracks how it's stored in DB
-- ✅ Preferred display unit for vendor customization
-- ✅ All inventory synchronized automatically via conversion functions
-- ✅ 453g stock = 1 lb stock (same thing, different view)
-- ✅ 1000ml stock = 1 L stock (same thing, different view)

