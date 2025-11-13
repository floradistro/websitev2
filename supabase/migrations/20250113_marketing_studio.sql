-- ============================================
-- MARKETING STUDIO MIGRATION
-- ============================================
-- Steve Jobs Vision: One place. Every channel. Infinite possibilities.
--
-- This migration transforms email_campaigns into a multi-channel
-- campaign orchestration system supporting:
-- - Email (existing)
-- - Instagram (feed, stories, carousels)
-- - Facebook (posts, stories, events)
-- - Apple Wallet (passes, coupons, loyalty cards)
-- - SMS (future)
-- - Push Notifications (future)

-- ============================================
-- 1. EVOLVE CAMPAIGNS TABLE
-- ============================================
-- Transform email_campaigns → marketing_campaigns (multi-channel)

-- Add new columns to existing email_campaigns table
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS objective TEXT CHECK (objective IN ('awareness', 'engagement', 'conversion', 'retention', 'loyalty')) DEFAULT 'engagement',
  ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
  ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
  ADD COLUMN IF NOT EXISTS total_engaged INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_objective ON email_campaigns(objective);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_channels ON email_campaigns USING GIN(channels);

COMMENT ON COLUMN email_campaigns.objective IS 'Campaign goal: awareness, engagement, conversion, retention, or loyalty';
COMMENT ON COLUMN email_campaigns.ai_prompt IS 'Original AI prompt used to generate campaign content';
COMMENT ON COLUMN email_campaigns.channels IS 'Active channels for this campaign: email, instagram, facebook, wallet, sms';
COMMENT ON COLUMN email_campaigns.total_engaged IS 'Total customers who engaged across all channels';
COMMENT ON COLUMN email_campaigns.total_revenue IS 'Revenue attributed to this campaign across all channels';

-- ============================================
-- 2. CAMPAIGN CHANNELS
-- ============================================
-- Stores channel-specific content and performance

CREATE TABLE IF NOT EXISTS campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Channel type
  channel TEXT NOT NULL CHECK (channel IN ('email', 'instagram', 'facebook', 'wallet', 'sms', 'push')),

  -- Channel-specific content (polymorphic JSON)
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- email: { "subject": "...", "html": "...", "text": "..." }
  -- instagram: { "image_url": "...", "caption": "...", "story_url": "...", "hashtags": [...] }
  -- facebook: { "post_text": "...", "image_url": "...", "link": "...", "cta": "..." }
  -- wallet: { "pass_type": "coupon", "title": "...", "barcode": "...", "expires_at": "..." }

  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_model TEXT, -- e.g., 'claude-sonnet-4-5', 'dall-e-3'

  -- Channel performance
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  engaged_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  error_message TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(campaign_id, channel)
);

-- Indexes
CREATE INDEX idx_campaign_channels_campaign ON campaign_channels(campaign_id);
CREATE INDEX idx_campaign_channels_vendor ON campaign_channels(vendor_id);
CREATE INDEX idx_campaign_channels_channel ON campaign_channels(channel);
CREATE INDEX idx_campaign_channels_status ON campaign_channels(status);
CREATE INDEX idx_campaign_channels_ai_generated ON campaign_channels(ai_generated) WHERE ai_generated = true;

COMMENT ON TABLE campaign_channels IS 'Channel-specific content and performance for multi-channel campaigns';
COMMENT ON COLUMN campaign_channels.content IS 'Polymorphic JSONB storing channel-specific content structure';

-- ============================================
-- 3. CUSTOMER SEGMENTS (Smart Segmentation)
-- ============================================
-- AI-powered and manual customer segmentation

CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Segment identification
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('ai', 'manual', 'behavioral', 'rfm', 'predictive')) DEFAULT 'manual',

  -- Segment rules (query builder JSON)
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- RFM: { "recency_days": 30, "frequency_min": 3, "monetary_min": 100 }
  -- Behavioral: { "has_purchased": ["product-id-1"], "loyalty_tier": ["gold"] }
  -- AI: { "churn_probability": 0.7, "predicted_ltv": 500 }

  -- SQL query (for advanced segments)
  sql_query TEXT,

  -- Segment size
  customer_count INTEGER DEFAULT 0,
  estimated_reach INTEGER DEFAULT 0,

  -- Refresh settings
  refresh_frequency TEXT CHECK (refresh_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')) DEFAULT 'daily',
  last_refreshed_at TIMESTAMPTZ,

  -- AI metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customer_segments_vendor ON customer_segments(vendor_id);
CREATE INDEX idx_customer_segments_type ON customer_segments(type);
CREATE INDEX idx_customer_segments_active ON customer_segments(is_active) WHERE is_active = true;
CREATE INDEX idx_customer_segments_ai_generated ON customer_segments(ai_generated) WHERE ai_generated = true;

COMMENT ON TABLE customer_segments IS 'AI-powered and manual customer segmentation for targeted campaigns';
COMMENT ON COLUMN customer_segments.rules IS 'Query builder rules for dynamic segment membership';

-- ============================================
-- 4. CAMPAIGN TOUCHPOINTS (Journey Tracking)
-- ============================================
-- Track every customer interaction across all channels

CREATE TABLE IF NOT EXISTS campaign_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES campaign_channels(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Touchpoint details
  channel TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('sent', 'delivered', 'opened', 'clicked', 'engaged', 'converted', 'bounced', 'unsubscribed')),

  -- Conversion tracking
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  revenue DECIMAL(10,2) DEFAULT 0,

  -- Device/context
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  platform TEXT, -- 'ios', 'android', 'web'
  user_agent TEXT,
  ip_address TEXT,

  -- External IDs
  external_id TEXT, -- Platform-specific ID (Instagram post ID, Facebook post ID, etc.)

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_touchpoints_campaign ON campaign_touchpoints(campaign_id);
CREATE INDEX idx_campaign_touchpoints_channel ON campaign_touchpoints(channel_id);
CREATE INDEX idx_campaign_touchpoints_customer ON campaign_touchpoints(customer_id);
CREATE INDEX idx_campaign_touchpoints_vendor ON campaign_touchpoints(vendor_id);
CREATE INDEX idx_campaign_touchpoints_action ON campaign_touchpoints(action);
CREATE INDEX idx_campaign_touchpoints_created_at ON campaign_touchpoints(created_at DESC);
CREATE INDEX idx_campaign_touchpoints_order ON campaign_touchpoints(order_id) WHERE order_id IS NOT NULL;

COMMENT ON TABLE campaign_touchpoints IS 'Cross-channel customer journey tracking for campaign attribution';

-- ============================================
-- 5. SOCIAL MEDIA ACCOUNTS
-- ============================================
-- Vendor's connected social media accounts

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Platform
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'tiktok', 'pinterest')),

  -- Account details
  account_id TEXT NOT NULL, -- Platform-specific ID
  account_handle TEXT, -- @username
  account_name TEXT,
  profile_picture_url TEXT,

  -- Authentication
  access_token TEXT NOT NULL, -- Encrypted in production
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Permissions
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['publish_posts', 'read_insights', 'manage_stories']

  -- Connection status
  is_active BOOLEAN DEFAULT true,
  connection_status TEXT CHECK (connection_status IN ('connected', 'expired', 'revoked', 'error')) DEFAULT 'connected',
  last_error TEXT,

  -- Sync
  last_synced_at TIMESTAMPTZ,

  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(vendor_id, platform, account_id)
);

