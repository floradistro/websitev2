#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data storage
const testData = {
  vendorId: null,
  locationId: null,
  suppliers: [],
  customers: [],
  products: [],
  inboundPOs: [],
  outboundPOs: []
};

async function log(message, data = null) {
  console.log(message);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function getVendorAndLocation() {
  console.log('\n📋 Step 1: Getting vendor and location...');

  // Get Flora Distro vendor
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('store_name', 'Flora Distro')
    .single();

  if (vendorError || !vendor) {
    console.error('❌ Error getting vendor:', vendorError);
    throw new Error('Could not find Flora Distro vendor');
  }

  testData.vendorId = vendor.id;
  console.log(`✅ Found vendor: ${vendor.store_name} (${vendor.id})`);

  // Get first location for this vendor
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', vendor.id)
    .limit(1)
    .single();

  if (locationError || !location) {
    console.error('❌ Error getting location:', locationError);
    throw new Error('Could not find location');
  }

  testData.locationId = location.id;
  console.log(`✅ Found location: ${location.name} (${location.id})`);
}

async function getProducts() {
  console.log('\n📦 Step 2: Getting products for testing...');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, price, regular_price, wholesale_price')
    .eq('vendor_id', testData.vendorId)
    .limit(5);

  if (error || !products || products.length === 0) {
    console.error('❌ Error getting products:', error);
    throw new Error('Could not find products');
  }

  // Add computed retail_price for compatibility
  testData.products = products.map(p => ({
    ...p,
    retail_price: p.price || p.regular_price || p.wholesale_price || 10
  }));
  console.log(`✅ Found ${products.length} products:`);
  testData.products.forEach(p => console.log(`   - ${p.name} (${p.sku}) - $${p.retail_price}`));
}

async function createSuppliers() {
  console.log('\n🏭 Step 3: Creating test suppliers...');

  // Create external supplier
  const { data: externalSupplier, error: error1 } = await supabase
    .from('suppliers')
    .insert({
      vendor_id: testData.vendorId,
      external_name: 'Acme Wholesale Supply Co',
      external_company: 'Acme Corp',
      contact_name: 'Sales Team',
      contact_email: 'orders@acmewholesale.com',
      contact_phone: '555-0100',
      address_line1: '123 Industrial Blvd',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'US',
      payment_terms: 'Net 30',
      notes: 'Primary external supplier for testing'
    })
    .select()
    .single();

  if (error1) {
    console.error('❌ Error creating external supplier:', error1);
    throw error1;
  }

  testData.suppliers.push(externalSupplier);
  console.log(`✅ Created external supplier: ${externalSupplier.external_name}`);

  // Try to create vendor-linked supplier (using another vendor if exists)
  const { data: otherVendors } = await supabase
    .from('vendors')
    .select('id, store_name')
    .neq('id', testData.vendorId)
    .limit(1);

  if (otherVendors && otherVendors.length > 0) {
    const { data: vendorSupplier, error: error2 } = await supabase
      .from('suppliers')
      .insert({
        vendor_id: testData.vendorId,
        supplier_vendor_id: otherVendors[0].id,
        payment_terms: 'Net 15',
        notes: 'B2B vendor supplier for testing'
      })
      .select()
      .single();

    if (!error2) {
      testData.suppliers.push(vendorSupplier);
      console.log(`✅ Created vendor-linked supplier: ${otherVendors[0].store_name}`);
    }
  }

  console.log(`✅ Total suppliers created: ${testData.suppliers.length}`);
}

async function createWholesaleCustomers() {
  console.log('\n🏢 Step 4: Creating test wholesale customers...');

  // Create external wholesale customer
  const { data: externalCustomer, error: error1 } = await supabase
    .from('wholesale_customers')
    .insert({
      vendor_id: testData.vendorId,
      external_company_name: 'Green Valley Dispensary',
      contact_name: 'John Smith',
      contact_email: 'purchasing@greenvalley.com',
      contact_phone: '555-0200',
      billing_address_line1: '456 Main St',
      billing_city: 'Portland',
      billing_state: 'OR',
      billing_zip: '97201',
      billing_country: 'US',
      shipping_address_line1: '456 Main St',
      shipping_city: 'Portland',
      shipping_state: 'OR',
      shipping_zip: '97201',
      shipping_country: 'US',
      pricing_tier: 'wholesale',
      discount_percent: 15,
      payment_terms: 'Net 30',
      credit_limit: 10000,
      notes: 'Premium wholesale customer - testing'
    })
    .select()
    .single();

  if (error1) {
    console.error('❌ Error creating external customer:', error1);
    throw error1;
  }

  testData.customers.push(externalCustomer);
  console.log(`✅ Created external customer: ${externalCustomer.external_company_name} (${externalCustomer.pricing_tier}, ${externalCustomer.discount_percent}% discount)`);

  // Create distributor tier customer
  const { data: distributorCustomer, error: error2 } = await supabase
    .from('wholesale_customers')
    .insert({
      vendor_id: testData.vendorId,
      external_company_name: 'Pacific Northwest Distributors',
      contact_name: 'Jane Doe',
      contact_email: 'orders@pnwdist.com',
      contact_phone: '555-0300',
      billing_address_line1: '789 Commerce Dr',
      billing_city: 'Tacoma',
      billing_state: 'WA',
      billing_zip: '98402',
      billing_country: 'US',
      shipping_address_line1: '789 Commerce Dr',
      shipping_city: 'Tacoma',
      shipping_state: 'WA',
      shipping_zip: '98402',
      shipping_country: 'US',
      pricing_tier: 'distributor',
      discount_percent: 25,
      payment_terms: 'Net 45',
      credit_limit: 50000,
      notes: 'Large distributor - testing'
    })
    .select()
    .single();

  if (!error2) {
    testData.customers.push(distributorCustomer);
    console.log(`✅ Created distributor customer: ${distributorCustomer.external_company_name} (${distributorCustomer.pricing_tier}, ${distributorCustomer.discount_percent}% discount)`);
  }

  console.log(`✅ Total customers created: ${testData.customers.length}`);
}

async function getInitialInventory() {
  console.log('\n📊 Step 5: Recording initial inventory levels...');

  const inventoryLevels = {};

  for (const product of testData.products) {
    const { data: inventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', product.id)
      .eq('location_id', testData.locationId)
      .maybeSingle();

    inventoryLevels[product.id] = inventory ? inventory.quantity : 0;
    console.log(`   ${product.name}: ${inventoryLevels[product.id]} units`);
  }

  return inventoryLevels;
}

async function createInboundPO() {
  console.log('\n📥 Step 6: Creating inbound purchase order (buying from supplier)...');

  const supplier = testData.suppliers[0];
  const products = testData.products.slice(0, 3); // Use first 3 products

  const items = products.map((product, index) => ({
    product_id: product.id,
    quantity: (index + 1) * 10, // 10, 20, 30 units
    unit_price: product.retail_price * 0.5 // Buy at 50% of retail
  }));

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = 25.00;
  const total = subtotal + tax + shipping;

  console.log(`   Creating PO for ${items.length} items:`);
  items.forEach((item, i) => {
    const product = products[i];
    console.log(`   - ${product.name}: ${item.quantity} @ $${item.unit_price} = $${item.quantity * item.unit_price}`);
  });
  console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
  console.log(`   Tax: $${tax.toFixed(2)}`);
  console.log(`   Shipping: $${shipping.toFixed(2)}`);
  console.log(`   Total: $${total.toFixed(2)}`);

  // Generate PO number
  const { data: poNumber, error: poNumError } = await supabase
    .rpc('generate_po_number', { v_vendor_id: testData.vendorId, po_type: 'inbound' });

  if (poNumError) {
    console.error('❌ Error generating PO number:', poNumError);
    throw poNumError;
  }

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      vendor_id: testData.vendorId,
      po_number: poNumber,
      po_type: 'inbound',
      supplier_id: supplier.id,
      status: 'draft',
      subtotal,
      tax,
      shipping: shipping,
      total,
      payment_terms: 'Net 30',
      expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      internal_notes: 'Test inbound PO - restocking inventory'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating inbound PO:', error);
    throw error;
  }

  console.log(`✅ Created inbound PO: ${po.po_number} (${po.status})`);

  // Create PO items
  const itemsToInsert = items.map(item => ({
    purchase_order_id: po.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price
  }));

  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('❌ Error creating PO items:', itemsError);
    throw itemsError;
  }

  console.log(`✅ Added ${items.length} items to PO`);

  testData.inboundPOs.push({ po, items: itemsToInsert });
  return { po, items: itemsToInsert };
}

