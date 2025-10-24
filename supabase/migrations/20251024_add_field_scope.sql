-- Add scope system for custom fields
-- Allows: section type, page-wide, or global

ALTER TABLE public.vendor_custom_fields
  ADD COLUMN IF NOT EXISTS scope_type TEXT DEFAULT 'section_type'
    CHECK (scope_type IN ('section_type', 'page', 'global')),
  ADD COLUMN IF NOT EXISTS scope_value TEXT;

-- Update existing fields to have proper scope
UPDATE public.vendor_custom_fields
SET scope_type = 'section_type',
    scope_value = section_key
WHERE scope_type IS NULL;

COMMENT ON COLUMN public.vendor_custom_fields.scope_type IS 'section_type, page, or global';
COMMENT ON COLUMN public.vendor_custom_fields.scope_value IS 'hero/process (section), home/about (page), or null (global)';
