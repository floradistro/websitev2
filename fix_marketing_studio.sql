-- Update existing campaigns with defaults
UPDATE email_campaigns
SET
  objective = 'engagement',
  channels = ARRAY['email']::TEXT[],
  timezone = 'America/New_York'
WHERE objective IS NULL;

-- Create campaign_channels table if it doesn't exist
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
