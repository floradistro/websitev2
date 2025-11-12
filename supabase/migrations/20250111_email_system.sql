-- ============================================
-- EMAIL SYSTEM MIGRATION
-- ============================================
-- This migration creates tables for:
-- 1. Email templates (reusable email designs)
-- 2. Email campaigns (marketing campaigns)
-- 3. Email sends (tracking individual emails)
-- 4. Email events (opens, clicks, bounces, etc.)

-- Drop existing tables if they exist (careful in production!)
DROP TABLE IF EXISTS email_events CASCADE;
DROP TABLE IF EXISTS email_sends CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS vendor_email_settings CASCADE;
DROP TABLE IF EXISTS customer_email_preferences CASCADE;

-- ============================================
-- 1. EMAIL TEMPLATES
-- ============================================
-- Stores reusable email templates for both transactional and marketing emails

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- Template identification
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transactional', 'marketing')),
  category TEXT, -- e.g., 'order_confirmation', 'welcome', 'promotion', 'newsletter'

  -- Template content
  subject TEXT NOT NULL,
  preview_text TEXT, -- Email preview/preheader text
  html_content TEXT NOT NULL,
  text_content TEXT, -- Plain text version

  -- React Email template reference (optional)
  template_component TEXT, -- e.g., 'WelcomeEmail', 'OrderConfirmationEmail'

  -- Template metadata
  from_name TEXT NOT NULL DEFAULT 'Flora Distro',
  from_email TEXT, -- If null, uses vendor's configured email
  reply_to TEXT,

  -- Template variables/placeholders
  variables JSONB DEFAULT '[]'::jsonb, -- e.g., ['customer_name', 'order_number', 'total']

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default template for this category

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(vendor_id, slug)
);

-- Indexes
CREATE INDEX idx_email_templates_vendor ON email_templates(vendor_id);
CREATE INDEX idx_email_templates_type ON email_templates(type);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE email_templates IS 'Reusable email templates for transactional and marketing emails';
COMMENT ON COLUMN email_templates.variables IS 'Array of variable names that can be used in the template';

-- ============================================
-- 2. EMAIL CAMPAIGNS
-- ============================================
-- Marketing email campaigns

CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Campaign identification
  name TEXT NOT NULL,

  -- Campaign content (can override template or be standalone)
  subject TEXT NOT NULL,
  preview_text TEXT,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,

  -- Email content (if not using template)
  html_content TEXT,
  text_content TEXT,

  -- Audience targeting
  target_audience JSONB DEFAULT '{}'::jsonb, -- e.g., {"loyalty_tier": ["gold", "platinum"], "location_ids": [...]}
  segment_type TEXT CHECK (segment_type IN ('all_customers', 'loyalty_members', 'location', 'custom_segment')),

  -- Campaign settings
  send_at TIMESTAMPTZ, -- Scheduled send time (null = draft)
  send_now BOOLEAN DEFAULT false,

  -- Campaign status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),

  -- Campaign stats (updated by triggers)
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_complained INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_email_campaigns_vendor ON email_campaigns(vendor_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_sent_at ON email_campaigns(sent_at) WHERE sent_at IS NOT NULL;

COMMENT ON TABLE email_campaigns IS 'Marketing email campaigns with scheduling and targeting';
COMMENT ON COLUMN email_campaigns.target_audience IS 'JSONB object defining who receives this campaign';

-- ============================================
-- 3. EMAIL SENDS
-- ============================================
-- Tracks individual email sends (both transactional and campaign)

CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Email details
  email_type TEXT NOT NULL CHECK (email_type IN ('transactional', 'marketing')),
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  reply_to TEXT,

  subject TEXT NOT NULL,

  -- Resend integration
  resend_email_id TEXT, -- Resend's email ID for tracking

  -- Email status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,

  -- Engagement tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- e.g., order_id, transaction details, etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_email_sends_vendor ON email_sends(vendor_id);
CREATE INDEX idx_email_sends_customer ON email_sends(customer_id);
CREATE INDEX idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_type ON email_sends(email_type);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_resend_id ON email_sends(resend_email_id) WHERE resend_email_id IS NOT NULL;
CREATE INDEX idx_email_sends_to_email ON email_sends(to_email);
CREATE INDEX idx_email_sends_created_at ON email_sends(created_at DESC);

COMMENT ON TABLE email_sends IS 'Individual email send records with delivery and engagement tracking';

-- ============================================
-- 4. EMAIL EVENTS
-- ============================================
-- Granular tracking of email events (opens, clicks, bounces, etc.)

CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),

  -- Event metadata
  user_agent TEXT,
  ip_address TEXT,
  link_url TEXT, -- For click events

  -- Resend webhook data
  resend_event_id TEXT,
  raw_event_data JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_events_send ON email_events(email_send_id);
