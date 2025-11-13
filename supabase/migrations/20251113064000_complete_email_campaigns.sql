-- Complete email_campaigns table with missing Marketing Studio columns

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS total_engaged INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
  ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMPTZ;

-- Update existing campaigns with defaults
UPDATE email_campaigns
SET
  total_engaged = COALESCE(total_opened, 0),
  total_revenue = 0,
  timezone = 'America/New_York',
  metadata = '{}'::jsonb
WHERE total_engaged IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_email_campaigns_objective ON email_campaigns(objective);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_channels ON email_campaigns USING GIN(channels);