async function receiveInboundPO(poData) {
  console.log('\n📦 Step 7: Receiving inbound purchase order (inventory should increase)...');

  const { po, items } = poData;

  console.log(`   Receiving PO ${po.po_number}...`);

  // Record inventory before
  const inventoryBefore = {};
  for (const item of items) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', item.product_id)
      .eq('location_id', testData.locationId)
      .maybeSingle();

    inventoryBefore[item.product_id] = inv ? inv.quantity : 0;
  }

  // Receive the items
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);

    // Update or insert inventory
    const { data: existingInv } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', item.product_id)
      .eq('location_id', testData.locationId)
      .maybeSingle();

    if (existingInv) {
      await supabase
        .from('inventory')
        .update({
          quantity: existingInv.quantity + item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInv.id);
    } else {
      await supabase
        .from('inventory')
        .insert({
          product_id: item.product_id,
          location_id: testData.locationId,
          vendor_id: testData.vendorId,
          quantity: item.quantity
        });
    }

    // Update PO item
    await supabase
      .from('purchase_order_items')
      .update({
        quantity_received: item.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    console.log(`   ✓ Received ${item.quantity} units of ${product.name}`);
  }

  // Update PO status
  await supabase
    .from('purchase_orders')
    .update({ status: 'received' })
    .eq('id', po.id);

  // Verify inventory changes
  console.log('\n   📊 Inventory verification:');
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', item.product_id)
      .eq('location_id', testData.locationId)
      .single();

    const before = inventoryBefore[item.product_id];
    const after = inv.quantity;
    const expected = before + item.quantity;
    const match = after === expected ? '✅' : '❌';

    console.log(`   ${match} ${product.name}: ${before} + ${item.quantity} = ${after} (expected: ${expected})`);

    if (after !== expected) {
      throw new Error(`Inventory mismatch for ${product.name}`);
    }
  }

  console.log('✅ Inbound PO received successfully, inventory updated correctly!');
}

