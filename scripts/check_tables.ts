import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
)

async function main() {
  const tables = [
    'campaign_channels',
    'customer_segments',
    'campaign_touchpoints',
    'social_accounts',
    'wallet_passes',
    'email_campaigns'
  ]

  console.log('Checking Marketing Studio tables:\n')

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    console.log(`${table.padEnd(25)} ${error ? '❌ ' + error.message : '✅ exists'}`)
  }
}

main()
