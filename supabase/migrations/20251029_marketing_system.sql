-- ============================================================================
-- MARKETING SYSTEM - Complete Database Schema
-- ============================================================================
-- Created: October 29, 2025
-- Purpose: Multi-provider marketing system (AlpineIQ + Built-in)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VENDOR MARKETING CONFIGURATION
-- ----------------------------------------------------------------------------

-- Add marketing provider configuration to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS marketing_provider TEXT DEFAULT 'builtin';
-- Options: 'builtin', 'alpineiq'

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS marketing_config JSONB DEFAULT '{}';
-- Stores provider-specific config (API keys, settings, etc)

COMMENT ON COLUMN vendors.marketing_provider IS 'Marketing provider: builtin (our system) or alpineiq (Flora Distro)';
COMMENT ON COLUMN vendors.marketing_config IS 'Provider-specific configuration (API keys, UIDs, etc)';

-- Set Flora Distro to use AlpineIQ
UPDATE vendors
SET
  marketing_provider = 'alpineiq',
  marketing_config = jsonb_build_object(
    'api_key', 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw',
    'user_id', '3999',
    'agency_id', '1035'
  )
WHERE id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; -- Flora Distro


-- ----------------------------------------------------------------------------
-- 2. ALPINEIQ SYNC INFRASTRUCTURE
-- ----------------------------------------------------------------------------

-- Track sync operations between our system and AlpineIQ
CREATE TABLE IF NOT EXISTS alpineiq_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- What synced
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'order', 'product', 'campaign', 'loyalty')),
  entity_id UUID NOT NULL,

  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('to_alpineiq', 'from_alpineiq')),

  -- AlpineIQ reference
  alpineiq_id TEXT,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retry')),
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- Data snapshot (for debugging/rollback)
  payload JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alpineiq_sync_vendor_entity ON alpineiq_sync_log(vendor_id, entity_type, entity_id);
CREATE INDEX idx_alpineiq_sync_status ON alpineiq_sync_log(status, created_at);
CREATE INDEX idx_alpineiq_sync_alpineiq_id ON alpineiq_sync_log(alpineiq_id);

COMMENT ON TABLE alpineiq_sync_log IS 'Audit log of all AlpineIQ sync operations';


-- Customer ID mapping (our system <-> AlpineIQ)
CREATE TABLE IF NOT EXISTS alpineiq_customer_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  alpineiq_customer_id TEXT NOT NULL,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_hash TEXT, -- Hash of customer data to detect changes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, customer_id),
  UNIQUE(alpineiq_customer_id)
);

CREATE INDEX idx_alpineiq_customer_vendor ON alpineiq_customer_mapping(vendor_id);
CREATE INDEX idx_alpineiq_customer_customer_id ON alpineiq_customer_mapping(customer_id);

COMMENT ON TABLE alpineiq_customer_mapping IS 'Maps our customer IDs to AlpineIQ Universal IDs';


-- ----------------------------------------------------------------------------
-- 3. EMAIL CAMPAIGNS (Built-in System)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Campaign details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Email content
  subject_line TEXT NOT NULL,
  preheader TEXT,
  html_body TEXT NOT NULL,
  plain_text_body TEXT,

  -- Template reference (if using pre-built template)
  template_id UUID,
  template_variables JSONB,

  -- Targeting
  segment_id UUID, -- References customer_segments table

  -- Scheduling
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Tracking metrics
  total_recipients INT DEFAULT 0,
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_unsubscribed INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,

  -- Provider (for multi-provider support)
  provider TEXT DEFAULT 'sendgrid', -- 'sendgrid', 'alpineiq', 'aws_ses'
  provider_campaign_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_email_campaigns_vendor ON email_campaigns(vendor_id, status, scheduled_for DESC);
CREATE INDEX idx_email_campaigns_segment ON email_campaigns(segment_id);

COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns';


-- ----------------------------------------------------------------------------
-- 4. SMS CAMPAIGNS (Built-in System)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Campaign details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- SMS content (160 chars max per message)
  message_body TEXT NOT NULL CHECK (length(message_body) <= 1600), -- 10 message segments max
  is_mms BOOLEAN DEFAULT false,
  media_url TEXT, -- For MMS

  -- Targeting
  segment_id UUID,

  -- Scheduling
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Tracking metrics
  total_recipients INT DEFAULT 0,
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,

  -- Cost tracking
  message_segments INT DEFAULT 1, -- SMS split into 160-char segments
  cost_per_message DECIMAL(10,4) DEFAULT 0.0075, -- Twilio pricing
  total_cost DECIMAL(10,2) DEFAULT 0,

  -- Provider
  provider TEXT DEFAULT 'twilio', -- 'twilio', 'alpineiq'
  provider_campaign_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_sms_campaigns_vendor ON sms_campaigns(vendor_id, status, scheduled_for DESC);
