-- ============================================================================
-- FIELD GROUPS SYSTEM
-- Allows defining custom field sets and assigning them to categories
-- ============================================================================

-- ============================================================================
-- FIELD TYPES ENUM
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE field_type AS ENUM (
    'text',           -- Single line text
    'textarea',       -- Multi-line text
    'number',         -- Numeric input
    'select',         -- Dropdown
    'multiselect',    -- Multiple selection
    'checkbox',       -- True/False
    'date',           -- Date picker
    'url',            -- URL input
    'color',          -- Color picker
    'image',          -- Image upload
    'file'            -- File upload
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- FIELD GROUPS TABLE
-- Define sets of fields that can be assigned to categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Fields configuration
  fields JSONB NOT NULL DEFAULT '[]',
  -- Example:
  -- [
  --   {
  --     "name": "THC Percentage",
  --     "slug": "thc_percentage",
  --     "type": "number",
  --     "required": true,
  --     "placeholder": "Enter THC %",
  --     "min": 0,
  --     "max": 100,
  --     "suffix": "%"
  --   },
  --   {
  --     "name": "Strain Type",
  --     "slug": "strain_type",
  --     "type": "select",
  --     "required": true,
  --     "options": ["Sativa", "Indica", "Hybrid"]
  --   }
  -- ]
  
  -- Display
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS field_groups_slug_idx ON public.field_groups(slug);
CREATE INDEX IF NOT EXISTS field_groups_active_idx ON public.field_groups(is_active);

COMMENT ON TABLE public.field_groups IS 'Define custom field sets for products';
COMMENT ON COLUMN public.field_groups.fields IS 'Array of field definitions with type, validation, options';

-- ============================================================================
-- CATEGORY FIELD GROUPS RELATIONSHIP
-- Assign field groups to specific categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.category_field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  field_group_id UUID NOT NULL REFERENCES public.field_groups(id) ON DELETE CASCADE,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false, -- Must fill out these fields
  
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  
  UNIQUE(category_id, field_group_id)
);

CREATE INDEX IF NOT EXISTS category_field_groups_category_idx ON public.category_field_groups(category_id);
CREATE INDEX IF NOT EXISTS category_field_groups_field_group_idx ON public.category_field_groups(field_group_id);

COMMENT ON TABLE public.category_field_groups IS 'Links field groups to categories';

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT ALL ON public.field_groups TO authenticated, service_role;
GRANT ALL ON public.category_field_groups TO authenticated, service_role;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.field_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_field_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can view active field groups
CREATE POLICY "Anyone can view active field groups"
  ON public.field_groups FOR SELECT
  USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access to field groups"
  ON public.field_groups FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Anyone can view category field group assignments
CREATE POLICY "Anyone can view category field groups"
  ON public.category_field_groups FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access to category field groups"
  ON public.category_field_groups FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get field groups for a category
