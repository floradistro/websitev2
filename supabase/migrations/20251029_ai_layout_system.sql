-- ============================================================================
-- AI LAYOUT OPTIMIZATION SYSTEM
-- Stores display profiles and AI-generated layout recommendations
-- ============================================================================

-- ============================================================================
-- TV DISPLAY PROFILES (Physical & Context Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tv_display_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.tv_devices(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  -- Physical Specifications
  screen_width_inches NUMERIC(5,2),
  screen_height_inches NUMERIC(5,2),
  resolution_width INTEGER DEFAULT 1920,
  resolution_height INTEGER DEFAULT 1080,

  -- Viewing Context
  viewing_distance_feet NUMERIC(4,1),
  location_type TEXT CHECK (location_type IN ('checkout', 'entrance', 'waiting', 'wall_menu', 'other')),
  ambient_lighting TEXT DEFAULT 'medium' CHECK (ambient_lighting IN ('bright', 'medium', 'dim')),

  -- Customer Behavior
  avg_dwell_time_seconds INTEGER DEFAULT 30,
  customer_behavior TEXT, -- Free-form description
  adjacent_to TEXT, -- What's nearby (e.g., "cash register", "entrance")

  -- Store Context
  store_type TEXT DEFAULT 'dispensary' CHECK (store_type IN ('dispensary', 'retail', 'restaurant')),
  brand_vibe TEXT DEFAULT 'casual' CHECK (brand_vibe IN ('premium', 'casual', 'medical', 'recreational')),
  target_audience TEXT,

  -- Business Goals (array of goals)
  business_goals TEXT[],

  -- Calculated Fields (set by AI)
  optimal_font_size INTEGER,
  max_comfortable_products INTEGER,
  calculated_ppi NUMERIC(6,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(device_id)
);

CREATE INDEX IF NOT EXISTS idx_display_profiles_device ON public.tv_display_profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_display_profiles_vendor ON public.tv_display_profiles(vendor_id);


-- ============================================================================
-- AI LAYOUT RECOMMENDATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_layout_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.tv_devices(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.tv_menus(id) ON DELETE CASCADE,

  -- Recommendation Source
  ai_type TEXT NOT NULL CHECK (ai_type IN ('rule_based', 'llm', 'hybrid')),

  -- Layout Recommendation
  recommended_layout JSONB NOT NULL, -- Full layout config

  -- Metadata
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning TEXT[],
  alternatives JSONB, -- Alternative layout options
  customization_tips TEXT[],

  -- Performance Tracking
  was_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  user_feedback TEXT CHECK (user_feedback IN ('accepted', 'rejected', 'modified', null)),
  user_modifications JSONB, -- What the user changed

  -- Context Snapshot (for learning)
  product_count_at_time INTEGER,
  categories_at_time TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_device ON public.ai_layout_recommendations(device_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_vendor ON public.ai_layout_recommendations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_menu ON public.ai_layout_recommendations(menu_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_applied ON public.ai_layout_recommendations(was_applied);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON public.ai_layout_recommendations(created_at);


-- ============================================================================
-- AI PERFORMANCE METRICS (for learning & improvement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_layout_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.ai_layout_recommendations(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.tv_devices(id) ON DELETE CASCADE,

  -- Performance Metrics
  avg_view_time_seconds NUMERIC(10,2),
  interaction_rate NUMERIC(5,2), -- Percentage
  estimated_conversions INTEGER,

  -- Engagement Signals
  display_uptime_percentage NUMERIC(5,2),
  error_count INTEGER DEFAULT 0,

  -- Time Period
  measured_from TIMESTAMPTZ NOT NULL,
  measured_to TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_performance_recommendation ON public.ai_layout_performance(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_device ON public.ai_layout_performance(device_id);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.tv_display_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_layout_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_layout_performance ENABLE ROW LEVEL SECURITY;

-- Vendors manage their own profiles
DROP POLICY IF EXISTS "Vendors manage own display profiles" ON public.tv_display_profiles;
CREATE POLICY "Vendors manage own display profiles"
  ON public.tv_display_profiles FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Vendors manage their own AI recommendations
DROP POLICY IF EXISTS "Vendors manage own AI recommendations" ON public.ai_layout_recommendations;
CREATE POLICY "Vendors manage own AI recommendations"
  ON public.ai_layout_recommendations FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Vendors view their own performance data
DROP POLICY IF EXISTS "Vendors view own AI performance" ON public.ai_layout_performance;
CREATE POLICY "Vendors view own AI performance"
  ON public.ai_layout_performance FOR SELECT
  USING (
    device_id IN (
      SELECT id FROM public.tv_devices WHERE vendor_id::text = auth.uid()::text
    )
  );

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access display profiles" ON public.tv_display_profiles;
CREATE POLICY "Service role full access display profiles"
  ON public.tv_display_profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access AI recommendations" ON public.ai_layout_recommendations;
CREATE POLICY "Service role full access AI recommendations"
  ON public.ai_layout_recommendations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access AI performance" ON public.ai_layout_performance;
CREATE POLICY "Service role full access AI performance"
  ON public.ai_layout_performance FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_display_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tv_display_profiles_updated_at
  BEFORE UPDATE ON public.tv_display_profiles
  FOR EACH ROW EXECUTE FUNCTION update_display_profile_updated_at();


-- Function to clean up expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_ai_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_layout_recommendations
  WHERE expires_at < NOW()
    AND was_applied = false; -- Keep applied ones for historical analysis
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.tv_display_profiles TO authenticated, service_role, anon;
GRANT ALL ON public.ai_layout_recommendations TO authenticated, service_role, anon;
GRANT ALL ON public.ai_layout_performance TO authenticated, service_role, anon;


-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.tv_display_profiles IS 'Physical and contextual information about TV displays for AI layout optimization';
COMMENT ON TABLE public.ai_layout_recommendations IS 'AI-generated layout recommendations with reasoning and alternatives';
COMMENT ON TABLE public.ai_layout_performance IS 'Performance metrics for AI-recommended layouts to enable learning';

COMMENT ON COLUMN public.tv_display_profiles.viewing_distance_feet IS 'Critical for calculating minimum readable font sizes';
COMMENT ON COLUMN public.tv_display_profiles.business_goals IS 'Array of business objectives (e.g., "increase high-margin sales")';
COMMENT ON COLUMN public.ai_layout_recommendations.ai_type IS 'Which AI system generated this (rule_based, llm, or hybrid)';
COMMENT ON COLUMN public.ai_layout_recommendations.confidence_score IS 'AI confidence in this recommendation (0-100)';