CREATE INDEX idx_sms_campaigns_segment ON sms_campaigns(segment_id);

COMMENT ON TABLE sms_campaigns IS 'SMS/MMS marketing campaigns';


-- ----------------------------------------------------------------------------
-- 5. CUSTOMER SEGMENTS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Segment details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Segment criteria (flexible JSON structure)
  segment_rules JSONB NOT NULL,
  -- Example: {
  --   "conditions": [
  --     {"field": "total_orders", "operator": ">=", "value": 3},
  --     {"field": "lifetime_value", "operator": ">=", "value": 100},
  --     {"field": "last_order_date", "operator": ">=", "value": "2025-01-01"}
  --   ],
  --   "logic": "AND"
  -- }

  -- Stats (cached for performance)
  customer_count INT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  -- Dynamic vs Static
  is_dynamic BOOLEAN DEFAULT true, -- Recalculated on each use

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_segments_vendor ON customer_segments(vendor_id);

COMMENT ON TABLE customer_segments IS 'Customer segmentation for targeted marketing';


-- ----------------------------------------------------------------------------
-- 6. LOYALTY PROGRAMS (Built-in System - NOT AlpineIQ)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Program details
  name VARCHAR(255) NOT NULL DEFAULT 'Rewards Program',
  description TEXT,

  -- Points system
  points_per_dollar DECIMAL(10,2) DEFAULT 10, -- $1 = 10 points
  point_value DECIMAL(10,4) DEFAULT 0.01, -- 100 points = $1
  min_redemption_points INT DEFAULT 100,
  points_expiry_days INT DEFAULT 365,

  -- Tiers (JSONB for flexibility)
  tiers JSONB DEFAULT '[
    {"name":"Bronze","min_points":0,"discount_percent":0,"perks":[]},
    {"name":"Silver","min_points":500,"discount_percent":5,"perks":["Early access to sales"]},
    {"name":"Gold","min_points":1000,"discount_percent":10,"perks":["Early access to sales","Free delivery"]}
  ]',

  -- Rules
  allow_points_on_discounted_items BOOLEAN DEFAULT true,
  points_on_tax BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id) -- One loyalty program per vendor
);

CREATE INDEX idx_loyalty_programs_vendor ON loyalty_programs(vendor_id);

COMMENT ON TABLE loyalty_programs IS 'Built-in loyalty program configuration (for non-AlpineIQ vendors)';


-- ----------------------------------------------------------------------------
-- 7. CUSTOMER LOYALTY BALANCES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Points balance
  points_balance INT DEFAULT 0,
  points_lifetime_earned INT DEFAULT 0,
  points_lifetime_redeemed INT DEFAULT 0,

  -- Tier
  current_tier TEXT DEFAULT 'Bronze',
  tier_qualified_at TIMESTAMPTZ,

  -- Metadata
  last_earned_at TIMESTAMPTZ,
  last_redeemed_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, customer_id)
);

CREATE INDEX idx_customer_loyalty_vendor ON customer_loyalty(vendor_id, points_balance DESC);
CREATE INDEX idx_customer_loyalty_customer ON customer_loyalty(customer_id);
CREATE INDEX idx_customer_loyalty_tier ON customer_loyalty(vendor_id, current_tier);

COMMENT ON TABLE customer_loyalty IS 'Customer loyalty point balances (built-in system only)';


-- ----------------------------------------------------------------------------
-- 8. LOYALTY TRANSACTIONS (Audit Log)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted', 'bonus', 'revoked')),
  points INT NOT NULL, -- Positive for earn, negative for redeem/expire
  description TEXT,

  -- References
  order_id UUID REFERENCES orders(id),
  campaign_id UUID, -- If from a campaign bonus
  employee_id UUID REFERENCES employees(id), -- If manually adjusted

  -- Balance snapshot
  balance_before INT,
  balance_after INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX idx_loyalty_transactions_vendor ON loyalty_transactions(vendor_id, created_at DESC);
CREATE INDEX idx_loyalty_transactions_order ON loyalty_transactions(order_id);

COMMENT ON TABLE loyalty_transactions IS 'Audit log of all loyalty point transactions';


-- ----------------------------------------------------------------------------
-- 9. CAMPAIGN EVENTS (Engagement Tracking)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marketing_campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Campaign reference
  campaign_id UUID NOT NULL, -- Can reference email_campaigns, sms_campaigns, or AlpineIQ campaign
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push', 'alpineiq')),

  -- Customer
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'converted')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'browser', 'wallet')),

  -- Event metadata
  metadata JSONB, -- Link clicked, device info, etc.

  -- Attribution
  attributed_order_id UUID REFERENCES orders(id),
  attributed_revenue DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_events_campaign ON marketing_campaign_events(campaign_id, event_type);
