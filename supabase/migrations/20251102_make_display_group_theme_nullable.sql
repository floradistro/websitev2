-- ============================================================================
-- Make display group shared_theme nullable
-- This allows menus to use their own themes when display group theme is not set
-- ============================================================================

-- Remove NOT NULL constraint from shared_theme
ALTER TABLE public.tv_display_groups
  ALTER COLUMN shared_theme DROP NOT NULL;

-- Update comment to reflect new behavior
COMMENT ON COLUMN public.tv_display_groups.shared_theme IS 'Optional shared theme for all displays in group. If null, each menu uses its own theme. If set, this theme overrides individual menu themes for visual unity.';

-- Set existing display groups to null so menus can use their own themes
-- (You can comment this out if you want to keep existing group themes)
UPDATE public.tv_display_groups
  SET shared_theme = NULL
  WHERE shared_theme = 'midnight-elegance';
