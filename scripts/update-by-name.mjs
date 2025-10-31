#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('🔄 Updating Flora app by name...')

const { data, error } = await supabase
  .from('vendor_apps')
  .update({
    preview_url: null,
    preview_machine_id: null,
    preview_status: null,
    preview_last_activity: null
  })
  .eq('name', 'Flora')
  .select()

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

console.log('✅ Updated:', data)
console.log('\n🎉 Success! Now hard refresh the browser (Cmd+Shift+R)')
