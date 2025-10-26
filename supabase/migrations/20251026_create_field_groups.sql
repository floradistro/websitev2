-- ============================================================================
-- FIELD GROUPS - Admin-defined product field templates
-- ============================================================================
-- This migration recreates the field_groups table that was created manually
-- Now properly tracked in version control

CREATE TABLE IF NOT EXISTS public.field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Field Definitions
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {
  --     "name": "THC Percentage",
  --     "slug": "thc_percentage",
  --     "type": "number",
  --     "required": true,
  --     "suffix": "%",
  --     "min": 0,
  --     "max": 100,
  --     "description": "THC content percentage"
  --   },
  --   {
  --     "name": "Strain Type",
  --     "slug": "strain_type",
  --     "type": "select",
  --     "options": ["Sativa", "Indica", "Hybrid"],
  --     "required": true
  --   }
  -- ]
  
  -- Scope and Requirements
  scope TEXT DEFAULT 'optional' CHECK (scope IN ('required_global', 'required_category', 'optional')),
  -- required_global: All vendors must use these fields
  -- required_category: Required when assigned to a category
  -- optional: Vendors can choose to use
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS field_groups_slug_idx ON public.field_groups(slug);
CREATE INDEX IF NOT EXISTS field_groups_active_idx ON public.field_groups(is_active);

-- RLS Policies
ALTER TABLE public.field_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active field groups" ON public.field_groups;
CREATE POLICY "Anyone can view active field groups"
  ON public.field_groups FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access to field groups" ON public.field_groups;
CREATE POLICY "Service role full access to field groups"
  ON public.field_groups FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER set_field_groups_updated_at
  BEFORE UPDATE ON public.field_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.field_groups IS 'Admin-defined product field templates that can be assigned to categories';
COMMENT ON COLUMN public.field_groups.fields IS 'Array of field definitions with type, validation, options';
COMMENT ON COLUMN public.field_groups.scope IS 'Defines if fields are globally required, category required, or optional';

