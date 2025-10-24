-- ============================================================================
-- VENDOR CUSTOM FIELDS - Let Vendors Extend Sections
-- Vendors can add their OWN fields beyond the admin-defined base schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Which section type this applies to (or 'global' for all)
  section_key TEXT NOT NULL, -- 'hero', 'process', or 'global'
  
  -- Field Definition (same structure as section_schemas.fields)
  field_id TEXT NOT NULL, -- Unique ID for this field (e.g., 'promo_badge')
  field_definition JSONB NOT NULL,
  -- Example: {
  --   "type": "text",
  --   "label": "Promotional Badge Text",
  --   "placeholder": "NEW!",
  --   "max_length": 20
  -- }
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- Where to show in editor (after base fields)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each vendor can only have one custom field with same ID per section
  UNIQUE(vendor_id, section_key, field_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS vendor_custom_fields_vendor_idx ON public.vendor_custom_fields(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_custom_fields_section_idx ON public.vendor_custom_fields(section_key);

-- RLS
ALTER TABLE public.vendor_custom_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can manage own custom fields" ON public.vendor_custom_fields;
CREATE POLICY "Vendors can manage own custom fields"
  ON public.vendor_custom_fields FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Trigger
CREATE TRIGGER set_vendor_custom_fields_updated_at
  BEFORE UPDATE ON public.vendor_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.vendor_custom_fields IS 'Vendor-defined custom fields that extend base section schemas';

-- Example: Vendor adds custom field to hero section
-- INSERT INTO vendor_custom_fields (vendor_id, section_key, field_id, field_definition) VALUES (
--   'vendor-uuid',
--   'hero',
--   'promotional_badge',
--   '{
--     "type": "text",
--     "label": "Promotional Badge",
--     "placeholder": "NEW! | SALE | LIMITED",
--     "max_length": 20,
--     "helper_text": "Short text badge shown on hero"
--   }'::jsonb
-- );

