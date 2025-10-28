-- Quick TV Menu System Setup
-- Run this in Supabase SQL Editor

-- TV Menus table
CREATE TABLE IF NOT EXISTS public.tv_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  menu_type TEXT DEFAULT 'product_menu',
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES public.tv_menus(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_menus_vendor ON public.tv_menus(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_menus_location ON public.tv_menus(location_id);
CREATE INDEX IF NOT EXISTS idx_tv_menus_active ON public.tv_menus(is_active);

-- RLS
ALTER TABLE public.tv_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors manage own TV menus" ON public.tv_menus;
CREATE POLICY "Vendors manage own TV menus"
  ON public.tv_menus FOR ALL
  USING (vendor_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Public can view active menus" ON public.tv_menus;
CREATE POLICY "Public can view active menus"
  ON public.tv_menus FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access tv_menus" ON public.tv_menus;
CREATE POLICY "Service role full access tv_menus"
  ON public.tv_menus FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Grants
GRANT ALL ON public.tv_menus TO authenticated, service_role, anon;

-- Success message
SELECT 'TV Menu tables created successfully!' as message;
