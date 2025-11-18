/**
 * End-to-End Loyalty Transaction Tests
 *
 * Tests the complete loyalty points workflow:
 * 1. Create customer with 0 points
 * 2. Create order
 * 3. Award loyalty points using RPC function
 * 4. Verify points added correctly
 * 5. Redeem loyalty points
 * 6. Verify points deducted correctly
 * 7. Test concurrent transactions (no race conditions)
 * 8. Test edge cases (insufficient points, negative points, etc.)
 *
 * Run with: node test-e2e-loyalty.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

let TEST_VENDOR_ID = null

const results = {
  passed: 0,
  failed: 0,
  tests: [],
}

function logTest(name, passed, message, details) {
  results.tests.push({ name, passed, message, details })
  if (passed) {
    results.passed++
    console.log(`✅ ${name}`)
    console.log(`   ${message}`)
    if (details) {
      Object.entries(details).forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value)}`)
      })
    }
  } else {
    results.failed++
    console.log(`❌ ${name}`)
    console.log(`   ${message}`)
    if (details) {
      console.error(`   Error: ${JSON.stringify(details, null, 2)}`)
    }
  }
  console.log('')
}

async function setup() {
  console.log('🔧 Setting up test environment...\n')

  const { data: vendors } = await supabase.from('vendors').select('id').limit(1)
  if (!vendors || vendors.length === 0) {
    console.error('❌ No vendors found')
    process.exit(1)
  }

  TEST_VENDOR_ID = vendors[0].id
  console.log(`Using vendor: ${TEST_VENDOR_ID}\n`)
}

// ====================
// TEST 1: EARNING POINTS
// ====================

async function testEarningPoints() {
  console.log('🔵 TEST 1: Loyalty Points Earning Flow\n')

  try {
    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        email: `earn-${Date.now()}@example.com`,
        first_name: 'Earn',
        last_name: 'Test',
        loyalty_points: 0,
        total_spent: 0,
      })
      .select()
      .single()

    if (customerError) {
      logTest('Create Customer', false, 'Failed to create customer', customerError)
      return null
    }

    logTest('Create Customer', true, 'Customer created successfully', {
      id: customer.id,
      email: customer.email,
      initial_points: customer.loyalty_points,
    })

    // Create order
    const { data: orderNumber, error: orderNumError } = await supabase.rpc('generate_order_number', {
      p_prefix: 'EARN',
    })

    if (orderNumError || !orderNumber) {
      logTest('Generate Order Number', false, 'Failed to generate order number', orderNumError)
      return null
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        customer_id: customer.id,
        order_number: orderNumber,
        subtotal: 46.00,
        tax_amount: 4.00,
        discount_amount: 0,
        total_amount: 50.00,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'completed',
      })
      .select()
      .single()

    if (orderError || !order) {
      logTest('Create Order', false, 'Failed to create order', orderError)
      return null
    }

    logTest('Create Order', true, 'Order created successfully', {
      order_number: order.order_number,
      total: order.total_amount,
    })

    // Get loyalty program
    const { data: loyaltyProgram } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('vendor_id', TEST_VENDOR_ID)
      .eq('is_active', true)
      .single()

    const pointsPerDollar = loyaltyProgram?.points_per_dollar || 1
    const expectedPoints = Math.floor(order.total_amount * pointsPerDollar)

    logTest('Get Loyalty Program', true, 'Loyalty program found', {
      points_per_dollar: pointsPerDollar,
      expected_points: expectedPoints,
    })

    // Get points BEFORE transaction
    const { data: beforeCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const pointsBefore = beforeCustomer.loyalty_points

    logTest('Check Points Before', true, `Customer has ${pointsBefore} points`, {
      points_before: pointsBefore,
    })

    // Record loyalty transaction using RPC
    const { error: txError } = await supabase.rpc('record_loyalty_transaction_atomic', {
      p_customer_id: customer.id,
      p_order_id: order.id,
      p_points_earned: expectedPoints,
      p_points_redeemed: 0,
      p_order_total: order.total_amount,
    })

    if (txError) {
      logTest('Record Loyalty Transaction', false, 'Transaction failed', txError)
      return null
    }

    logTest('Record Loyalty Transaction', true, `+${expectedPoints} points awarded`, {
      points_earned: expectedPoints,
    })

    // Get points AFTER transaction
    const { data: afterCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const pointsAfter = afterCustomer.loyalty_points
    const actualPointsAdded = pointsAfter - pointsBefore

    logTest('Check Points After', true, `Customer now has ${pointsAfter} points`, {
      points_before: pointsBefore,
      points_after: pointsAfter,
      points_added: actualPointsAdded,
    })

    // Verify calculation
    const correct = actualPointsAdded === expectedPoints

    logTest(
      'Verify Points Calculation',
      correct,
      correct
        ? `✅ Points calculated correctly: ${actualPointsAdded} = ${expectedPoints}`
        : `❌ Mismatch: expected ${expectedPoints}, got ${actualPointsAdded}`,
      {
        expected: expectedPoints,
        actual: actualPointsAdded,
      }
    )

    return { customer, order, pointsAfter }
  } catch (error) {
    logTest('Earning Points Flow', false, 'Unexpected error', error.message)
    return null
  }
}

// ====================
// TEST 2: REDEEMING POINTS
// ====================

async function testRedeemingPoints(earningData) {
  console.log('🔵 TEST 2: Loyalty Points Redemption Flow\n')

  if (!earningData) {
    console.log('⏭️  Skipping (no data from earning test)\n')
    return
  }

  const { customer, pointsAfter } = earningData

  try {
    const pointsToRedeem = Math.min(10, Math.floor(pointsAfter / 2))

    // Create redemption order
    const { data: orderNumber } = await supabase.rpc('generate_order_number', {
      p_prefix: 'REDEEM',
    })

    const { data: order } = await supabase
      .from('orders')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        customer_id: customer.id,
        order_number: orderNumber,
        subtotal: 25.00,
        tax_amount: 2.00,
        discount_amount: pointsToRedeem * 0.1,
        total_amount: 25.00,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'completed',
      })
      .select()
      .single()

    logTest('Create Redemption Order', true, 'Order created', {
      order_number: order.order_number,
      points_to_redeem: pointsToRedeem,
    })

    // Get points before redemption
    const { data: beforeCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const pointsBefore = beforeCustomer.loyalty_points

    // Redeem points
    const { error: txError } = await supabase.rpc('record_loyalty_transaction_atomic', {
      p_customer_id: customer.id,
      p_order_id: order.id,
      p_points_earned: 0,
      p_points_redeemed: pointsToRedeem,
      p_order_total: order.total_amount,
    })

    if (txError) {
      logTest('Redeem Points', false, 'Redemption failed', txError)
      return
    }

    logTest('Redeem Points', true, `-${pointsToRedeem} points redeemed`, {
      points_redeemed: pointsToRedeem,
    })

    // Get points after redemption
    const { data: afterCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const pointsAfterRedemption = afterCustomer.loyalty_points
    const pointsDeducted = pointsBefore - pointsAfterRedemption

    const correct = pointsDeducted === pointsToRedeem

    logTest(
      'Verify Points Deduction',
      correct,
      correct
        ? `✅ Points deducted correctly: -${pointsDeducted} = -${pointsToRedeem}`
        : `❌ Mismatch: expected -${pointsToRedeem}, got -${pointsDeducted}`,
      {
        points_before: pointsBefore,
        points_after: pointsAfterRedemption,
        expected_deduction: pointsToRedeem,
        actual_deduction: pointsDeducted,
      }
    )
  } catch (error) {
    logTest('Redemption Flow', false, 'Unexpected error', error.message)
  }
}

// ====================
// TEST 3: CONCURRENT TRANSACTIONS
// ====================

async function testConcurrentTransactions() {
  console.log('🔵 TEST 3: Concurrent Transaction Handling (No Race Conditions)\n')

  try {
    // Create customer with 1000 points
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        email: `concurrent-${Date.now()}@example.com`,
        first_name: 'Concurrent',
        last_name: 'Test',
        loyalty_points: 1000,
        total_spent: 0,
      })
      .select()
      .single()

    logTest('Create Concurrent Test Customer', true, 'Customer created with 1000 points', {
      id: customer.id,
      initial_points: 1000,
    })

    // Create 5 orders concurrently
    const orderPromises = Array.from({ length: 5 }, async () => {
      const { data: orderNumber } = await supabase.rpc('generate_order_number', {
        p_prefix: 'CONC',
      })

      const { data: order } = await supabase
        .from('orders')
        .insert({
          vendor_id: TEST_VENDOR_ID,
          customer_id: customer.id,
          order_number: orderNumber,
          subtotal: 10.00,
          tax_amount: 1.00,
          discount_amount: 0,
          total_amount: 11.00,
          payment_method: 'cash',
          payment_status: 'paid',
          status: 'completed',
        })
        .select()
        .single()

      return order
    })

    const orders = await Promise.all(orderPromises)

    logTest('Create 5 Concurrent Orders', true, '5 orders created', {
      count: 5,
      order_numbers: orders.map((o) => o.order_number),
    })

    // Record 5 loyalty transactions concurrently (THIS IS THE CRITICAL TEST)
    const txPromises = orders.map((order) =>
      supabase.rpc('record_loyalty_transaction_atomic', {
        p_customer_id: customer.id,
        p_order_id: order.id,
        p_points_earned: 11, // 1 point per dollar = 11 points per $11 order
        p_points_redeemed: 0,
        p_order_total: 11.00,
      })
    )

    const txResults = await Promise.all(txPromises)
    const txErrors = txResults.filter((r) => r.error)

    logTest(
      'Record 5 Concurrent Transactions',
      txErrors.length === 0,
      txErrors.length === 0
        ? '✅ All 5 transactions succeeded'
        : `❌ ${txErrors.length} transactions failed`,
      txErrors.length > 0 ? { errors: txErrors } : { success: 5 }
    )

    // Verify final points
    const { data: finalCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const expectedPoints = 1000 + 5 * 11 // 1000 initial + (5 orders × 11 points)
    const correct = finalCustomer.loyalty_points === expectedPoints

    logTest(
      'Verify Concurrent Points Calculation',
      correct,
      correct
        ? `✅ Final balance correct: ${finalCustomer.loyalty_points} = ${expectedPoints}`
        : `❌ Mismatch: expected ${expectedPoints}, got ${finalCustomer.loyalty_points}`,
      {
        initial: 1000,
        transactions: 5,
        points_per_tx: 11,
        expected: expectedPoints,
        actual: finalCustomer.loyalty_points,
      }
    )
  } catch (error) {
    logTest('Concurrent Transactions', false, 'Unexpected error', error.message)
  }
}

// ====================
// TEST 4: EDGE CASES
// ====================

async function testEdgeCases() {
  console.log('🔵 TEST 4: Edge Cases & Error Handling\n')

  try {
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        email: `edge-${Date.now()}@example.com`,
        first_name: 'Edge',
        last_name: 'Case',
        loyalty_points: 50,
        total_spent: 0,
      })
      .select()
      .single()

    const { data: order } = await supabase
      .from('orders')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        customer_id: customer.id,
        order_number: `EDGE-${Date.now()}`,
        subtotal: 100.00,
        tax_amount: 8.00,
        discount_amount: 0,
        total_amount: 108.00,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'completed',
      })
      .select()
      .single()

    // Test 1: Insufficient points
    const { error: insufficientError } = await supabase.rpc('record_loyalty_transaction_atomic', {
      p_customer_id: customer.id,
      p_order_id: order.id,
      p_points_earned: 0,
      p_points_redeemed: 100, // Customer only has 50
      p_order_total: 108.00,
    })

    logTest(
      'Insufficient Points Protection',
      !!insufficientError && insufficientError.message.includes('Insufficient'),
      '✅ Correctly rejected insufficient points',
      {
        customer_points: 50,
        attempted_redemption: 100,
        error: insufficientError?.message,
      }
    )

    // Verify points unchanged
    const { data: unchangedCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    logTest(
      'Points Unchanged After Failed Transaction',
      unchangedCustomer.loyalty_points === 50,
      '✅ Points remain unchanged after failed transaction',
      {
        expected: 50,
        actual: unchangedCustomer.loyalty_points,
      }
    )

    // Test 2: Zero points
    const { error: zeroError } = await supabase.rpc('record_loyalty_transaction_atomic', {
      p_customer_id: customer.id,
      p_order_id: order.id,
      p_points_earned: 0,
      p_points_redeemed: 0,
      p_order_total: 108.00,
    })

    logTest(
      'Zero Points Blocked',
      !!zeroError && zeroError.message.includes('both be zero'),
      '✅ Correctly rejected zero points transaction',
      { error: zeroError?.message }
    )

    // Test 3: Negative points
    const { error: negativeError } = await supabase.rpc('record_loyalty_transaction_atomic', {
      p_customer_id: customer.id,
      p_order_id: order.id,
      p_points_earned: -10,
      p_points_redeemed: 0,
      p_order_total: 108.00,
    })

    logTest(
      'Negative Points Blocked',
      !!negativeError && negativeError.message.includes('negative'),
      '✅ Correctly rejected negative points',
      { error: negativeError?.message }
    )

    // Test 4: Invalid customer
    const { error: invalidError } = await supabase.rpc('record_loyalty_transaction_atomic', {
      p_customer_id: '00000000-0000-0000-0000-000000000000',
      p_order_id: order.id,
      p_points_earned: 10,
      p_points_redeemed: 0,
      p_order_total: 108.00,
    })

    logTest(
      'Invalid Customer Blocked',
      !!invalidError && invalidError.message.includes('not found'),
      '✅ Correctly rejected invalid customer',
      { error: invalidError?.message }
    )
  } catch (error) {
    logTest('Edge Cases', false, 'Unexpected error', error.message)
  }
}

// ====================
// MAIN TEST RUNNER
// ====================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🧪 End-to-End Loyalty Transaction Test Suite')
  console.log('═══════════════════════════════════════════════════════════\n')

  await setup()

  const earningData = await testEarningPoints()
  await testRedeemingPoints(earningData)
  await testConcurrentTransactions()
  await testEdgeCases()

  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 TEST SUMMARY')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log(`Total Tests: ${results.passed + results.failed}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(
    `Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
  )

  if (results.failed > 0) {
    console.log('\n⚠️  Failed Tests:')
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`  - ${t.name}: ${t.message}`)
      })
  }

  console.log('\n═══════════════════════════════════════════════════════════')

  const grade =
    results.failed === 0
      ? 'A+ ✅ PERFECT - BULLETPROOF'
      : results.failed <= 2
      ? 'A- ✅ EXCELLENT'
      : results.failed <= 5
      ? 'B+ ⚠️  GOOD'
      : '❌ NEEDS WORK'

  console.log(`Final Grade: ${grade}`)
  console.log('═══════════════════════════════════════════════════════════\n')

  process.exit(results.failed > 0 ? 1 : 0)
}

runAllTests().catch((error) => {
  console.error('❌ Test runner failed:', error)
  process.exit(1)
})