CREATE INDEX idx_marketing_events_customer ON marketing_campaign_events(customer_id, created_at DESC);
CREATE INDEX idx_marketing_events_vendor ON marketing_campaign_events(vendor_id, created_at DESC);
CREATE INDEX idx_marketing_events_conversion ON marketing_campaign_events(attributed_order_id) WHERE event_type = 'converted';

COMMENT ON TABLE marketing_campaign_events IS 'Tracks all marketing campaign engagement events';


-- ----------------------------------------------------------------------------
-- 10. CUSTOMER SESSIONS (Attribution Tracking)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Session details
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days', -- 7-day attribution window

  -- Device/browser
  user_agent TEXT,
  ip_address INET,

  -- Conversion
  converted BOOLEAN DEFAULT false,
  conversion_order_id UUID REFERENCES orders(id),
  conversion_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_sessions_customer ON customer_sessions(customer_id, session_start DESC);
CREATE INDEX idx_customer_sessions_campaign ON customer_sessions(utm_campaign, session_start DESC);
CREATE INDEX idx_customer_sessions_vendor ON customer_sessions(vendor_id);
CREATE INDEX idx_customer_sessions_expires ON customer_sessions(expires_at) WHERE NOT converted;

COMMENT ON TABLE customer_sessions IS 'Tracks customer sessions for campaign attribution';


-- ----------------------------------------------------------------------------
-- 11. AUTOMATION RULES (Trigger-based Marketing)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marketing_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Rule details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Trigger
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'customer_created',
    'order_created',
    'order_completed',
    'customer_inactive_30d',
    'customer_inactive_60d',
    'customer_birthday',
    'loyalty_milestone',
    'cart_abandoned',
    'product_restocked',
    'product_low_stock',
    'review_received'
  )),

  -- Conditions (optional additional filters)
  conditions JSONB,

  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'send_sms', 'add_to_segment', 'adjust_loyalty_points', 'create_discount')),
  action_config JSONB NOT NULL,
  -- Example: {
  --   "campaign_id": "uuid",
  --   "template_id": "uuid",
  --   "delay_minutes": 30
  -- }

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Stats
  total_triggered INT DEFAULT 0,
  total_executed INT DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_vendor ON marketing_automation_rules(vendor_id, is_active);
CREATE INDEX idx_automation_rules_trigger ON marketing_automation_rules(trigger_event, is_active);

COMMENT ON TABLE marketing_automation_rules IS 'Automated marketing rules and triggers';


-- ----------------------------------------------------------------------------
-- 12. APPLE WALLET PASSES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wallet_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Pass details
  pass_type TEXT NOT NULL CHECK (pass_type IN ('loyalty', 'coupon', 'event', 'generic')),
  pass_serial_number TEXT UNIQUE NOT NULL,

  -- Apple/Google Wallet URLs
  apple_wallet_url TEXT,
  google_wallet_url TEXT,

  -- Pass data (stored as JSON for flexibility)
  pass_data JSONB NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tracking
  times_downloaded INT DEFAULT 0,
  times_updated INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, customer_id, pass_type)
);

CREATE INDEX idx_wallet_passes_customer ON wallet_passes(customer_id);
CREATE INDEX idx_wallet_passes_vendor ON wallet_passes(vendor_id, pass_type);
CREATE INDEX idx_wallet_passes_serial ON wallet_passes(pass_serial_number);

COMMENT ON TABLE wallet_passes IS 'Apple/Google Wallet passes for loyalty cards, coupons, etc';


-- ----------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all marketing tables
ALTER TABLE alpineiq_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpineiq_customer_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_passes ENABLE ROW LEVEL SECURITY;

-- Policies: Vendors can only access their own data
CREATE POLICY vendor_access_alpineiq_sync ON alpineiq_sync_log
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_alpineiq_mapping ON alpineiq_customer_mapping
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_email_campaigns ON email_campaigns
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_sms_campaigns ON sms_campaigns
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_segments ON customer_segments
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_loyalty_programs ON loyalty_programs
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_customer_loyalty ON customer_loyalty
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_loyalty_transactions ON loyalty_transactions
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_campaign_events ON marketing_campaign_events
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_sessions ON customer_sessions
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_automation_rules ON marketing_automation_rules
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);

CREATE POLICY vendor_access_wallet_passes ON wallet_passes
  FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::uuid);


-- ============================================================================
-- END OF MARKETING SYSTEM MIGRATION
-- ============================================================================