CREATE OR REPLACE FUNCTION public.get_category_field_groups(p_category_id UUID)
RETURNS TABLE (
  field_group_id UUID,
  name TEXT,
  slug TEXT,
  fields JSONB,
  is_required BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fg.id,
    fg.name,
    fg.slug,
    fg.fields,
    cfg.is_required
  FROM public.field_groups fg
  JOIN public.category_field_groups cfg ON cfg.field_group_id = fg.id
  WHERE cfg.category_id = p_category_id
  AND fg.is_active = true
  ORDER BY cfg.display_order, fg.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE FIELD GROUPS (For Cannabis Products)
-- ============================================================================

-- Flower/Bud Field Group
INSERT INTO public.field_groups (name, slug, description, fields) VALUES
('Cannabis Flower', 'cannabis-flower', 'Fields specific to flower products', '[
  {
    "name": "Strain Type",
    "slug": "strain_type",
    "type": "select",
    "required": true,
    "options": ["Sativa", "Indica", "Hybrid", "CBD"],
    "description": "Primary strain classification"
  },
  {
    "name": "THC Percentage",
    "slug": "thc_percentage",
    "type": "number",
    "required": true,
    "min": 0,
    "max": 100,
    "suffix": "%",
    "description": "Total THC content"
  },
  {
    "name": "CBD Percentage",
    "slug": "cbd_percentage",
    "type": "number",
    "required": false,
    "min": 0,
    "max": 100,
    "suffix": "%",
    "description": "Total CBD content"
  },
  {
    "name": "Terpene Profile",
    "slug": "terpene_profile",
    "type": "multiselect",
    "required": false,
    "options": ["Myrcene", "Limonene", "Caryophyllene", "Pinene", "Linalool", "Humulene", "Terpinolene"],
    "description": "Dominant terpenes"
  },
  {
    "name": "Effects",
    "slug": "effects",
    "type": "multiselect",
    "required": false,
    "options": ["Relaxing", "Energizing", "Uplifting", "Focused", "Creative", "Sleepy", "Happy", "Euphoric"],
    "description": "Primary effects"
  },
  {
    "name": "Lineage",
    "slug": "lineage",
    "type": "text",
    "required": false,
    "placeholder": "e.g., OG Kush x Durban Poison",
    "description": "Strain lineage/genetics"
  },
  {
    "name": "Grow Method",
    "slug": "grow_method",
    "type": "select",
    "required": false,
    "options": ["Indoor", "Outdoor", "Greenhouse", "Hydroponic"],
    "description": "Cultivation method"
  }
]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Edibles Field Group
INSERT INTO public.field_groups (name, slug, description, fields) VALUES
('Edibles', 'edibles', 'Fields for edible products', '[
  {
    "name": "Dosage per Serving",
    "slug": "dosage_per_serving",
    "type": "number",
    "required": true,
    "suffix": "mg",
    "description": "THC/CBD per serving"
  },
  {
    "name": "Servings per Package",
    "slug": "servings_per_package",
    "type": "number",
    "required": true,
    "min": 1,
    "description": "Number of servings"
  },
  {
    "name": "Total Dosage",
    "slug": "total_dosage",
    "type": "number",
    "required": true,
    "suffix": "mg",
    "description": "Total THC/CBD in package"
  },
  {
    "name": "Ingredients",
    "slug": "ingredients",
    "type": "textarea",
    "required": true,
    "placeholder": "List all ingredients",
    "description": "Full ingredient list"
  },
  {
    "name": "Allergens",
    "slug": "allergens",
    "type": "multiselect",
    "required": false,
    "options": ["Nuts", "Dairy", "Gluten", "Soy", "Eggs"],
    "description": "Contains allergens"
  },
  {
    "name": "Dietary",
    "slug": "dietary",
    "type": "multiselect",
    "required": false,
    "options": ["Vegan", "Gluten-Free", "Sugar-Free", "Organic"],
    "description": "Dietary information"
  }
]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Concentrates Field Group  
INSERT INTO public.field_groups (name, slug, description, fields) VALUES
('Concentrates', 'concentrates', 'Fields for concentrate products', '[
  {
    "name": "Extract Type",
    "slug": "extract_type",
    "type": "select",
    "required": true,
    "options": ["Shatter", "Wax", "Live Resin", "Distillate", "Rosin", "Crumble", "Budder", "Sauce"],
    "description": "Type of concentrate"
  },
  {
    "name": "THC Percentage",
    "slug": "thc_percentage",
    "type": "number",
    "required": true,
    "min": 0,
    "max": 100,
    "suffix": "%",
    "description": "THC content"
  },
  {
    "name": "Extraction Method",
    "slug": "extraction_method",
    "type": "select",
    "required": false,
    "options": ["BHO", "CO2", "Ethanol", "Rosin Press", "Ice Water"],
    "description": "Extraction process"
  },
  {
    "name": "Terpene %",
    "slug": "terpene_percentage",
    "type": "number",
    "required": false,
    "min": 0,
    "max": 50,
    "suffix": "%",
    "description": "Total terpene content"
  }
]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Vapes/Cartridges Field Group
INSERT INTO public.field_groups (name, slug, description, fields) VALUES
('Vape Products', 'vape-products', 'Fields for vape pens and cartridges', '[
  {
    "name": "Hardware Type",
    "slug": "hardware_type",
    "type": "select",
    "required": true,
    "options": ["510 Cartridge", "Disposable", "Pod System", "Battery"],
    "description": "Type of vape product"
  },
  {
    "name": "Oil Type",
    "slug": "oil_type",
    "type": "select",
    "required": false,
    "options": ["Distillate", "Live Resin", "Full Spectrum", "CBD", "Delta-8"],
    "description": "Type of oil/extract"
  },
  {
    "name": "Capacity",
    "slug": "capacity",
    "type": "select",
    "required": false,
    "options": ["0.5g", "1g", "2g"],
    "description": "Cartridge/tank capacity"
  },
  {
    "name": "THC per Puff",
    "slug": "thc_per_puff",
    "type": "number",
    "required": false,
    "suffix": "mg",
    "description": "Estimated THC per puff"
  }
]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Lab Results Field Group (applies to all categories)
INSERT INTO public.field_groups (name, slug, description, fields) VALUES
('Lab Results & Compliance', 'lab-results', 'Lab testing and compliance information', '[
  {
    "name": "COA (Certificate of Analysis)",
    "slug": "coa_url",
    "type": "url",
    "required": false,
    "placeholder": "https://...",
    "description": "Link to lab test results"
  },
  {
    "name": "Lab Name",
    "slug": "lab_name",
    "type": "text",
    "required": false,
    "description": "Testing laboratory name"
  },
  {
    "name": "Batch Number",
    "slug": "batch_number",
    "type": "text",
    "required": false,
    "description": "Product batch/lot number"
  },
  {
    "name": "Test Date",
    "slug": "test_date",
    "type": "date",
    "required": false,
    "description": "Date of lab testing"
  },
  {
    "name": "Harvest Date",
    "slug": "harvest_date",
    "type": "date",
    "required": false,
    "description": "Date of harvest"
  }
]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER set_field_groups_updated_at BEFORE UPDATE ON public.field_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- HELPER VIEW
-- ============================================================================

-- View all categories with their assigned field groups
CREATE OR REPLACE VIEW public.category_fields_view AS
SELECT 
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  json_agg(
    json_build_object(
      'field_group_id', fg.id,
      'field_group_name', fg.name,
      'field_group_slug', fg.slug,
      'fields', fg.fields,
      'is_required', cfg.is_required,
      'display_order', cfg.display_order
    ) ORDER BY cfg.display_order, fg.name
  ) FILTER (WHERE fg.id IS NOT NULL) as field_groups
FROM public.categories c
LEFT JOIN public.category_field_groups cfg ON cfg.category_id = c.id
LEFT JOIN public.field_groups fg ON fg.id = cfg.field_group_id AND fg.is_active = true
GROUP BY c.id, c.name, c.slug;

COMMENT ON VIEW public.category_fields_view IS 'Categories with their assigned field groups';

-- Grant access
GRANT SELECT ON public.category_fields_view TO authenticated, service_role;

-- ============================================================================
-- SAMPLE CATEGORY ASSIGNMENTS
-- ============================================================================

-- Assign "Cannabis Flower" field group to Flower category
-- Note: Run this after categories are created
-- INSERT INTO public.category_field_groups (category_id, field_group_id, is_required)
-- SELECT c.id, fg.id, true
-- FROM public.categories c, public.field_groups fg
-- WHERE c.slug = 'flower' AND fg.slug = 'cannabis-flower';

-- ============================================================================

