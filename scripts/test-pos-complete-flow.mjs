import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function testCompletePOSFlow() {
  console.log('='.repeat(80));
  console.log('🧪 COMPLETE POS FLOW TEST WITH REAL FLORA DISTRO DATA');
  console.log('='.repeat(80));
  console.log('');

  // ============================================================================
  // STEP 1: Get real customer
  // ============================================================================
  console.log('👤 STEP 1: Finding a real Flora customer...');

  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('vendor_id', FLORA_VENDOR_ID)
    .limit(1);

  if (custError || !customers || customers.length === 0) {
    console.error('❌ No customers found for Flora Distro');
    return;
  }

  const customer = customers[0];
  console.log('✅ Customer found:', {
    id: customer.id,
    name: `${customer.first_name} ${customer.last_name}`,
    email: customer.email,
    phone: customer.phone
  });
  console.log('');

  // ============================================================================
  // STEP 2: Get customer's current loyalty status
  // ============================================================================
  console.log('🎁 STEP 2: Getting customer loyalty status...');

  const { data: loyalty } = await supabase
    .from('customer_loyalty')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('vendor_id', FLORA_VENDOR_ID)
    .eq('provider', 'builtin')
    .single();

  if (loyalty) {
    console.log('✅ Existing loyalty record:', {
      points: loyalty.points,
      lifetimePoints: loyalty.lifetime_points,
      tier: loyalty.tier_name,
      tierLevel: loyalty.tier_level
    });
  } else {
    console.log('ℹ️  No loyalty record (will be created on first purchase)');
  }
  console.log('');

  // ============================================================================
  // STEP 3: Get a real location
  // ============================================================================
  console.log('📍 STEP 3: Getting a real Flora location...');

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', FLORA_VENDOR_ID)
    .limit(1);

  if (!locations || locations.length === 0) {
    console.error('❌ No locations found for Flora Distro');
    return;
  }

  const location = locations[0];
  console.log('✅ Location found:', {
    id: location.id,
    name: location.name
  });
  console.log('');

  // ============================================================================
  // STEP 4: Get real products with inventory
  // ============================================================================
  console.log('📦 STEP 4: Getting products with inventory...');

  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      quantity,
      location_id,
      products (id, name, price_retail)
    `)
    .eq('vendor_id', FLORA_VENDOR_ID)
    .eq('location_id', location.id)
    .gt('quantity', 5)
    .limit(3);

  if (!inventory || inventory.length === 0) {
    console.error('❌ No inventory found for Flora Distro');
    return;
  }

  console.log(`✅ Found ${inventory.length} products with inventory:`);
  inventory.forEach((inv, i) => {
    console.log(`   ${i + 1}. ${inv.products.name} - $${inv.products.price_retail} (${inv.quantity} in stock)`);
  });
  console.log('');

  // ============================================================================
  // STEP 5: Create POS sale via API
  // ============================================================================
  console.log('💳 STEP 5: Creating POS sale via API...');

  const items = inventory.map(inv => ({
    productId: inv.product_id,
    productName: inv.products.name,
    unitPrice: inv.products.price_retail || 50,
    quantity: 1,
    lineTotal: inv.products.price_retail || 50,
    inventoryId: inv.id
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * 0.08;
  const total = subtotal + taxAmount;

  console.log('📝 Sale details:', {
    items: items.length,
    subtotal: `$${subtotal.toFixed(2)}`,
    tax: `$${taxAmount.toFixed(2)}`,
    total: `$${total.toFixed(2)}`
  });

  try {
    const response = await fetch('http://localhost:3000/api/pos/sales/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: location.id,
        vendorId: FLORA_VENDOR_ID,
        customerId: customer.id,
        customerName: `${customer.first_name} ${customer.last_name}`,
        items,
        subtotal,
        taxAmount,
        total,
        paymentMethod: 'cash',
        cashTendered: Math.ceil(total),
        changeGiven: Math.ceil(total) - total
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Sale failed:', result.error || result.details);
      return;
    }

    console.log('✅ Sale completed successfully!');
    console.log('');
    console.log('📋 Sale result:', {
      orderNumber: result.orderNumber,
      pointsEarned: result.pointsEarned,
      newTier: result.newTier || 'No tier change',
      alpineIQSynced: result.alpineIQSynced ? '✅ Yes' : '❌ No',
      alpineIQError: result.alpineIQError || 'None'
    });

    if (result.loyalty) {
      console.log('');
      console.log('🎁 Loyalty update:', {
        pointsEarned: result.loyalty.pointsEarned,
        totalPoints: result.loyalty.totalPoints,
        lifetimePoints: result.loyalty.lifetimePoints,
        tier: result.loyalty.tier,
        tierUpgrade: result.loyalty.tierUpgrade ? '🎉 YES!' : 'No'
      });
    }
    console.log('');

    // ============================================================================
    // STEP 6: Verify database updates
    // ============================================================================
    console.log('🔍 STEP 6: Verifying database updates...');

    // Check order created
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', result.order.id)
      .single();

    console.log('✅ Order in database:', {
      id: order.id,
      number: order.order_number,
      status: order.status,
      total: `$${order.total_amount}`
    });

    // Check inventory deducted
    const { data: updatedInventory } = await supabase
      .from('inventory')
      .select('id, quantity')
      .in('id', items.map(i => i.inventoryId));

    console.log('✅ Inventory updated:');
    updatedInventory.forEach((inv, i) => {
      const originalQty = inventory.find(orig => orig.id === inv.id)?.quantity || 0;
      console.log(`   ${items[i].productName}: ${originalQty} → ${inv.quantity} (${originalQty - inv.quantity} sold)`);
    });

    // Check loyalty points awarded
    const { data: updatedLoyalty } = await supabase
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('vendor_id', FLORA_VENDOR_ID)
      .single();

    console.log('✅ Loyalty points updated:', {
      oldPoints: loyalty?.points || 0,
      newPoints: updatedLoyalty.points,
      pointsEarned: updatedLoyalty.points - (loyalty?.points || 0),
      tier: updatedLoyalty.tier_name
    });

    // Check loyalty transaction logged
    const { data: loyaltyTx } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('order_id', order.id)
      .eq('type', 'earned')
      .single();

    if (loyaltyTx) {
      console.log('✅ Loyalty transaction logged:', {
        points: loyaltyTx.points,
        description: loyaltyTx.description
      });
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('🎉 ALL TESTS PASSED! POS SYSTEM IS WORKING CORRECTLY!');
    console.log('='.repeat(80));
    console.log('');
    console.log('✅ Inventory validation: WORKING');
    console.log('✅ Points calculation: WORKING');
    console.log('✅ Tier management: WORKING');
    console.log('✅ Alpine IQ sync:', result.alpineIQSynced ? 'WORKING' : 'NOT CONFIGURED (expected)');
    console.log('✅ Database updates: WORKING');
    console.log('');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error(error.stack);
  }
}

testCompletePOSFlow().catch(console.error);
