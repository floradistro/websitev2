-- ============================================================================
-- SECTION SCHEMAS - Dynamic, Flexible Section Definitions
-- Makes sections infinitely customizable without code changes
-- ============================================================================

-- Section Schemas: Define what fields a section type can have
CREATE TABLE IF NOT EXISTS public.section_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE, -- 'hero', 'process', 'testimonials', etc.
  version TEXT NOT NULL DEFAULT '1.0',
  
  -- Schema Definition
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'hero', 'content', 'media', 'conversion', 'social-proof'
  
  -- Field Definitions (Dynamic!)
  fields JSONB NOT NULL DEFAULT '[]', -- Array of field definitions
  -- Example: [
  --   { "id": "headline", "type": "rich_text", "label": "Headline", "default": "", "required": true },
  --   { "id": "layout", "type": "select", "options": ["centered", "split", "full"], "default": "centered" },
  --   { "id": "cta_buttons", "type": "array", "max_items": 5, "item_schema": {...} }
  -- ]
  
  -- Layout Variants
  variants JSONB DEFAULT '[]', -- Different visual styles for same section
  -- Example: [
  --   { "id": "minimal", "name": "Minimal", "preview_image": "/previews/hero-minimal.jpg" },
  --   { "id": "bold", "name": "Bold & Dramatic", "preview_image": "/previews/hero-bold.jpg" }
  -- ]
  
  -- Constraints & Validation
  constraints JSONB DEFAULT '{}', -- Min/max values, dependencies, conditional fields
  
  -- Metadata
  preview_image TEXT, -- Screenshot of section
  icon TEXT, -- Icon identifier
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Style Presets: Pre-made design combinations
CREATE TABLE IF NOT EXISTS public.style_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'luxury', 'minimal', 'bold', 'organic', 'tech'
  
  -- Visual Identity
  preview_image TEXT,
  color_palette JSONB, -- { primary, secondary, accent, background, text }
  typography JSONB, -- { font_family, sizes, weights, line_heights }
  spacing_scale JSONB, -- [4, 8, 16, 32, 64, 128]
  border_radius JSONB, -- { sm, md, lg, xl }
  effects JSONB, -- { shadows, glows, gradients, animations }
  
  -- Can be global or section-specific
  applies_to TEXT[], -- ['all'] or ['hero', 'testimonials']
  
  -- Metadata
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Applied Styles: Track what presets vendors use
CREATE TABLE IF NOT EXISTS public.vendor_applied_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Can apply preset globally or to specific section
  preset_id UUID REFERENCES public.style_presets(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.vendor_storefront_sections(id) ON DELETE CASCADE,
  
  -- Custom overrides on top of preset
  style_overrides JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Either apply to whole storefront OR to one section, not both
  CHECK (
    (preset_id IS NOT NULL AND section_id IS NULL) OR 
    (preset_id IS NULL AND section_id IS NOT NULL)
  )
);

-- Update vendor_storefront_sections to reference schemas
ALTER TABLE public.vendor_storefront_sections 
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS variant_id TEXT, -- Which variant of the section
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}', -- Extra fields beyond schema
  ADD COLUMN IF NOT EXISTS style_preset_id UUID REFERENCES public.style_presets(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS section_schemas_key_idx ON public.section_schemas(section_key);
CREATE INDEX IF NOT EXISTS section_schemas_category_idx ON public.section_schemas(category);
CREATE INDEX IF NOT EXISTS style_presets_category_idx ON public.style_presets(category);
CREATE INDEX IF NOT EXISTS vendor_applied_styles_vendor_idx ON public.vendor_applied_styles(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_applied_styles_preset_idx ON public.vendor_applied_styles(preset_id);
CREATE INDEX IF NOT EXISTS vendor_storefront_sections_preset_idx ON public.vendor_storefront_sections(style_preset_id);

-- RLS Policies
ALTER TABLE public.section_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applied_styles ENABLE ROW LEVEL SECURITY;

-- Everyone can read section schemas (they're templates)
DROP POLICY IF EXISTS "Anyone can view section schemas" ON public.section_schemas;
CREATE POLICY "Anyone can view section schemas"
  ON public.section_schemas FOR SELECT
  USING (is_active = true);

-- Everyone can view public style presets
DROP POLICY IF EXISTS "Anyone can view style presets" ON public.style_presets;
CREATE POLICY "Anyone can view style presets"
  ON public.style_presets FOR SELECT
  USING (is_active = true);

-- Vendors can manage their own applied styles
DROP POLICY IF EXISTS "Vendors can manage own styles" ON public.vendor_applied_styles;
CREATE POLICY "Vendors can manage own styles"
  ON public.vendor_applied_styles FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Updated at triggers
CREATE TRIGGER set_section_schemas_updated_at
  BEFORE UPDATE ON public.section_schemas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_style_presets_updated_at
  BEFORE UPDATE ON public.style_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_vendor_applied_styles_updated_at
  BEFORE UPDATE ON public.vendor_applied_styles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.section_schemas IS 'Dynamic schema definitions for section types - enables infinite customization';
COMMENT ON TABLE public.style_presets IS 'Pre-made design combinations that can be applied to sections';
COMMENT ON TABLE public.vendor_applied_styles IS 'Tracks which style presets vendors have applied';

