-- Add visible_price_breaks column to tv_display_groups table
-- This stores which price tiers to show on TV displays (e.g., ['1g', '3_5g', '28g'])

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tv_display_groups'
    AND column_name = 'visible_price_breaks'
  ) THEN
    ALTER TABLE tv_display_groups
    ADD COLUMN visible_price_breaks TEXT[] DEFAULT '{}';

    COMMENT ON COLUMN tv_display_groups.visible_price_breaks IS
    'Array of price break IDs to display on TV menus (e.g., {1g,3_5g,28g}). Empty array means show no pricing by default.';

    RAISE NOTICE 'Column visible_price_breaks added to tv_display_groups';
  ELSE
    RAISE NOTICE 'Column visible_price_breaks already exists';
  END IF;
END $$;

-- Remove old pricing fields that are no longer used (optional cleanup)
-- These are replaced by the simpler visible_price_breaks approach
DO $$
BEGIN
  -- Keep pricing_tier_id for now (may be useful for filtering products by tier)
  -- Remove the confusing hero/display mode fields

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tv_display_groups'
    AND column_name = 'shared_hero_price_tier'
  ) THEN
    ALTER TABLE tv_display_groups
    DROP COLUMN IF EXISTS shared_hero_price_tier,
    DROP COLUMN IF EXISTS shared_price_display_mode;

    RAISE NOTICE 'Removed deprecated pricing columns';
  END IF;
END $$;
