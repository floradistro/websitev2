-- ============================================================================
-- DISPLAY GROUPS (Video Wall Management)
-- Manage multiple displays that should look unified
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tv_display_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Group Info
  name TEXT NOT NULL, -- e.g., "Main Wall", "Checkout Counter Row"
  description TEXT,

  -- Layout Synchronization (applies to ALL displays in group)
  shared_theme TEXT NOT NULL DEFAULT 'midnight-elegance',
  shared_display_mode TEXT NOT NULL DEFAULT 'dense' CHECK (shared_display_mode IN ('dense', 'carousel')),

  -- Typography (same across all displays)
  shared_typography JSONB DEFAULT '{
    "productNameSize": 22,
    "priceSize": 36,
    "detailsSize": 16
  }'::jsonb,

  -- Spacing (same across all displays)
  shared_spacing JSONB DEFAULT '{
    "cardPadding": 16,
    "gridGap": 16,
    "margins": 24
  }'::jsonb,

  -- Grid Layout (same structure)
  shared_grid_columns INTEGER DEFAULT 4,
  shared_grid_rows INTEGER DEFAULT 3,

  -- Order/Positioning
  display_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link devices to groups
CREATE TABLE IF NOT EXISTS public.tv_display_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.tv_display_groups(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.tv_devices(id) ON DELETE CASCADE,

  -- Position in group (left to right, top to bottom)
  position_in_group INTEGER NOT NULL,

  -- Category Override (what this specific display shows)
  assigned_categories TEXT[],

  -- Menu Override (optional, if you want each display to use a different menu)
  assigned_menu_id UUID REFERENCES public.tv_menus(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, device_id),
  UNIQUE(group_id, position_in_group)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_display_groups_vendor ON public.tv_display_groups(vendor_id);
CREATE INDEX IF NOT EXISTS idx_display_groups_location ON public.tv_display_groups(location_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.tv_display_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_device ON public.tv_display_group_members(device_id);

-- RLS
ALTER TABLE public.tv_display_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_display_group_members ENABLE ROW LEVEL SECURITY;

-- Vendors manage their own groups
DROP POLICY IF EXISTS "Vendors manage own display groups" ON public.tv_display_groups;
CREATE POLICY "Vendors manage own display groups"
  ON public.tv_display_groups FOR ALL
  USING (vendor_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Vendors manage own group members" ON public.tv_display_group_members;
CREATE POLICY "Vendors manage own group members"
  ON public.tv_display_group_members FOR ALL
  USING (
    group_id IN (
      SELECT id FROM public.tv_display_groups WHERE vendor_id::text = auth.uid()::text
    )
  );

-- Public can view (for TV displays)
DROP POLICY IF EXISTS "Public can view display groups" ON public.tv_display_groups;
CREATE POLICY "Public can view display groups"
  ON public.tv_display_groups FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can view group members" ON public.tv_display_group_members;
CREATE POLICY "Public can view group members"
  ON public.tv_display_group_members FOR SELECT
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access display groups" ON public.tv_display_groups;
CREATE POLICY "Service role full access display groups"
  ON public.tv_display_groups FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access group members" ON public.tv_display_group_members;
CREATE POLICY "Service role full access group members"
  ON public.tv_display_group_members FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Grants
GRANT ALL ON public.tv_display_groups TO authenticated, service_role, anon;
GRANT ALL ON public.tv_display_group_members TO authenticated, service_role, anon;

-- Auto-update trigger
CREATE TRIGGER tv_display_groups_updated_at
  BEFORE UPDATE ON public.tv_display_groups
  FOR EACH ROW EXECUTE FUNCTION update_tv_updated_at();

-- Comments
COMMENT ON TABLE public.tv_display_groups IS 'Groups of displays that should maintain visual cohesion (video walls)';
COMMENT ON TABLE public.tv_display_group_members IS 'Individual displays within a group with their specific category assignments';
COMMENT ON COLUMN public.tv_display_groups.shared_theme IS 'All displays in group use the same theme for visual unity';
COMMENT ON COLUMN public.tv_display_groups.shared_grid_columns IS 'All displays use the same grid structure for alignment';
COMMENT ON COLUMN public.tv_display_group_members.assigned_categories IS 'Which categories THIS specific display shows';
COMMENT ON COLUMN public.tv_display_group_members.position_in_group IS 'Physical position (1=leftmost, 2=middle, 3=rightmost, etc.)';
