-- ============================================================================
-- FIX PRICING SYSTEM - RUN THIS NOW
-- This fixes tier disabling and adds unit of measure support
-- ============================================================================

-- Step 1: Add display_unit and custom_price_breaks to vendor_pricing_configs
ALTER TABLE public.vendor_pricing_configs
  ADD COLUMN IF NOT EXISTS display_unit TEXT DEFAULT 'gram',
  ADD COLUMN IF NOT EXISTS custom_price_breaks JSONB;

-- Step 2: Set default display units based on blueprint type
UPDATE public.vendor_pricing_configs vpc
SET display_unit = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.pricing_tier_blueprints ptb
    WHERE ptb.id = vpc.blueprint_id
    AND ptb.slug LIKE '%wholesale%'
  ) THEN 'pound'
  ELSE 'gram'
END
WHERE display_unit IS NULL OR display_unit = 'gram';

-- Step 3: Ensure all pricing_values have enabled field
UPDATE public.vendor_pricing_configs
SET pricing_values = (
  SELECT jsonb_object_agg(
    key,
    CASE 
      WHEN value ? 'enabled' THEN value
      ELSE jsonb_set(value, '{enabled}', 'true'::jsonb)
    END
  )
  FROM jsonb_each(pricing_values)
)
WHERE pricing_values IS NOT NULL
AND jsonb_typeof(pricing_values) = 'object';

-- Step 4: Add unit tracking to products (if not exists)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'weight' CHECK (measurement_type IN ('weight', 'volume', 'count')),
  ADD COLUMN IF NOT EXISTS base_unit TEXT DEFAULT 'gram',
  ADD COLUMN IF NOT EXISTS preferred_display_unit TEXT;

-- Step 5: Set defaults for existing products
UPDATE public.products
SET 
  measurement_type = 'weight',
  base_unit = 'gram',
  preferred_display_unit = 'gram'
WHERE measurement_type IS NULL;

-- Step 6: Verify everything is set up correctly
SELECT 
  'Pricing configs with display_unit' as check_name,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE display_unit IS NOT NULL) as configured
FROM public.vendor_pricing_configs;

SELECT 
  'Products with measurement tracking' as check_name,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE measurement_type IS NOT NULL) as configured
FROM public.products;

-- Done! ✅
-- Now refresh localhost:3000/vendor/pricing
-- You should see:
--   ✅ Unit of Measure dropdown at top of each pricing structure
--   ✅ Tier enable/disable checkboxes working
--   ✅ All units synchronized (453g = 1 lb)