CREATE INDEX idx_email_events_vendor ON email_events(vendor_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_created_at ON email_events(created_at DESC);

COMMENT ON TABLE email_events IS 'Granular tracking of all email events from Resend webhooks';

-- ============================================
-- 5. VENDOR EMAIL SETTINGS
-- ============================================
-- Per-vendor email configuration

CREATE TABLE vendor_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,

  -- Sending configuration
  from_name TEXT NOT NULL DEFAULT 'Your Store',
  from_email TEXT NOT NULL, -- Must match verified domain in Resend
  reply_to TEXT,

  -- Domain verification
  domain TEXT NOT NULL, -- e.g., 'floradistro.com'
  domain_verified BOOLEAN DEFAULT false,
  resend_domain_id TEXT,

  -- Transactional email settings
  enable_order_confirmations BOOLEAN DEFAULT true,
  enable_loyalty_updates BOOLEAN DEFAULT true,
  enable_password_resets BOOLEAN DEFAULT true,
  enable_welcome_emails BOOLEAN DEFAULT true,

  -- Marketing email settings
  enable_marketing BOOLEAN DEFAULT true,
  require_double_opt_in BOOLEAN DEFAULT false,

  -- Email signature/footer
  signature_html TEXT,
  unsubscribe_footer_html TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendor_email_settings_vendor ON vendor_email_settings(vendor_id);

COMMENT ON TABLE vendor_email_settings IS 'Per-vendor email configuration and preferences';

-- ============================================
-- 6. CUSTOMER UNSUBSCRIBES
-- ============================================
-- Track customer email preferences and unsubscribes

CREATE TABLE customer_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- Preferences
  unsubscribed_marketing BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,

  -- Still receive transactional (can't unsubscribe from these)
  -- Like order confirmations, password resets, etc.

  -- Metadata
  unsubscribe_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(customer_id, vendor_id)
);

-- Indexes
CREATE INDEX idx_customer_email_preferences_customer ON customer_email_preferences(customer_id);
CREATE INDEX idx_customer_email_preferences_vendor ON customer_email_preferences(vendor_id);
CREATE INDEX idx_customer_email_preferences_unsubscribed ON customer_email_preferences(unsubscribed_marketing) WHERE unsubscribed_marketing = true;

COMMENT ON TABLE customer_email_preferences IS 'Customer email preferences and unsubscribe tracking';

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on email_templates
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Update updated_at on email_campaigns
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();

-- Update campaign stats when email_sends change
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL THEN
    UPDATE email_campaigns
    SET
      total_sent = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'delivered')),
      total_delivered = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = NEW.campaign_id AND status = 'delivered'),
      total_opened = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
      total_clicked = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL),
      total_bounced = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = NEW.campaign_id AND bounced_at IS NOT NULL),
      total_complained = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = NEW.campaign_id AND complained_at IS NOT NULL)
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
  AFTER INSERT OR UPDATE ON email_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_email_preferences ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for server-side operations)
CREATE POLICY service_role_all_email_templates ON email_templates FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_email_campaigns ON email_campaigns FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_email_sends ON email_sends FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_email_events ON email_events FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_vendor_email_settings ON vendor_email_settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_customer_email_preferences ON customer_email_preferences FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- TODO: Add vendor-specific policies when auth is fully implemented
-- For now, service role has full access

-- ============================================
-- SEED DEFAULT EMAIL TEMPLATES
-- ============================================

-- Insert default transactional email templates
-- These will be created per-vendor when they set up email

-- ============================================
-- GRANTS
-- ============================================

-- Grant access to authenticated users (will be refined with RLS)
GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON email_campaigns TO authenticated;
GRANT ALL ON email_sends TO authenticated;
GRANT ALL ON email_events TO authenticated;
GRANT ALL ON vendor_email_settings TO authenticated;
GRANT ALL ON customer_email_preferences TO authenticated;

-- Grant access to service role
GRANT ALL ON email_templates TO service_role;
GRANT ALL ON email_campaigns TO service_role;
GRANT ALL ON email_sends TO service_role;
GRANT ALL ON email_events TO service_role;
GRANT ALL ON vendor_email_settings TO service_role;
GRANT ALL ON customer_email_preferences TO service_role;
