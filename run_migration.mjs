import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('Running Marketing Studio migration...\n')

  // Update existing campaigns
  console.log('1. Updating existing campaigns with defaults...')
  const { error: updateError } = await supabase
    .from('email_campaigns')
    .update({
      objective: 'engagement',
      channels: ['email'],
      timezone: 'America/New_York'
    })
    .is('objective', null)

  if (updateError && !updateError.message.includes('column')) {
    console.error('Failed to update campaigns:', updateError)
  } else {
    console.log('✓ Campaigns updated')
  }

  // Check if table already exists
  console.log('\n2. Checking if campaign_channels table exists...')
  const { error: checkError } = await supabase
    .from('campaign_channels')
    .select('id')
    .limit(1)

  if (!checkError) {
    console.log('✓ campaign_channels table already exists!')
    console.log('\n✅ Migration complete!')
    return
  }

  console.log('Table does not exist, attempting to create...')
  console.log('\n⚠️  Cannot create table via JS client - need to use Supabase dashboard SQL editor')
  console.log('\nPlease run this SQL in Supabase dashboard:')
  const sql = readFileSync('fix_marketing_studio.sql', 'utf8')
  console.log('\n' + sql)
}

runMigration()
