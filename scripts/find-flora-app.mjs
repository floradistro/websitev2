#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('🔍 Searching for Flora app by ID...')

const { data: byId, error: idError } = await supabase
  .from('vendor_apps')
  .select('*')
  .eq('id', 'dd4e23d0-1f85-4855-bdc6-be4e807566c1')

console.log('\nBy ID:', byId)
console.log('Error:', idError)

console.log('\n🔍 Searching for Flora app by name...')

const { data: byName, error: nameError } = await supabase
  .from('vendor_apps')
  .select('*')
  .eq('name', 'Flora')

console.log('\nBy Name:', byName)
console.log('Error:', nameError)

console.log('\n🔍 Getting all apps...')

const { data: all, error: allError } = await supabase
  .from('vendor_apps')
  .select('id, name, vendor_id')

console.log('\nAll apps:', all)
console.log('Error:', allError)
