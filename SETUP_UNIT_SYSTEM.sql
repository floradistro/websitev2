-- ============================================================================
-- UNIT OF MEASURE SYSTEM SETUP
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add unit tracking columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'weight' CHECK (measurement_type IN ('weight', 'volume', 'count')),
  ADD COLUMN IF NOT EXISTS base_unit TEXT DEFAULT 'gram' CHECK (base_unit IN (
    'milligram', 'gram', 'ounce', 'pound', 'kilogram',
    'milliliter', 'liter', 'fluid_ounce', 'gallon',
    'unit', 'piece', 'each'
  )),
  ADD COLUMN IF NOT EXISTS preferred_display_unit TEXT;

-- Step 1b: Add display unit and custom tiers to vendor pricing configs
ALTER TABLE public.vendor_pricing_configs
  ADD COLUMN IF NOT EXISTS display_unit TEXT DEFAULT 'gram',
  ADD COLUMN IF NOT EXISTS custom_price_breaks JSONB;

-- Step 2: Set defaults for existing products based on category
UPDATE public.products
SET 
  measurement_type = 'weight',
  base_unit = 'gram',
  preferred_display_unit = 'gram'
WHERE measurement_type IS NULL;

-- Step 2b: Set default display units for existing vendor pricing configs
UPDATE public.vendor_pricing_configs
SET display_unit = 'gram'
WHERE display_unit IS NULL;

-- Step 3: Verify the setup
SELECT 
  'Products with unit tracking' as status,
  COUNT(*) as count
FROM public.products
WHERE measurement_type IS NOT NULL;

-- ============================================================================
-- HOW IT WORKS
-- ============================================================================

/*
ALL INVENTORY STORED IN BASE UNITS:
  - Weight products → GRAMS
  - Volume products → MILLILITERS
  - Count products → UNITS

AUTOMATIC CONVERSIONS:
  - 453.592 grams = 1 pound (same stock, different view)
  - 1000 milliliters = 1 liter (same stock, different view)
  - Everything synchronized automatically

VENDOR PREFERENCES:
  - Retail vendor: prefers to see grams (1g, 3.5g, 28g)
  - Wholesale vendor: prefers to see pounds (1 lb, 5 lbs, 10 lbs)
  - System converts automatically based on preference

CUSTOMER VIEW:
  - Retail customers see: "28g (1 oz)" 
  - Wholesale customers see: "1 lb (453g)"
  - Same product, different display, same stock level
*/

-- ============================================================================
-- EXAMPLES
-- ============================================================================

-- Example 1: Flower product (weight-based)
-- Vendor adds: 1 pound
-- Database stores: 453.592 grams
-- Retail customer sees: "453g in stock"
-- Wholesale customer sees: "1 lb in stock"

-- Example 2: Tincture (volume-based)
-- Vendor adds: 1 liter
-- Database stores: 1000 milliliters
-- Customer sees: "1L" or "1000ml" (based on preference)

-- Example 3: Edibles (count-based)
-- Vendor adds: 100 pieces
-- Database stores: 100 units
-- Customer sees: "100 available"

-- Done! ✅

