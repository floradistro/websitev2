#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const appId = 'dd4e23d0-1f85-4855-bdc6-be4e807566c1'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('🔍 Checking app status...')

const { data: app, error } = await supabase
  .from('vendor_apps')
  .select('id, name, preview_url, preview_machine_id, preview_status')
  .eq('id', appId)
  .single()

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

console.log('App:', app)
console.log('\n📝 Status:')
console.log('  preview_url:', app.preview_url || '(null)')
console.log('  preview_machine_id:', app.preview_machine_id || '(null)')
console.log('  preview_status:', app.preview_status || '(null)')

if (app.preview_url || app.preview_machine_id) {
  console.log('\n⚠️  Old preview info still exists! Clearing...')

  const { error: updateError } = await supabase
    .from('vendor_apps')
    .update({
      preview_url: null,
      preview_machine_id: null,
      preview_status: null,
      preview_last_activity: null
    })
    .eq('id', appId)

  if (updateError) {
    console.error('❌ Update error:', updateError)
  } else {
    console.log('✅ Cleared preview info')
  }
} else {
  console.log('\n✅ Preview info already clear')
}
