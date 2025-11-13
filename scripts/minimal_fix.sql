-- Minimal fix to get Marketing Studio working

-- 1. Update email_campaigns
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS objective TEXT CHECK (objective IN ('awareness', 'engagement', 'conversion', 'retention', 'loyalty')) DEFAULT 'engagement',
  ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT ARRAY['email']::TEXT[];

UPDATE email_campaigns SET objective = 'engagement', channels = ARRAY['email']::TEXT[] WHERE objective IS NULL;

-- 2. Create campaign_channels
CREATE TABLE IF NOT EXISTS campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS service_role_all_campaign_channels ON campaign_channels FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
GRANT ALL ON campaign_channels TO authenticated, service_role;

-- 3. Add type column to customer_segments if missing
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'manual';

-- 4. Add screen_orientation to tv_display_profiles
ALTER TABLE tv_display_profiles ADD COLUMN IF NOT EXISTS screen_orientation TEXT DEFAULT 'landscape';