async function createOutboundPO() {
  console.log('\n📤 Step 8: Creating outbound purchase order (selling to wholesale customer)...');

  const customer = testData.customers[0];
  const products = testData.products.slice(0, 2); // Use first 2 products

  // Check current inventory
  console.log('   Current inventory:');
  for (const product of products) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', product.id)
      .eq('location_id', testData.locationId)
      .single();

    console.log(`   - ${product.name}: ${inv.quantity} units available`);
  }

  const items = products.map((product, index) => ({
    product_id: product.id,
    quantity: (index + 1) * 5, // 5, 10 units
    unit_price: product.retail_price * (1 - customer.discount_percent / 100) // Apply customer discount
  }));

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax = subtotal * 0.08;
  const shipping = 15.00;
  const total = subtotal + tax + shipping;

  console.log(`\n   Creating outbound PO for ${customer.external_company_name}:`);
  items.forEach((item, i) => {
    const product = products[i];
    console.log(`   - ${product.name}: ${item.quantity} @ $${item.unit_price.toFixed(2)} = $${(item.quantity * item.unit_price).toFixed(2)}`);
  });
  console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
  console.log(`   Tax: $${tax.toFixed(2)}`);
  console.log(`   Shipping: $${shipping.toFixed(2)}`);
  console.log(`   Total: $${total.toFixed(2)}`);

  // Generate PO number
  const { data: poNumber, error: poNumError } = await supabase
    .rpc('generate_po_number', { v_vendor_id: testData.vendorId, po_type: 'outbound' });

  if (poNumError) {
    console.error('❌ Error generating PO number:', poNumError);
    throw poNumError;
  }

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      vendor_id: testData.vendorId,
      po_number: poNumber,
      po_type: 'outbound',
      wholesale_customer_id: customer.id,
      status: 'draft',
      subtotal,
      tax,
      shipping: shipping,
      total,
      payment_terms: customer.payment_terms,
      expected_delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      internal_notes: `Test outbound PO - wholesale order for ${customer.external_company_name}`
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating outbound PO:', error);
    throw error;
  }

  console.log(`✅ Created outbound PO: ${po.po_number} (${po.status})`);

  // Create PO items
  const itemsToInsert = items.map(item => ({
    purchase_order_id: po.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price
  }));

  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('❌ Error creating PO items:', itemsError);
    throw itemsError;
  }

  // Create inventory reservations
  const reservations = items.map(item => ({
    product_id: item.product_id,
    location_id: testData.locationId,
    reservation_type: 'purchase_order',
    reference_id: po.id,
    quantity: item.quantity,
    status: 'active'
  }));

  const { error: reservationError } = await supabase
    .from('inventory_reservations')
    .insert(reservations);

  if (reservationError) {
    console.error('❌ Error creating inventory reservations:', reservationError);
  } else {
    console.log(`✅ Created ${reservations.length} inventory reservations`);
  }

  testData.outboundPOs.push({ po, items: itemsToInsert });
  return { po, items: itemsToInsert };
}