-- Indexes
CREATE INDEX idx_social_accounts_vendor ON social_accounts(vendor_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_accounts_active ON social_accounts(is_active) WHERE is_active = true;

COMMENT ON TABLE social_accounts IS 'Connected social media accounts for multi-channel campaigns';

-- ============================================
-- 6. WALLET PASSES (Apple Wallet Integration)
-- ============================================
-- Apple Wallet passes for coupons, loyalty, events

CREATE TABLE IF NOT EXISTS wallet_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,

  -- Pass type
  pass_type TEXT NOT NULL CHECK (pass_type IN ('coupon', 'loyalty', 'event', 'store_card', 'generic')),

  -- Pass content
  title TEXT NOT NULL,
  description TEXT,

  -- Barcode
  barcode_value TEXT NOT NULL,
  barcode_format TEXT NOT NULL CHECK (barcode_format IN ('QR', 'PDF417', 'CODE128', 'AZTEC')) DEFAULT 'QR',

  -- Visual design
  logo_url TEXT,
  icon_url TEXT,
  strip_image_url TEXT,
  background_color TEXT DEFAULT '#000000',
  foreground_color TEXT DEFAULT '#FFFFFF',
  label_color TEXT,

  -- Pass fields (dynamic)
  header_fields JSONB DEFAULT '[]'::jsonb,
  primary_fields JSONB DEFAULT '[]'::jsonb,
  secondary_fields JSONB DEFAULT '[]'::jsonb,
  auxiliary_fields JSONB DEFAULT '[]'::jsonb,
  back_fields JSONB DEFAULT '[]'::jsonb,

  -- Lifecycle
  serial_number TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  pass_type_identifier TEXT NOT NULL, -- Apple Developer pass type ID
  team_identifier TEXT NOT NULL, -- Apple Developer team ID

  -- URLs
  pass_url TEXT, -- Signed .pkpass download URL
  web_service_url TEXT,
  authentication_token TEXT,

  -- Validity
  expires_at TIMESTAMPTZ,
  voided BOOLEAN DEFAULT false,
  voided_at TIMESTAMPTZ,

  -- Redemption
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  redemption_code TEXT,

  -- Analytics
  installed_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Device registrations
  registered_devices JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wallet_passes_vendor ON wallet_passes(vendor_id);
CREATE INDEX idx_wallet_passes_customer ON wallet_passes(customer_id);
CREATE INDEX idx_wallet_passes_campaign ON wallet_passes(campaign_id);
CREATE INDEX idx_wallet_passes_type ON wallet_passes(pass_type);
CREATE INDEX idx_wallet_passes_serial ON wallet_passes(serial_number);
CREATE INDEX idx_wallet_passes_barcode ON wallet_passes(barcode_value);
CREATE INDEX idx_wallet_passes_expires ON wallet_passes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_wallet_passes_redeemed ON wallet_passes(redeemed) WHERE redeemed = true;

COMMENT ON TABLE wallet_passes IS 'Apple Wallet passes for coupons, loyalty cards, events, and more';

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on campaign_channels
CREATE OR REPLACE FUNCTION update_campaign_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_channels_updated_at
  BEFORE UPDATE ON campaign_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_channels_updated_at();

-- Update updated_at on customer_segments
CREATE OR REPLACE FUNCTION update_customer_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_segments_updated_at
  BEFORE UPDATE ON customer_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_segments_updated_at();

-- Update updated_at on social_accounts
CREATE OR REPLACE FUNCTION update_social_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_accounts_updated_at();

-- Update updated_at on wallet_passes
CREATE OR REPLACE FUNCTION update_wallet_passes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_passes_updated_at
  BEFORE UPDATE ON wallet_passes
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_passes_updated_at();

-- Update campaign stats when touchpoints are created
CREATE OR REPLACE FUNCTION update_campaign_stats_from_touchpoints()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign-level stats
  UPDATE email_campaigns
  SET
    total_engaged = (
      SELECT COUNT(DISTINCT customer_id)
      FROM campaign_touchpoints
      WHERE campaign_id = NEW.campaign_id
        AND action IN ('opened', 'clicked', 'engaged')
    ),
    total_revenue = (
      SELECT COALESCE(SUM(revenue), 0)
      FROM campaign_touchpoints
      WHERE campaign_id = NEW.campaign_id
        AND action = 'converted'
    )
  WHERE id = NEW.campaign_id;

  -- Update channel-level stats
  IF NEW.channel_id IS NOT NULL THEN
    UPDATE campaign_channels
    SET
      engaged_count = (
        SELECT COUNT(*)
        FROM campaign_touchpoints
        WHERE channel_id = NEW.channel_id
          AND action IN ('opened', 'clicked', 'engaged')
      ),
      converted_count = (
        SELECT COUNT(*)
        FROM campaign_touchpoints
        WHERE channel_id = NEW.channel_id
          AND action = 'converted'
      ),
      revenue = (
        SELECT COALESCE(SUM(revenue), 0)
        FROM campaign_touchpoints
        WHERE channel_id = NEW.channel_id
          AND action = 'converted'
      )
    WHERE id = NEW.channel_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_from_touchpoints_trigger
  AFTER INSERT ON campaign_touchpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats_from_touchpoints();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_passes ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY service_role_all_campaign_channels ON campaign_channels FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_customer_segments ON customer_segments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_campaign_touchpoints ON campaign_touchpoints FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_social_accounts ON social_accounts FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_wallet_passes ON wallet_passes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON campaign_channels TO authenticated, service_role;
GRANT ALL ON customer_segments TO authenticated, service_role;
GRANT ALL ON campaign_touchpoints TO authenticated, service_role;
GRANT ALL ON social_accounts TO authenticated, service_role;
GRANT ALL ON wallet_passes TO authenticated, service_role;

-- ============================================
-- SEED DATA (Smart Segments)
-- ============================================

-- Insert AI-powered smart segments that apply to all vendors
-- These will be auto-created when vendors access Marketing Studio

COMMENT ON SCHEMA public IS 'Marketing Studio schema v1.0 - Multi-channel campaign orchestration with AI';
