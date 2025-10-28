-- ============================================================================
-- DIGITAL SIGNAGE & TV MENU SYSTEM
-- Full cloud-based digital signage platform with automated scheduling
-- ============================================================================

-- ============================================================================
-- TV MENUS (Main Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,

  -- Configuration (Full menu setup - colors, fonts, layout, categories)
  config_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Menu Type
  menu_type TEXT DEFAULT 'product_menu' CHECK (menu_type IN ('product_menu', 'advertisement', 'mixed', 'custom')),

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Subscription/Billing
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES public.tv_menus(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_menus_vendor ON public.tv_menus(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_menus_location ON public.tv_menus(location_id);
CREATE INDEX IF NOT EXISTS idx_tv_menus_active ON public.tv_menus(is_active);
CREATE INDEX IF NOT EXISTS idx_tv_menus_template ON public.tv_menus(is_template);
CREATE INDEX IF NOT EXISTS idx_tv_menus_type ON public.tv_menus(menu_type);


-- ============================================================================
-- TV DEVICES (Physical Displays)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Device Info
  tv_number INTEGER NOT NULL,
  device_name TEXT NOT NULL,
  device_identifier TEXT UNIQUE, -- Browser fingerprint or assigned ID

  -- Active Configuration
  active_menu_id UUID REFERENCES public.tv_menus(id) ON DELETE SET NULL,
  active_playlist_id UUID REFERENCES public.tv_playlists(id) ON DELETE SET NULL,

  -- Connection Status
  connection_status TEXT DEFAULT 'offline' CHECK (connection_status IN ('online', 'offline', 'error')),
  last_seen_at TIMESTAMPTZ,
  last_command_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,

  -- Device Technical Info
  user_agent TEXT,
  ip_address INET,
  screen_resolution TEXT,
  browser_info JSONB,

  -- Display Settings (override menu settings if needed)
  override_config JSONB DEFAULT '{}'::jsonb,

  -- Tags for grouping (e.g., "checkout", "entrance", "wall-1")
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, location_id, tv_number)
);

CREATE INDEX IF NOT EXISTS idx_tv_devices_vendor ON public.tv_devices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_devices_location ON public.tv_devices(location_id);
CREATE INDEX IF NOT EXISTS idx_tv_devices_status ON public.tv_devices(connection_status);
CREATE INDEX IF NOT EXISTS idx_tv_devices_identifier ON public.tv_devices(device_identifier);


-- ============================================================================
-- TV PLAYLISTS (Content Rotation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Playlist behavior
  rotation_type TEXT DEFAULT 'sequential' CHECK (rotation_type IN ('sequential', 'random', 'weighted')),
  transition_duration INTEGER DEFAULT 5, -- seconds between items

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_playlists_vendor ON public.tv_playlists(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_playlists_location ON public.tv_playlists(location_id);


-- ============================================================================
-- TV PLAYLIST ITEMS (Individual content items in a playlist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.tv_playlists(id) ON DELETE CASCADE,

  -- Content Reference
  menu_id UUID REFERENCES public.tv_menus(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.tv_content(id) ON DELETE CASCADE,

  -- Display Settings
  duration INTEGER DEFAULT 30, -- seconds to display this item
  display_order INTEGER DEFAULT 0,
  weight INTEGER DEFAULT 1, -- for weighted random rotation

  -- Conditions (when to show this item)
  conditions JSONB DEFAULT '{}'::jsonb, -- e.g., {"time_range": "9:00-12:00", "days": [1,2,3,4,5]}

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_playlist ON public.tv_playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_menu ON public.tv_playlist_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_content ON public.tv_playlist_items(content_id);
CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_order ON public.tv_playlist_items(display_order);


-- ============================================================================
-- TV CONTENT (Advertisements, Promotions, Custom Content)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  -- Content Info
  name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'html', 'url', 'component')),

  -- Content Data
  content_url TEXT, -- URL to image/video or external content
  content_html TEXT, -- HTML content for custom displays
  content_component TEXT, -- React component identifier
  content_data JSONB DEFAULT '{}'::jsonb, -- Additional data for component

  -- Display Settings
  background_color TEXT,
  duration INTEGER DEFAULT 10, -- default duration in seconds

  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_content_vendor ON public.tv_content(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_content_type ON public.tv_content(content_type);
CREATE INDEX IF NOT EXISTS idx_tv_content_dates ON public.tv_content(start_date, end_date);


-- ============================================================================
-- TV SCHEDULES (Automated Menu/Playlist Switching)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Target (what to activate)
  target_menu_id UUID REFERENCES public.tv_menus(id) ON DELETE CASCADE,
  target_playlist_id UUID REFERENCES public.tv_playlists(id) ON DELETE CASCADE,

  -- Target Devices (which TVs to apply to)
  target_device_ids UUID[], -- specific devices, or NULL for all at location
  target_device_tags TEXT[], -- target devices with these tags

  -- Time Conditions
  day_of_week INTEGER[], -- 0=Sunday, 6=Saturday, NULL=all days
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Date Range
  start_date DATE,
  end_date DATE,

  -- Priority (higher priority schedules override lower ones)
  priority INTEGER DEFAULT 0,

  -- Special Conditions
  conditions JSONB DEFAULT '{}'::jsonb, -- e.g., {"weather": "sunny", "temperature": ">75"}

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_schedules_vendor ON public.tv_schedules(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_schedules_location ON public.tv_schedules(location_id);
CREATE INDEX IF NOT EXISTS idx_tv_schedules_time ON public.tv_schedules(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_tv_schedules_dates ON public.tv_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tv_schedules_priority ON public.tv_schedules(priority);


-- ============================================================================
-- TV COMMANDS (Real-time Command Queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_device_id UUID NOT NULL REFERENCES public.tv_devices(id) ON DELETE CASCADE,

  -- Command
  command_type TEXT NOT NULL CHECK (command_type IN (
    'refresh',
    'update_theme',
    'switch_menu',
    'switch_playlist',
    'restart',
    'reload',
    'clear_cache',
    'screenshot',
    'update_config'
  )),
  payload JSONB DEFAULT '{}'::jsonb,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'expired')),
  executed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Expiration (commands expire after 5 minutes)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_commands_device ON public.tv_commands(tv_device_id);
CREATE INDEX IF NOT EXISTS idx_tv_commands_status ON public.tv_commands(status);
CREATE INDEX IF NOT EXISTS idx_tv_commands_created ON public.tv_commands(created_at);


-- ============================================================================
-- TV DISPLAY ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_display_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_menu_id UUID REFERENCES public.tv_menus(id) ON DELETE SET NULL,
  tv_playlist_id UUID REFERENCES public.tv_playlists(id) ON DELETE SET NULL,
  tv_content_id UUID REFERENCES public.tv_content(id) ON DELETE SET NULL,
  tv_device_id UUID REFERENCES public.tv_devices(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Display Info
  display_duration INTEGER, -- seconds
  products_displayed INTEGER,
  categories_displayed TEXT[],

  -- Performance
  load_time INTEGER, -- milliseconds
  errors_count INTEGER DEFAULT 0,

  -- Metadata
  session_id TEXT, -- group displays from same session

  displayed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_analytics_menu ON public.tv_display_analytics(tv_menu_id);
CREATE INDEX IF NOT EXISTS idx_tv_analytics_playlist ON public.tv_display_analytics(tv_playlist_id);
CREATE INDEX IF NOT EXISTS idx_tv_analytics_content ON public.tv_display_analytics(tv_content_id);
CREATE INDEX IF NOT EXISTS idx_tv_analytics_device ON public.tv_display_analytics(tv_device_id);
CREATE INDEX IF NOT EXISTS idx_tv_analytics_vendor ON public.tv_display_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_analytics_location ON public.tv_display_analytics(location_id);
CREATE INDEX IF NOT EXISTS idx_tv_analytics_displayed_at ON public.tv_display_analytics(displayed_at);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.tv_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_display_analytics ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own TV menus
DROP POLICY IF EXISTS "Vendors manage own TV menus" ON public.tv_menus;
CREATE POLICY "Vendors manage own TV menus"
  ON public.tv_menus FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Public can view active menus (for TV displays)
DROP POLICY IF EXISTS "Public can view active menus" ON public.tv_menus;
CREATE POLICY "Public can view active menus"
  ON public.tv_menus FOR SELECT
  USING (is_active = true);

-- Vendors can manage their own devices
DROP POLICY IF EXISTS "Vendors manage own devices" ON public.tv_devices;
CREATE POLICY "Vendors manage own devices"
  ON public.tv_devices FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Public can view/update devices (for registration and heartbeat)
DROP POLICY IF EXISTS "Public can register devices" ON public.tv_devices;
CREATE POLICY "Public can register devices"
  ON public.tv_devices FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update device status" ON public.tv_devices;
CREATE POLICY "Public can update device status"
  ON public.tv_devices FOR UPDATE
  USING (true);

-- Vendors manage their own playlists
DROP POLICY IF EXISTS "Vendors manage own playlists" ON public.tv_playlists;
CREATE POLICY "Vendors manage own playlists"
  ON public.tv_playlists FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Public can view active playlists
DROP POLICY IF EXISTS "Public can view active playlists" ON public.tv_playlists;
CREATE POLICY "Public can view active playlists"
  ON public.tv_playlists FOR SELECT
  USING (is_active = true);

-- Playlist items follow playlist policies
DROP POLICY IF EXISTS "Vendors manage playlist items" ON public.tv_playlist_items;
CREATE POLICY "Vendors manage playlist items"
  ON public.tv_playlist_items FOR ALL
  USING (
    playlist_id IN (
      SELECT id FROM public.tv_playlists WHERE vendor_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Public can view playlist items" ON public.tv_playlist_items;
CREATE POLICY "Public can view playlist items"
  ON public.tv_playlist_items FOR SELECT
  USING (is_active = true);

-- Vendors manage their own content
DROP POLICY IF EXISTS "Vendors manage own content" ON public.tv_content;
CREATE POLICY "Vendors manage own content"
  ON public.tv_content FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Public can view active content
DROP POLICY IF EXISTS "Public can view active content" ON public.tv_content;
CREATE POLICY "Public can view active content"
  ON public.tv_content FOR SELECT
  USING (is_active = true);

-- Vendors manage their own schedules
DROP POLICY IF EXISTS "Vendors manage own schedules" ON public.tv_schedules;
CREATE POLICY "Vendors manage own schedules"
  ON public.tv_schedules FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Public can view active schedules
DROP POLICY IF EXISTS "Public can view active schedules" ON public.tv_schedules;
CREATE POLICY "Public can view active schedules"
  ON public.tv_schedules FOR SELECT
  USING (is_active = true);

-- Commands - vendors send, devices receive
DROP POLICY IF EXISTS "Vendors send commands" ON public.tv_commands;
CREATE POLICY "Vendors send commands"
  ON public.tv_commands FOR INSERT
  WITH CHECK (
    tv_device_id IN (
      SELECT id FROM public.tv_devices WHERE vendor_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Devices receive commands" ON public.tv_commands;
CREATE POLICY "Devices receive commands"
  ON public.tv_commands FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Devices update commands" ON public.tv_commands;
CREATE POLICY "Devices update commands"
  ON public.tv_commands FOR UPDATE
  USING (true);

-- Analytics - vendors view own, devices insert
DROP POLICY IF EXISTS "Vendors view own analytics" ON public.tv_display_analytics;
CREATE POLICY "Vendors view own analytics"
  ON public.tv_display_analytics FOR SELECT
  USING (vendor_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Devices insert analytics" ON public.tv_display_analytics;
CREATE POLICY "Devices insert analytics"
  ON public.tv_display_analytics FOR INSERT
  WITH CHECK (true);

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access tv_menus" ON public.tv_menus;
CREATE POLICY "Service role full access tv_menus"
  ON public.tv_menus FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access tv_devices" ON public.tv_devices;
CREATE POLICY "Service role full access tv_devices"
  ON public.tv_devices FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tv_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER tv_menus_updated_at BEFORE UPDATE ON public.tv_menus
  FOR EACH ROW EXECUTE FUNCTION update_tv_updated_at();

CREATE TRIGGER tv_devices_updated_at BEFORE UPDATE ON public.tv_devices
  FOR EACH ROW EXECUTE FUNCTION update_tv_updated_at();

CREATE TRIGGER tv_playlists_updated_at BEFORE UPDATE ON public.tv_playlists
  FOR EACH ROW EXECUTE FUNCTION update_tv_updated_at();

CREATE TRIGGER tv_playlist_items_updated_at BEFORE UPDATE ON public.tv_playlist_items
  FOR EACH ROW EXECUTE FUNCTION update_tv_updated_at();

CREATE TRIGGER tv_content_updated_at BEFORE UPDATE ON public.tv_content
  FOR EACH ROW EXECUTE FUNCTION update_tv_updated_at();

CREATE TRIGGER tv_schedules_updated_at BEFORE UPDATE ON public.tv_schedules
  FOR EACH ROW EXECUTE FUNCTION update_tv_updated_at();


-- Function to get active schedule for a device
CREATE OR REPLACE FUNCTION get_active_schedule_for_device(device_uuid UUID)
RETURNS TABLE (
  schedule_id UUID,
  target_menu_id UUID,
  target_playlist_id UUID,
  priority INTEGER
) AS $$
DECLARE
  device_rec RECORD;
  current_time TIME;
  current_day INTEGER;
  current_date DATE;
BEGIN
  -- Get device info
  SELECT * INTO device_rec FROM public.tv_devices WHERE id = device_uuid;

  -- Get current time/day
  current_time := LOCALTIME;
  current_day := EXTRACT(DOW FROM NOW()); -- 0=Sunday
  current_date := CURRENT_DATE;

  -- Find matching schedules
  RETURN QUERY
  SELECT
    s.id,
    s.target_menu_id,
    s.target_playlist_id,
    s.priority
  FROM public.tv_schedules s
  WHERE s.is_active = true
    AND s.location_id = device_rec.location_id
    AND (s.target_device_ids IS NULL OR device_uuid = ANY(s.target_device_ids))
    AND (s.target_device_tags IS NULL OR device_rec.tags && s.target_device_tags)
    AND (s.day_of_week IS NULL OR current_day = ANY(s.day_of_week))
    AND current_time >= s.start_time
    AND current_time <= s.end_time
    AND (s.start_date IS NULL OR current_date >= s.start_date)
    AND (s.end_date IS NULL OR current_date <= s.end_date)
  ORDER BY s.priority DESC, s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- Function to expire old commands
CREATE OR REPLACE FUNCTION expire_old_tv_commands()
RETURNS void AS $$
BEGIN
  UPDATE public.tv_commands
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.tv_menus TO authenticated, service_role, anon;
GRANT ALL ON public.tv_devices TO authenticated, service_role, anon;
GRANT ALL ON public.tv_playlists TO authenticated, service_role, anon;
GRANT ALL ON public.tv_playlist_items TO authenticated, service_role, anon;
GRANT ALL ON public.tv_content TO authenticated, service_role, anon;
GRANT ALL ON public.tv_schedules TO authenticated, service_role, anon;
GRANT ALL ON public.tv_commands TO authenticated, service_role, anon;
GRANT ALL ON public.tv_display_analytics TO authenticated, service_role, anon;


-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.tv_menus IS 'Digital signage menu configurations with themes and layouts';
COMMENT ON TABLE public.tv_devices IS 'Physical TV displays and their connection status';
COMMENT ON TABLE public.tv_playlists IS 'Content playlists for rotating displays';
COMMENT ON TABLE public.tv_playlist_items IS 'Individual items in a playlist';
COMMENT ON TABLE public.tv_content IS 'Advertisement and promotional content';
COMMENT ON TABLE public.tv_schedules IS 'Automated scheduling rules for content switching';
COMMENT ON TABLE public.tv_commands IS 'Real-time command queue for TV displays';
COMMENT ON TABLE public.tv_display_analytics IS 'Analytics and performance tracking';
