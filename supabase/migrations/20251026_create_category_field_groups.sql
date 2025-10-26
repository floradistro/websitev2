-- ============================================================================
-- CATEGORY FIELD GROUPS - Assigns field groups to categories
-- ============================================================================
-- This migration recreates the category_field_groups table
-- Links field_groups to categories, allowing admins to enforce fields per category

CREATE TABLE IF NOT EXISTS public.category_field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  field_group_id UUID NOT NULL REFERENCES public.field_groups(id) ON DELETE CASCADE,
  
  -- Configuration
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false, -- Are these fields mandatory for products in this category?
  
  -- Metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  
  -- Ensure unique assignment
  UNIQUE(category_id, field_group_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS category_field_groups_category_idx ON public.category_field_groups(category_id);
CREATE INDEX IF NOT EXISTS category_field_groups_field_group_idx ON public.category_field_groups(field_group_id);

-- RLS Policies
ALTER TABLE public.category_field_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view category field groups" ON public.category_field_groups;
CREATE POLICY "Anyone can view category field groups"
  ON public.category_field_groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role full access to category field groups" ON public.category_field_groups;
CREATE POLICY "Service role full access to category field groups"
  ON public.category_field_groups FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE public.category_field_groups IS 'Assigns field groups to categories, defining which fields products in that category should have';
COMMENT ON COLUMN public.category_field_groups.is_required IS 'Whether these fields are mandatory for products in this category';

