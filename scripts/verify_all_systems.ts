import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
)

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

const results: TestResult[] = []

function log(result: TestResult) {
  results.push(result)
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${result.name}: ${result.message}`)
  if (result.details) console.log('   ', JSON.stringify(result.details, null, 2))
}

async function verifyAllSystems() {
  console.log('🔍 COMPREHENSIVE SYSTEM VERIFICATION\n')
  console.log('=' .repeat(80))

  // ============================================
  // 1. CORE TABLES VERIFICATION
  // ============================================
  console.log('\n📊 1. CORE DATABASE TABLES\n')

  const coreTables = [
    'vendors',
    'users',
    'customers',
    'products',
    'categories',
    'orders',
    'locations',
    'tv_devices',
    'tv_display_profiles',
    'pos_sessions',
    'pos_registers',
    'email_campaigns',
    'campaign_channels',
    'customer_segments',
    'wallet_passes'
  ]

  for (const table of coreTables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    log({
      name: `Table: ${table}`,
      status: error ? 'fail' : 'pass',
      message: error ? error.message : 'Accessible',
      details: error ? { code: error.code } : { count: data?.length ?? 0 }
    })
  }

  // ============================================
  // 2. MARKETING STUDIO VERIFICATION
  // ============================================
  console.log('\n📧 2. MARKETING STUDIO\n')

  // Check email_campaigns columns
  const { data: campaigns, error: campError } = await supabase
    .from('email_campaigns')
    .select('id, name, objective, channels, timezone')
    .limit(3)

  log({
    name: 'email_campaigns.objective column',
    status: campError ? 'fail' : campaigns?.[0]?.objective ? 'pass' : 'warning',
    message: campError ? campError.message : campaigns?.[0]?.objective ? 'Column exists with data' : 'Column exists but no data',
    details: { sample: campaigns?.[0] }
  })

  log({
    name: 'email_campaigns.channels column',
    status: campError ? 'fail' : campaigns?.[0]?.channels ? 'pass' : 'warning',
    message: campError ? campError.message : campaigns?.[0]?.channels ? 'Column exists with data' : 'Column exists but no data',
    details: { sample: campaigns?.[0]?.channels }
  })

  // Check campaign_channels table structure
  const { data: channelTest, error: channelError } = await supabase
    .from('campaign_channels')
    .select('*')
    .limit(1)

  log({
    name: 'campaign_channels table',
    status: channelError ? 'fail' : 'pass',
    message: channelError ? channelError.message : `Table accessible (${channelTest?.length ?? 0} rows)`,
  })

  // Check customer_segments.type column
  const { data: segments, error: segError } = await supabase
    .from('customer_segments')
    .select('id, name, type')
    .limit(1)

  log({
    name: 'customer_segments.type column',
    status: segError ? 'fail' : 'pass',
    message: segError ? segError.message : 'Column exists',
    details: { hasData: !!segments?.length }
  })

  // ============================================
  // 3. TV DISPLAY SYSTEM VERIFICATION
  // ============================================
  console.log('\n📺 3. TV DISPLAY SYSTEM\n')

  // Check tv_display_profiles.screen_orientation
  const { data: profiles, error: profileError } = await supabase
    .from('tv_display_profiles')
    .select('id, name, screen_orientation')
    .limit(3)

  log({
    name: 'tv_display_profiles.screen_orientation',
    status: profileError ? 'fail' : 'pass',
    message: profileError ? profileError.message : 'Column exists',
    details: { sample: profiles?.[0] }
  })

  // Check tv_devices.screen_orientation
  const { data: devices, error: deviceError } = await supabase
    .from('tv_devices')
    .select('id, device_name, screen_orientation')
    .limit(3)

  log({
    name: 'tv_devices.screen_orientation',
    status: deviceError ? 'fail' : 'pass',
    message: deviceError ? deviceError.message : 'Column exists',
    details: { sample: devices?.[0] }
  })

  // Check tv menus exist
  const { data: menus, error: menuError } = await supabase
    .from('tv_display_profiles')
    .select('id, name, categories, theme')
    .eq('is_active', true)
    .limit(5)

  log({
    name: 'Active TV menus',
    status: menuError ? 'fail' : menus && menus.length > 0 ? 'pass' : 'warning',
    message: menuError ? menuError.message : `${menus?.length ?? 0} active menus`,
    details: { menus: menus?.map(m => ({ id: m.id, name: m.name })) }
  })

  // ============================================
  // 4. POS SYSTEM VERIFICATION
  // ============================================
  console.log('\n💰 4. POS SYSTEM\n')

  // Check registers
  const { data: registers, error: regError } = await supabase
    .from('pos_registers')
    .select('id, register_number, location_id, is_active')
    .eq('is_active', true)
    .limit(5)

  log({
    name: 'Active POS registers',
    status: regError ? 'fail' : registers && registers.length > 0 ? 'pass' : 'warning',
    message: regError ? regError.message : `${registers?.length ?? 0} active registers`,
  })

  // Check for recent sessions
  const { data: sessions, error: sessError } = await supabase
    .from('pos_sessions')
    .select('id, register_id, status, opened_at')
    .order('opened_at', { ascending: false })
    .limit(5)

  log({
    name: 'Recent POS sessions',
    status: sessError ? 'fail' : sessions && sessions.length > 0 ? 'pass' : 'warning',
    message: sessError ? sessError.message : `${sessions?.length ?? 0} recent sessions`,
    details: { latest: sessions?.[0] }
  })

  // ============================================
  // 5. INVENTORY SYSTEM VERIFICATION
  // ============================================
  console.log('\n📦 5. INVENTORY SYSTEM\n')

  // Check products with inventory
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, manage_inventory')
    .eq('manage_inventory', true)
    .limit(5)

  log({
    name: 'Products with inventory tracking',
    status: prodError ? 'fail' : products && products.length > 0 ? 'pass' : 'warning',
    message: prodError ? prodError.message : `${products?.length ?? 0} products with inventory`,
  })

  // Check locations for inventory
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name, is_active')
    .eq('is_active', true)
    .limit(5)

  log({
    name: 'Active locations',
    status: locError ? 'fail' : locations && locations.length > 0 ? 'pass' : 'warning',
    message: locError ? locError.message : `${locations?.length ?? 0} active locations`,
  })

  // ============================================
  // 6. CUSTOMER SYSTEM VERIFICATION
  // ============================================
  console.log('\n👥 6. CUSTOMER SYSTEM\n')

  // Check total customers
  const { count: customerCount, error: custError } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })

  log({
    name: 'Total customers',
    status: custError ? 'fail' : (customerCount ?? 0) > 0 ? 'pass' : 'warning',
    message: custError ? custError.message : `${customerCount ?? 0} customers in database`,
  })

  // Check recent customers
  const { data: recentCustomers, error: recError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email')
    .order('created_at', { ascending: false })
    .limit(5)

  log({
    name: 'Recent customers',
    status: recError ? 'fail' : recentCustomers && recentCustomers.length > 0 ? 'pass' : 'warning',
    message: recError ? recError.message : `${recentCustomers?.length ?? 0} recent customers`,
  })

  // ============================================
  // 7. PRODUCT CATALOG VERIFICATION
  // ============================================
  console.log('\n🌿 7. PRODUCT CATALOG\n')

  // Check active products
  const { count: productCount, error: prodCountError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  log({
    name: 'Active products',
    status: prodCountError ? 'fail' : (productCount ?? 0) > 0 ? 'pass' : 'warning',
    message: prodCountError ? prodCountError.message : `${productCount ?? 0} active products`,
  })

  // Check categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .limit(10)

  log({
    name: 'Active categories',
    status: catError ? 'fail' : categories && categories.length > 0 ? 'pass' : 'warning',
    message: catError ? catError.message : `${categories?.length ?? 0} active categories`,
    details: { categories: categories?.map(c => c.slug) }
  })

  // ============================================
  // 8. ORDERS SYSTEM VERIFICATION
  // ============================================
  console.log('\n🛒 8. ORDERS SYSTEM\n')

  // Check recent orders
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, total, status')
    .order('created_at', { ascending: false })
    .limit(5)

  log({
    name: 'Recent orders',
    status: orderError ? 'fail' : orders && orders.length > 0 ? 'pass' : 'warning',
    message: orderError ? orderError.message : `${orders?.length ?? 0} recent orders`,
  })

  // ============================================
  // 9. ENVIRONMENT VERIFICATION
  // ============================================
  console.log('\n⚙️ 9. ENVIRONMENT VARIABLES\n')

  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY'
  ]

  for (const envVar of envVars) {
    const exists = !!process.env[envVar]
    log({
      name: `ENV: ${envVar}`,
      status: exists ? 'pass' : 'fail',
      message: exists ? 'Set' : 'Missing',
      details: exists ? { length: process.env[envVar]!.length } : undefined
    })
  }

  // ============================================
  // 10. SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 VERIFICATION SUMMARY\n')

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warning').length
  const total = results.length

  console.log(`✅ Passed:   ${passed}/${total}`)
  console.log(`❌ Failed:   ${failed}/${total}`)
  console.log(`⚠️  Warnings: ${warnings}/${total}`)

  const successRate = ((passed / total) * 100).toFixed(1)
  console.log(`\n📈 Success Rate: ${successRate}%`)

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }

  if (warnings > 0) {
    console.log('\n⚠️  WARNINGS:')
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(80))

  if (failed === 0) {
    console.log('\n🎉 ALL CRITICAL SYSTEMS OPERATIONAL!\n')
  } else {
    console.log('\n⚠️  SOME SYSTEMS NEED ATTENTION\n')
  }

  return {
    passed,
    failed,
    warnings,
    total,
    successRate: parseFloat(successRate),
    results
  }
}

verifyAllSystems().then(summary => {
  process.exit(summary.failed > 0 ? 1 : 0)
})
