-- ============================================================================
-- ADD MISSING COLUMNS TO FIX 500 ERROR
-- Run this RIGHT NOW in Supabase SQL Editor
-- ============================================================================

-- Add the missing columns to vendor_pricing_configs table
ALTER TABLE public.vendor_pricing_configs
  ADD COLUMN IF NOT EXISTS display_unit TEXT DEFAULT 'gram',
  ADD COLUMN IF NOT EXISTS custom_price_breaks JSONB;

-- Verify columns were added
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'vendor_pricing_configs'
  AND column_name IN ('display_unit', 'custom_price_breaks')
ORDER BY column_name;

-- Should return:
-- custom_price_breaks | jsonb | NULL
-- display_unit        | text  | 'gram'::text

-- ✅ Done! Now the save will work!

