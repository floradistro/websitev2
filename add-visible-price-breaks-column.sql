-- Add visible_price_breaks column to tv_display_groups table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new

ALTER TABLE tv_display_groups
ADD COLUMN IF NOT EXISTS visible_price_breaks TEXT[] DEFAULT '{}';

COMMENT ON COLUMN tv_display_groups.visible_price_breaks IS
'Array of price break IDs to display on TV menus (e.g., {1g,3_5g,28g})';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tv_display_groups'
AND column_name = 'visible_price_breaks';
