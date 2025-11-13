import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
)

async function checkSchema() {
  console.log('Checking actual database schema...\n')

  // email_campaigns
  const { data: campaign, error: campErr } = await supabase
    .from('email_campaigns')
    .select('*')
    .limit(1)
    .single()

  console.log('email_campaigns columns:', campaign ? Object.keys(campaign) : `Error: ${campErr?.message}`)

  // tv_display_profiles
  const { data: profile, error: profErr } = await supabase
    .from('tv_display_profiles')
    .select('*')
    .limit(1)
    .single()

  console.log('\ntv_display_profiles columns:', profile ? Object.keys(profile) : `Error: ${profErr?.message}`)

  // products
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    .single()

  console.log('\nproducts columns:', product ? Object.keys(product) : `Error: ${prodErr?.message}`)
}

checkSchema()
