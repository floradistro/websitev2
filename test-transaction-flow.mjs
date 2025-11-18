/**
 * End-to-End Transaction Flow Tests
 *
 * Tests the complete workflow:
 * 1. Create customer
 * 2. Create order with order items
 * 3. Record loyalty transaction
 * 4. Verify customer points updated correctly
 * 5. Verify all data persisted correctly
 * 6. Test redemption flow
 * 7. Test concurrent transactions
 *
 * Run with: node test-transaction-flow.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test vendor ID - will be fetched from database
let TEST_VENDOR_ID = null
let TEST_PRODUCT_ID = null

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
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`)
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

// ====================
// SETUP
// ====================

async function setup() {
  console.log('🔧 Setting up test environment...\n')

  // Get a vendor
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .limit(1)

  if (vendorError || !vendors || vendors.length === 0) {
    console.error('❌ No vendors found in database')
    process.exit(1)
  }

  TEST_VENDOR_ID = vendors[0].id
  console.log(`Using vendor: ${TEST_VENDOR_ID}`)

  // Get any product from database (we just need an ID for order items)
  let { data: products, error: productError } = await supabase
    .from('products')
    .select('id, name')
    .limit(1)

  if (productError || !products || products.length === 0) {
    console.log('⚠️  No products found - will skip order items tests')
    TEST_PRODUCT_ID = null
  } else {
    TEST_PRODUCT_ID = products[0].id
    console.log(`Using product: ${products[0].name || 'Unknown'} (ID: ${products[0].id})`)
  }

  console.log('')
}

// ====================
// TEST 1: COMPLETE ORDER FLOW
// ====================

async function testCompleteOrderFlow() {
  console.log('🔵 TEST 1: Complete Order Creation Flow\n')

  const testEmail = `test-${Date.now()}@example.com`

  try {
    // Step 1: Create customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        email: testEmail,
        first_name: 'Test',
        last_name: 'Customer',
        loyalty_points: 0,
        total_spent: 0,
      })
      .select()
      .single()

    if (customerError) {
      logTest(
        'Create Test Customer',
        false,
        'Failed to create customer',
        customerError
      )
      return null
    }

    logTest(
      'Create Test Customer',
      true,
      `Customer created: ${customer.email}`,
      { id: customer.id, email: customer.email, initial_points: customer.loyalty_points }
    )

    // Step 2: Generate order number
    const { data: orderNumber, error: orderNumberError } = await supabase.rpc(
      'generate_order_number',
      { p_prefix: 'TEST' }
    )

    if (orderNumberError) {
      logTest(
        'Generate Order Number',
        false,
        'Failed to generate order number',
        orderNumberError
      )
      return null
    }

    logTest(
      'Generate Order Number',
      true,
      `Order number generated: ${orderNumber}`,
      { order_number: orderNumber }
    )

    // Step 3: Create order
    const orderTotal = 50.00
    const taxAmount = 4.00
    const subtotal = 46.00

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        customer_id: customer.id,
        order_number: orderNumber,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: orderTotal,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'completed',
      })
      .select()
      .single()

    if (orderError) {
      logTest(
        'Create Order',
        false,
        'Failed to create order',
        orderError
      )
      return null
    }

    logTest(
      'Create Order',
      true,
      `Order created: ${order.order_number}`,
      {
        id: order.id,
        order_number: order.order_number,
        total: order.total_amount,
        customer_id: order.customer_id,
      }
    )

    // Step 4: Create order items (if product available)
    let orderItems = []
    if (TEST_PRODUCT_ID) {
      const { data: items, error: orderItemsError } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: order.id,
            product_id: TEST_PRODUCT_ID,
            quantity: 2,
            unit_price: 23.00,
            subtotal: 46.00,
            tax_amount: 4.00,
            discount_amount: 0,
            total: 50.00,
          },
        ])
        .select()

      if (orderItemsError) {
        logTest(
          'Create Order Items',
          false,
          'Failed to create order items',
          orderItemsError
        )
        return null
      }

      orderItems = items
      logTest(
        'Create Order Items',
        true,
        `${orderItems.length} order item(s) created`,
        { count: orderItems.length, total: orderItems.reduce((sum, item) => sum + item.total, 0) }
      )
    } else {
      logTest(
        'Create Order Items',
        true,
        'Skipped (no product available)',
        null
      )
    }

    return { customer, order, orderItems }
  } catch (error) {
    logTest(
      'Complete Order Flow',
      false,
      'Unexpected error in order flow',
      error.message
    )
    return null
  }
}

// ====================
// TEST 2: LOYALTY POINTS EARNING
// ====================

async function testLoyaltyPointsEarning(orderData) {
  console.log('🔵 TEST 2: Loyalty Points Earning Flow\n')

  if (!orderData) {
    console.log('⏭️  Skipping (no order data from previous test)\n')
    return null
  }

  const { customer, order } = orderData

  try {
    // Get loyalty program
    const { data: loyaltyProgram, error: programError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('vendor_id', TEST_VENDOR_ID)
      .eq('is_active', true)
      .single()

    if (programError) {
      logTest(
        'Get Loyalty Program',
        false,
        'Failed to get loyalty program',
        programError
      )
      return null
    }

    const pointsPerDollar = loyaltyProgram.points_per_dollar || 1
    const expectedPoints = Math.floor(order.total_amount * pointsPerDollar)

    logTest(
      'Get Loyalty Program',
      true,
      `Program found: ${pointsPerDollar} points per dollar`,
      {
        program_id: loyaltyProgram.id,
        points_per_dollar: pointsPerDollar,
        expected_points: expectedPoints,
      }
    )

    // Get customer points BEFORE transaction
    const { data: customerBefore, error: beforeError } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    if (beforeError) {
      logTest(
        'Get Customer Points (Before)',
        false,
        'Failed to get customer points',
        beforeError
      )
      return null
    }

    const pointsBefore = customerBefore.loyalty_points

    logTest(
      'Get Customer Points (Before)',
      true,
      `Customer has ${pointsBefore} points before transaction`,
      { customer_id: customer.id, points_before: pointsBefore }
    )

    // Record loyalty transaction
    const { error: transactionError } = await supabase.rpc(
      'record_loyalty_transaction_atomic',
      {
        p_customer_id: customer.id,
        p_order_id: order.id,
        p_points_earned: expectedPoints,
        p_points_redeemed: 0,
        p_order_total: order.total_amount,
      }
    )

    if (transactionError) {
      logTest(
        'Record Loyalty Transaction',
        false,
        'Failed to record loyalty transaction',
        transactionError
      )
      return null
    }

    logTest(
      'Record Loyalty Transaction',
      true,
      `Transaction recorded: +${expectedPoints} points`,
      {
        customer_id: customer.id,
        order_id: order.id,
        points_earned: expectedPoints,
      }
    )

    // Get customer points AFTER transaction
    const { data: customerAfter, error: afterError } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    if (afterError) {
      logTest(
        'Get Customer Points (After)',
        false,
        'Failed to get customer points after transaction',
        afterError
      )
      return null
    }

    const pointsAfter = customerAfter.loyalty_points
    const actualPointsAdded = pointsAfter - pointsBefore

    logTest(
      'Get Customer Points (After)',
      true,
      `Customer now has ${pointsAfter} points`,
      {
        customer_id: customer.id,
        points_before: pointsBefore,
        points_after: pointsAfter,
        points_added: actualPointsAdded,
      }
    )

    // Verify points were added correctly
    const pointsCorrect = actualPointsAdded === expectedPoints

    logTest(
      'Verify Points Calculation',
      pointsCorrect,
      pointsCorrect
        ? `Points calculated correctly: ${actualPointsAdded} = ${expectedPoints} ✅`
        : `Points mismatch: expected ${expectedPoints}, got ${actualPointsAdded} ❌`,
      {
        expected: expectedPoints,
        actual: actualPointsAdded,
        order_total: order.total_amount,
        points_per_dollar: pointsPerDollar,
      }
    )

    // Verify loyalty transaction was recorded in database
    const { data: loyaltyTransaction, error: txError } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('order_id', order.id)
      .single()

    if (txError) {
      logTest(
        'Verify Transaction Record',
        false,
        'Loyalty transaction not found in database',
        txError
      )
      return null
    }

    const transactionCorrect =
      loyaltyTransaction.points_earned === expectedPoints &&
      loyaltyTransaction.points_redeemed === 0 &&
      loyaltyTransaction.customer_id === customer.id

    logTest(
      'Verify Transaction Record',
      transactionCorrect,
      'Loyalty transaction record verified',
      {
        id: loyaltyTransaction.id,
        customer_id: loyaltyTransaction.customer_id,
        order_id: loyaltyTransaction.order_id,
        points_earned: loyaltyTransaction.points_earned,
        points_redeemed: loyaltyTransaction.points_redeemed,
        transaction_type: loyaltyTransaction.transaction_type,
      }
    )

    return { customer, order, pointsAfter, loyaltyProgram }
  } catch (error) {
    logTest(
      'Loyalty Points Earning Flow',
      false,
      'Unexpected error in loyalty flow',
      error.message
    )
    return null
  }
}

// ====================
// TEST 3: LOYALTY POINTS REDEMPTION
// ====================

async function testLoyaltyPointsRedemption(loyaltyData) {
  console.log('🔵 TEST 3: Loyalty Points Redemption Flow\n')

  if (!loyaltyData) {
    console.log('⏭️  Skipping (no loyalty data from previous test)\n')
    return
  }

  const { customer, pointsAfter } = loyaltyData

  try {
    // Create a new order for redemption
    const { data: orderNumber, error: orderNumberError } = await supabase.rpc(
      'generate_order_number',
      { p_prefix: 'REDEEM' }
    )

    if (orderNumberError) {
      logTest(
        'Generate Redemption Order Number',
        false,
        'Failed to generate order number',
        orderNumberError
      )
      return
    }

    const redemptionOrderTotal = 25.00
    const pointsToRedeem = Math.min(10, Math.floor(pointsAfter / 2)) // Redeem half of points or 10, whichever is less

    const { data: redemptionOrder, error: redemptionOrderError } = await supabase
      .from('orders')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        customer_id: customer.id,
        order_number: orderNumber,
        subtotal: redemptionOrderTotal,
        tax_amount: 2.00,
        discount_amount: pointsToRedeem * 0.1, // Assuming 10 cents per point
        total_amount: redemptionOrderTotal,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'completed',
      })
      .select()
      .single()

    if (redemptionOrderError) {
      logTest(
        'Create Redemption Order',
        false,
        'Failed to create redemption order',
        redemptionOrderError
      )
      return
    }

    logTest(
      'Create Redemption Order',
      true,
      `Redemption order created: ${redemptionOrder.order_number}`,
      {
        order_id: redemptionOrder.id,
        order_number: redemptionOrder.order_number,
        points_to_redeem: pointsToRedeem,
      }
    )

    // Get points before redemption
    const { data: beforeRedemption } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const pointsBeforeRedemption = beforeRedemption.loyalty_points

    // Record redemption transaction
    const { error: redemptionError } = await supabase.rpc(
      'record_loyalty_transaction_atomic',
      {
        p_customer_id: customer.id,
        p_order_id: redemptionOrder.id,
        p_points_earned: 0,
        p_points_redeemed: pointsToRedeem,
        p_order_total: redemptionOrder.total_amount,
      }
    )

    if (redemptionError) {
      logTest(
        'Record Redemption Transaction',
        false,
        'Failed to record redemption',
        redemptionError
      )
      return
    }

    logTest(
      'Record Redemption Transaction',
      true,
      `Redemption recorded: -${pointsToRedeem} points`,
      {
        customer_id: customer.id,
        order_id: redemptionOrder.id,
        points_redeemed: pointsToRedeem,
      }
    )

    // Verify points were deducted
    const { data: afterRedemption } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const pointsAfterRedemption = afterRedemption.loyalty_points
    const pointsDeducted = pointsBeforeRedemption - pointsAfterRedemption

    const redemptionCorrect = pointsDeducted === pointsToRedeem

    logTest(
      'Verify Points Deduction',
      redemptionCorrect,
      redemptionCorrect
        ? `Points deducted correctly: -${pointsDeducted} = -${pointsToRedeem} ✅`
        : `Points mismatch: expected -${pointsToRedeem}, got -${pointsDeducted} ❌`,
      {
        points_before: pointsBeforeRedemption,
        points_after: pointsAfterRedemption,
        expected_deduction: pointsToRedeem,
        actual_deduction: pointsDeducted,
      }
    )

    // Verify redemption transaction record
    const { data: redemptionTx } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('order_id', redemptionOrder.id)
      .single()

    const txCorrect =
      redemptionTx &&
      redemptionTx.points_redeemed === pointsToRedeem &&
      redemptionTx.points_earned === 0 &&
      redemptionTx.transaction_type === 'redemption'

    logTest(
      'Verify Redemption Record',
      txCorrect,
      'Redemption transaction record verified',
      {
        id: redemptionTx?.id,
        transaction_type: redemptionTx?.transaction_type,
        points_earned: redemptionTx?.points_earned,
        points_redeemed: redemptionTx?.points_redeemed,
      }
    )
  } catch (error) {
    logTest(
      'Loyalty Points Redemption Flow',
      false,
      'Unexpected error in redemption flow',
      error.message
    )
  }
}

// ====================
// TEST 4: CONCURRENT TRANSACTIONS
// ====================

async function testConcurrentTransactions() {
  console.log('🔵 TEST 4: Concurrent Transaction Handling\n')

  try {
    // Create a test customer with known points
    const testEmail = `concurrent-${Date.now()}@example.com`

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        email: testEmail,
        first_name: 'Concurrent',
        last_name: 'Test',
        loyalty_points: 1000,
        total_spent: 0,
      })
      .select()
      .single()

    if (customerError) {
      logTest(
        'Create Concurrent Test Customer',
        false,
        'Failed to create customer',
        customerError
      )
      return
    }

    logTest(
      'Create Concurrent Test Customer',
      true,
      `Customer created with 1000 points`,
      { id: customer.id, initial_points: 1000 }
    )

    // Create 5 concurrent orders
    const orderPromises = Array.from({ length: 5 }, async (_, i) => {
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

    logTest(
      'Create Concurrent Orders',
      orders.length === 5,
      `${orders.length} concurrent orders created`,
      { count: orders.length, order_numbers: orders.map((o) => o.order_number) }
    )

    // Record loyalty transactions concurrently
    const txPromises = orders.map((order) =>
      supabase.rpc('record_loyalty_transaction_atomic', {
        p_customer_id: customer.id,
        p_order_id: order.id,
        p_points_earned: 11, // 11 points per $11 order
        p_points_redeemed: 0,
        p_order_total: 11.00,
      })
    )

    const txResults = await Promise.all(txPromises)
    const txErrors = txResults.filter((r) => r.error)

    logTest(
      'Record Concurrent Loyalty Transactions',
      txErrors.length === 0,
      txErrors.length === 0
        ? '5 concurrent transactions recorded successfully'
        : `${txErrors.length} transactions failed`,
      txErrors.length > 0 ? { errors: txErrors } : { success: 5 }
    )

    // Verify final point balance
    const { data: finalCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    const expectedPoints = 1000 + 5 * 11 // Initial + (5 orders × 11 points)
    const pointsCorrect = finalCustomer.loyalty_points === expectedPoints

    logTest(
      'Verify Concurrent Points Calculation',
      pointsCorrect,
      pointsCorrect
        ? `Final balance correct: ${finalCustomer.loyalty_points} = ${expectedPoints} ✅`
        : `Final balance mismatch: expected ${expectedPoints}, got ${finalCustomer.loyalty_points} ❌`,
      {
        initial: 1000,
        transactions: 5,
        points_per_tx: 11,
        expected: expectedPoints,
        actual: finalCustomer.loyalty_points,
      }
    )

    // Verify all transactions were recorded
    const { data: allTxs, count } = await supabase
      .from('loyalty_transactions')
      .select('*', { count: 'exact' })
      .in(
        'order_id',
        orders.map((o) => o.id)
      )

    logTest(
      'Verify All Concurrent Transactions Recorded',
      count === 5,
      `${count} transaction records found (expected 5)`,
      { expected: 5, actual: count }
    )
  } catch (error) {
    logTest(
      'Concurrent Transaction Handling',
      false,
      'Unexpected error in concurrent test',
      error.message
    )
  }
}

// ====================
// TEST 5: EDGE CASES
// ====================

async function testEdgeCases() {
  console.log('🔵 TEST 5: Edge Cases & Error Handling\n')

  try {
    // Create test customer
    const testEmail = `edge-${Date.now()}@example.com`

    const { data: customer } = await supabase
      .from('customers')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        email: testEmail,
        first_name: 'Edge',
        last_name: 'Case',
        loyalty_points: 50,
        total_spent: 0,
      })
      .select()
      .single()

    // Test 1: Try to redeem more points than available
    const { data: order1 } = await supabase
      .from('orders')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        customer_id: customer.id,
        order_number: `EDGE-${Date.now()}-0001`,
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

    const { error: insufficientError } = await supabase.rpc(
      'record_loyalty_transaction_atomic',
      {
        p_customer_id: customer.id,
        p_order_id: order1.id,
        p_points_earned: 0,
        p_points_redeemed: 100, // Customer only has 50 points
        p_order_total: 108.00,
      }
    )

    logTest(
      'Insufficient Points Protection',
      !!insufficientError && insufficientError.message.includes('Insufficient'),
      'Transaction correctly rejected for insufficient points',
      {
        customer_points: 50,
        attempted_redemption: 100,
        error: insufficientError?.message,
      }
    )

    // Verify points unchanged after failed transaction
    const { data: unchangedCustomer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customer.id)
      .single()

    logTest(
      'Points Unchanged After Failed Transaction',
      unchangedCustomer.loyalty_points === 50,
      'Customer points remain at 50 after failed redemption',
      {
        expected: 50,
        actual: unchangedCustomer.loyalty_points,
      }
    )

    // Test 2: Zero points transaction (should fail)
    const { data: order2 } = await supabase
      .from('orders')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        customer_id: customer.id,
        order_number: `EDGE-${Date.now()}-0002`,
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

    const { error: zeroError } = await supabase.rpc(
      'record_loyalty_transaction_atomic',
      {
        p_customer_id: customer.id,
        p_order_id: order2.id,
        p_points_earned: 0,
        p_points_redeemed: 0,
        p_order_total: 11.00,
      }
    )

    logTest(
      'Zero Points Transaction Blocked',
      !!zeroError && zeroError.message.includes('both be zero'),
      'Transaction correctly rejected when both earned and redeemed are zero',
      { error: zeroError?.message }
    )

    // Test 3: Negative points (should fail)
    const { error: negativeError } = await supabase.rpc(
      'record_loyalty_transaction_atomic',
      {
        p_customer_id: customer.id,
        p_order_id: order2.id,
        p_points_earned: -10,
        p_points_redeemed: 0,
        p_order_total: 11.00,
      }
    )

    logTest(
      'Negative Points Blocked',
      !!negativeError && negativeError.message.includes('negative'),
      'Transaction correctly rejected for negative points',
      { error: negativeError?.message }
    )

    // Test 4: Invalid customer ID (should fail)
    const { error: invalidCustomerError } = await supabase.rpc(
      'record_loyalty_transaction_atomic',
      {
        p_customer_id: '00000000-0000-0000-0000-000000000000',
        p_order_id: order2.id,
        p_points_earned: 10,
        p_points_redeemed: 0,
        p_order_total: 11.00,
      }
    )

    logTest(
      'Invalid Customer Blocked',
      !!invalidCustomerError && invalidCustomerError.message.includes('not found'),
      'Transaction correctly rejected for non-existent customer',
      { error: invalidCustomerError?.message }
    )
  } catch (error) {
    logTest('Edge Cases', false, 'Unexpected error in edge case tests', error.message)
  }
}

// ====================
// MAIN TEST RUNNER
// ====================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🧪 End-to-End Transaction Flow Test Suite')
  console.log('═══════════════════════════════════════════════════════════\n')

  await setup()

  // Test 1: Complete order flow
  const orderData = await testCompleteOrderFlow()

  // Test 2: Loyalty points earning
  const loyaltyData = await testLoyaltyPointsEarning(orderData)

  // Test 3: Loyalty points redemption
  await testLoyaltyPointsRedemption(loyaltyData)

  // Test 4: Concurrent transactions
  await testConcurrentTransactions()

  // Test 5: Edge cases
  await testEdgeCases()

  // Summary
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
      ? 'A+ ✅ PERFECT'
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
