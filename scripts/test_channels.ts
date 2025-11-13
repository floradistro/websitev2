import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
)

async function test() {
  console.log('Testing campaign_channels table...\n')

  // Test 1: Select all
  const { data, error } = await supabase
    .from('campaign_channels')
    .select('*')
    .limit(5)

  if (error) {
    console.error('❌ Error selecting:', error)
  } else {
    console.log(`✅ Found ${data?.length ?? 0} channels`)
    console.log(data)
  }

  // Test 2: Check a specific campaign
  const { data: channels, error: err2 } = await supabase
    .from('campaign_channels')
    .select('*')
    .eq('campaign_id', '2dd2fc46-9357-4dd4-8aa2-7cc5ac01df76')

  if (err2) {
    console.error('\n❌ Error for specific campaign:', err2)
  } else {
    console.log(`\n✅ Found ${channels?.length ?? 0} channels for campaign 2dd2fc46`)
  }
}

test()
