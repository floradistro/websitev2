#!/usr/bin/env node

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
const appId = 'dd4e23d0-1f85-4855-bdc6-be4e807566c1'

console.log('🔄 Updating via REST API...')

const response = await fetch(`${SUPABASE_URL}/rest/v1/vendor_apps?id=eq.${appId}`, {
  method: 'PATCH',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    preview_url: null,
    preview_machine_id: null,
    preview_status: null,
    preview_last_activity: null
  })
})

const text = await response.text()
console.log('Status:', response.status)
console.log('Response:', text)

if (response.ok) {
  console.log('\n✅ Updated successfully!')
} else {
  console.log('\n❌ Update failed')
}
