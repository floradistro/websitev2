import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🚀 Fixing Marketing Studio...\n')

  // 1. Update existing campaigns
  console.log('1. Updating existing campaigns with defaults...')
  const { data: campaigns, error: updateError } = await supabase
    .from('email_campaigns')
    .update({
      objective: 'engagement',
      channels: ['email'],
      timezone: 'America/New_York'
    })
    .is('objective', null)
    .select('id')

  if (updateError && !updateError.message.includes('column')) {
    console.error('❌ Failed to update campaigns:', updateError)
  } else {
    console.log(`✅ Updated ${campaigns?.length ?? 0} campaigns`)
  }

  // 2. Check if table exists
  console.log('\n2. Checking campaign_channels table...')
  const { error: checkError } = await supabase
    .from('campaign_channels')
    .select('id')
    .limit(1)

  if (checkError) {
    console.log('❌ Table does not exist:', checkError.message)
    console.log('\n📝 You need to run this SQL in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new\n')
    console.log(`
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

CREATE POLICY IF NOT EXISTS service_role_all_campaign_channels
  ON campaign_channels FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON campaign_channels TO authenticated, service_role;
`)
  } else {
    console.log('✅ campaign_channels table exists!')
  }

  console.log('\n✨ Done!')
}

main()
