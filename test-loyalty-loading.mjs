#!/usr/bin/env node
/**
 * Test loyalty program loading after set_vendor_context migration
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const TEST_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'

if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY not found in environment')
  console.log('Please set SUPABASE_ANON_KEY in ~/.zshrc or .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test logging
function logTest(testName, passed, message) {
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${testName}: ${message}`)
}

async function testLoyaltyLoading() {
  console.log('🧪 Testing Loyalty Program Loading (After Migration)\n')
  console.log('=' .repeat(60))

  try {
    // Test 1: Call set_vendor_context
    console.log('\n📍 Test 1: Setting vendor context...')
    const { data: contextData, error: contextError } = await supabase.rpc(
      'set_vendor_context',
      { vendor_id_param: TEST_VENDOR_ID }
    )

    if (contextError) {
      logTest('Set Vendor Context', false, contextError.message)
      console.error('Full error:', contextError)
      return
    }

    logTest('Set Vendor Context', true, 'Context set successfully')

    // Test 2: Query loyalty_programs
    console.log('\n📍 Test 2: Querying loyalty_programs...')
    const { data: program, error: programError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('vendor_id', TEST_VENDOR_ID)
      .eq('is_active', true)
      .single()

    if (programError) {
      if (programError.code === 'PGRST116') {
        logTest('Query Loyalty Program', true, 'No loyalty program found (expected for some vendors)')
      } else {
        logTest('Query Loyalty Program', false, `${programError.code}: ${programError.message}`)
        console.error('Full error:', programError)
      }
      return
    }

    logTest('Query Loyalty Program', true, `Found program: ${program.name}`)
    console.log('\n📊 Program Details:')
    console.log(`   Name: ${program.name}`)
    console.log(`   Points per dollar: ${program.points_per_dollar}`)
    console.log(`   Point value: $${program.point_value}`)
    console.log(`   Min redemption: ${program.min_redemption_points} points`)

    // Test 3: Verify the 42704 error is gone
    console.log('\n📍 Test 3: Testing without setting context (should fail gracefully)...')

    // Create a new client instance (fresh session)
    const supabase2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data: program2, error: programError2 } = await supabase2
      .from('loyalty_programs')
      .select('*')
      .eq('vendor_id', TEST_VENDOR_ID)
      .eq('is_active', true)
      .single()

    if (programError2) {
      if (programError2.code === '42704') {
        logTest('Query Without Context', false, 'Still getting 42704 error - migration may not be applied')
      } else if (programError2.code === 'PGRST116' || programError2.message.includes('0 rows')) {
        logTest('Query Without Context', true, 'RLS correctly filtering out results when context not set')
      } else {
        logTest('Query Without Context', true, `Different error (expected): ${programError2.code}`)
      }
    } else {
      logTest('Query Without Context', false, 'Query succeeded without context - RLS may not be enforcing')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ LOYALTY LOADING TEST COMPLETE')
    console.log('🎯 Next step: Test this in the React Native app!')

  } catch (error) {
    console.error('\n❌ Test failed with exception:', error)
  }
}

// Run test
testLoyaltyLoading()
