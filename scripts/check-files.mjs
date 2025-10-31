#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const appId = 'dd4e23d0-1f85-4855-bdc6-be4e807566c1'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('🔍 Checking files in database for app:', appId)

const { data: files, error } = await supabase
  .from('app_files')
  .select('*')
  .eq('app_id', appId)

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

console.log('✅ Found', files?.length || 0, 'files')
files?.forEach(f => {
  console.log(`  - ${f.filepath} (${f.content?.length || 0} bytes)`)
})
