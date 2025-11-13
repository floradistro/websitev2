-- Complete the Marketing Studio migration
-- This adds the missing tables and columns from the backup

-- ============================================
-- 1. UPDATE email_campaigns table with new columns
-- ============================================
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS objective TEXT CHECK (objective IN ('awareness', 'engagement', 'conversion', 'retention', 'loyalty')) DEFAULT 'engagement',
  ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
  ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
  ADD COLUMN IF NOT EXISTS total_engaged INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing campaigns
UPDATE email_campaigns
SET
  objective = 'engagement',
  channels = ARRAY['email']::TEXT[],
  timezone = 'America/New_York'
WHERE objective IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_campaigns_objective ON email_campaigns(objective);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_channels ON email_campaigns USING GIN(channels);

-- ============================================
-- 2. CREATE campaign_channels table
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'instagram', 'facebook', 'wallet', 'sms', 'push')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_model TEXT,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  engaged_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  error_message TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign ON campaign_channels(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_channels_vendor ON campaign_channels(vendor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_channels_channel ON campaign_channels(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_channels_status ON campaign_channels(status);

ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_campaign_channels ON campaign_channels;
CREATE POLICY service_role_all_campaign_channels ON campaign_channels FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON campaign_channels TO authenticated, service_role;

-- ============================================
-- 3. FIX customer_segments table (add missing columns)
-- ============================================
ALTER TABLE customer_segments
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL CHECK (type IN ('ai', 'manual', 'behavioral', 'rfm', 'predictive')) DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(type);

-- ============================================
-- 4. CREATE campaign_touchpoints table
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES campaign_channels(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('sent', 'delivered', 'opened', 'clicked', 'engaged', 'converted', 'bounced', 'unsubscribed')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  revenue DECIMAL(10,2) DEFAULT 0,
  device_type TEXT,
  platform TEXT,
  user_agent TEXT,
  ip_address TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_touchpoints_campaign ON campaign_touchpoints(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_touchpoints_channel ON campaign_touchpoints(channel_id);
CREATE INDEX IF NOT EXISTS idx_campaign_touchpoints_customer ON campaign_touchpoints(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_touchpoints_vendor ON campaign_touchpoints(vendor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_touchpoints_action ON campaign_touchpoints(action);
CREATE INDEX IF NOT EXISTS idx_campaign_touchpoints_created_at ON campaign_touchpoints(created_at DESC);

ALTER TABLE campaign_touchpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_campaign_touchpoints ON campaign_touchpoints;
CREATE POLICY service_role_all_campaign_touchpoints ON campaign_touchpoints FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON campaign_touchpoints TO authenticated, service_role;

-- ============================================
-- 5. CREATE social_accounts table
-- ============================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'tiktok', 'pinterest')),
  account_id TEXT NOT NULL,
  account_handle TEXT,
  account_name TEXT,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  connection_status TEXT CHECK (connection_status IN ('connected', 'expired', 'revoked', 'error')) DEFAULT 'connected',
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, platform, account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_vendor ON social_accounts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_social_accounts ON social_accounts;
CREATE POLICY service_role_all_social_accounts ON social_accounts FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON social_accounts TO authenticated, service_role;

-- ============================================
-- 6. ADD screen_orientation to tv_display_profiles
-- ============================================
ALTER TABLE tv_display_profiles
  ADD COLUMN IF NOT EXISTS screen_orientation TEXT CHECK (screen_orientation IN ('landscape', 'portrait', 'auto')) DEFAULT 'landscape';

CREATE INDEX IF NOT EXISTS idx_tv_display_profiles_orientation ON tv_display_profiles(screen_orientation);

-- ============================================
-- 7. CREATE label_templates table
-- ============================================
CREATE TABLE IF NOT EXISTS label_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('product', 'jar', 'price', 'shelf', 'compliance')),
  paper_size TEXT NOT NULL CHECK (paper_size IN ('letter', 'a4', 'label_2x4', 'label_3x5', 'label_4x6')),
  layout JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_label_templates_vendor ON label_templates(vendor_id);
CREATE INDEX IF NOT EXISTS idx_label_templates_type ON label_templates(template_type);

ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_label_templates ON label_templates;
CREATE POLICY service_role_all_label_templates ON label_templates FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON label_templates TO authenticated, service_role;

-- ============================================
-- 8. CREATE inventory_transactions table
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('adjustment', 'sale', 'return', 'transfer', 'restock', 'waste', 'theft')),
  quantity_change DECIMAL(10,3) NOT NULL,
  quantity_before DECIMAL(10,3) NOT NULL,
  quantity_after DECIMAL(10,3) NOT NULL,
  unit_of_measure TEXT NOT NULL CHECK (unit_of_measure IN ('unit', 'gram', 'eighth', 'quarter', 'half', 'ounce')),
  reason TEXT,
  reference_id UUID,
  reference_type TEXT,
  performed_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_vendor ON inventory_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_location ON inventory_transactions(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at DESC);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_inventory_transactions ON inventory_transactions;
CREATE POLICY service_role_all_inventory_transactions ON inventory_transactions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON inventory_transactions TO authenticated, service_role;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update campaign stats from touchpoints
CREATE OR REPLACE FUNCTION update_campaign_stats_from_touchpoints()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS update_campaign_stats_from_touchpoints_trigger ON campaign_touchpoints;
CREATE TRIGGER update_campaign_stats_from_touchpoints_trigger
  AFTER INSERT ON campaign_touchpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats_from_touchpoints();

-- Update updated_at triggers
CREATE OR REPLACE FUNCTION update_campaign_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_channels_updated_at ON campaign_channels;
CREATE TRIGGER campaign_channels_updated_at
  BEFORE UPDATE ON campaign_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_channels_updated_at();

CREATE OR REPLACE FUNCTION update_inventory_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_transactions_updated_at ON inventory_transactions;
CREATE TRIGGER inventory_transactions_updated_at
  BEFORE UPDATE ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_transactions_updated_at();
