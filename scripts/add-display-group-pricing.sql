-- Add pricing display configuration to display groups
-- Run this in Supabase SQL Editor

ALTER TABLE tv_display_groups
ADD COLUMN IF NOT EXISTS shared_hero_price_tier TEXT DEFAULT '3_5g',
ADD COLUMN IF NOT EXISTS shared_price_display_mode TEXT DEFAULT 'hero_with_supporting';

-- Add comments
COMMENT ON COLUMN tv_display_groups.shared_hero_price_tier IS 'Which price tier to highlight for all displays in group (e.g., 1g, 3_5g, 7g, 14g, 28g)';
COMMENT ON COLUMN tv_display_groups.shared_price_display_mode IS 'How to display prices: hero_only, hero_with_supporting, all_tiers, minimal';