async function fulfillOutboundPO(poData) {
  console.log('\n📦 Step 9: Fulfilling outbound purchase order (inventory should decrease)...');

  const { po, items } = poData;

  console.log(`   Fulfilling PO ${po.po_number}...`);

  // Record inventory before
  const inventoryBefore = {};
  for (const item of items) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', item.product_id)
      .eq('location_id', testData.locationId)
      .single();

    inventoryBefore[item.product_id] = inv.quantity;
  }

  // Fulfill the items
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);

    const { data: inv } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', item.product_id)
      .eq('location_id', testData.locationId)
      .single();

    if (!inv || inv.quantity < item.quantity) {
      throw new Error(`Insufficient inventory for ${product.name}`);
    }

    await supabase
      .from('inventory')
      .update({
        quantity: inv.quantity - item.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', inv.id);

    // Update PO item
    await supabase
      .from('purchase_order_items')
      .update({
        quantity_fulfilled: item.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    console.log(`   ✓ Fulfilled ${item.quantity} units of ${product.name}`);
  }

  // Release reservations
  await supabase
    .from('inventory_reservations')
    .update({ status: 'released' })
    .eq('reference_id', po.id)
    .eq('reservation_type', 'purchase_order');

  // Update PO status
  await supabase
    .from('purchase_orders')
    .update({ status: 'fulfilled' })
    .eq('id', po.id);

  // Verify inventory changes
  console.log('\n   📊 Inventory verification:');
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', item.product_id)
      .eq('location_id', testData.locationId)
      .single();

    const before = inventoryBefore[item.product_id];
    const after = inv.quantity;
    const expected = before - item.quantity;
    const match = after === expected ? '✅' : '❌';

    console.log(`   ${match} ${product.name}: ${before} - ${item.quantity} = ${after} (expected: ${expected})`);

    if (after !== expected) {
      throw new Error(`Inventory mismatch for ${product.name}`);
    }
  }

  console.log('✅ Outbound PO fulfilled successfully, inventory deducted correctly!');
}

async function testPayments() {
  console.log('\n💰 Step 10: Testing payment tracking...');

  const inboundPO = testData.inboundPOs[0].po;
  const outboundPO = testData.outboundPOs[0].po;

  // Add payment to inbound PO
  const payment1Amount = inboundPO.total / 2; // Pay half
  const { data: payment1, error: error1 } = await supabase
    .from('purchase_order_payments')
    .insert({
      purchase_order_id: inboundPO.id,
      amount: payment1Amount,
      payment_method: 'check',
      reference_number: 'CHK-001',
      notes: 'First payment - 50%'
    })
    .select()
    .single();

  if (error1) {
    console.error('❌ Error adding payment:', error1);
  } else {
    console.log(`✅ Added payment to inbound PO: $${payment1Amount.toFixed(2)} (${payment1.payment_method})`);
  }

  // Add payment to outbound PO
  const payment2Amount = outboundPO.total; // Pay in full
  const { data: payment2, error: error2 } = await supabase
    .from('purchase_order_payments')
    .insert({
      purchase_order_id: outboundPO.id,
      amount: payment2Amount,
      payment_method: 'wire_transfer',
      reference_number: 'WIRE-12345',
      notes: 'Full payment received'
    })
    .select()
    .single();

  if (error2) {
    console.error('❌ Error adding payment:', error2);
  } else {
    console.log(`✅ Added payment to outbound PO: $${payment2Amount.toFixed(2)} (${payment2.payment_method})`);
  }

  // Verify payments
  const { data: payments } = await supabase
    .from('purchase_order_payments')
    .select('*')
    .in('purchase_order_id', [inboundPO.id, outboundPO.id]);

  console.log(`✅ Total payments recorded: ${payments.length}`);
  console.log(`   Total amount: $${payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}`);
}

async function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  console.log('\n✅ Suppliers Created:', testData.suppliers.length);
  testData.suppliers.forEach(s => {
    console.log(`   - ${s.external_name || 'Vendor-linked supplier'}`);
  });

  console.log('\n✅ Wholesale Customers Created:', testData.customers.length);
  testData.customers.forEach(c => {
    console.log(`   - ${c.external_company_name} (${c.pricing_tier}, ${c.discount_percent}% discount)`);
  });

  console.log('\n✅ Inbound POs Created:', testData.inboundPOs.length);
  for (const { po, items } of testData.inboundPOs) {
    console.log(`   - ${po.po_number}: ${items.length} items, $${po.total} (${po.status})`);
  }

  console.log('\n✅ Outbound POs Created:', testData.outboundPOs.length);
  for (const { po, items } of testData.outboundPOs) {
    console.log(`   - ${po.po_number}: ${items.length} items, $${po.total} (${po.status})`);
  }

  // Get final inventory levels
  console.log('\n📦 Final Inventory Levels:');
  for (const product of testData.products) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', product.id)
      .eq('location_id', testData.locationId)
      .maybeSingle();

    const qty = inv ? inv.quantity : 0;
    console.log(`   - ${product.name}: ${qty} units`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TESTS PASSED!');
  console.log('='.repeat(80));
}

async function runTests() {
  try {
    console.log('\n🚀 Starting comprehensive wholesale system tests...\n');

    await getVendorAndLocation();
    await getProducts();
    const initialInventory = await getInitialInventory();
    await createSuppliers();
    await createWholesaleCustomers();

    const inboundPO = await createInboundPO();
    await receiveInboundPO(inboundPO);

    const outboundPO = await createOutboundPO();
    await fulfillOutboundPO(outboundPO);

    await testPayments();
    await printSummary();

    console.log('\n🎉 Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
