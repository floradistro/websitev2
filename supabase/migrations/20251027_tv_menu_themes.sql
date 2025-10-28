-- Add theme support to TV menus
-- Default theme is 'midnight-elegance'

ALTER TABLE tv_menus
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'midnight-elegance';

-- Add comment
COMMENT ON COLUMN tv_menus.theme IS 'Theme preset ID for display styling';
