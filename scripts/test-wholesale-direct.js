#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Use Supabase direct connection (not pooler)
const connectionString = `postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const testData = {
  vendorId: null,
  locationId: null,
  suppliers: [],
  customers: [],
  products: [],
  inboundPOs: [],
  outboundPOs: []
};

async function log(message) {
  console.log(message);
}

async function getVendorAndLocation() {
  console.log('\n📋 Step 1: Getting vendor and location...');

  const vendorResult = await pool.query(`
    SELECT * FROM vendors WHERE store_name = 'Flora Distro' LIMIT 1
  `);

  if (vendorResult.rows.length === 0) {
    throw new Error('Could not find Flora Distro vendor');
  }

  testData.vendorId = vendorResult.rows[0].id;
  console.log(`✅ Found vendor: ${vendorResult.rows[0].store_name} (${testData.vendorId})`);

  const locationResult = await pool.query(`
    SELECT * FROM locations WHERE vendor_id = $1 LIMIT 1
  `, [testData.vendorId]);

  if (locationResult.rows.length === 0) {
    throw new Error('Could not find location');
  }

  testData.locationId = locationResult.rows[0].id;
  console.log(`✅ Found location: ${locationResult.rows[0].name} (${testData.locationId})`);
}

async function getProducts() {
  console.log('\n📦 Step 2: Getting products for testing...');

  const result = await pool.query(`
    SELECT id, name, sku, price, regular_price, wholesale_price
    FROM products
    WHERE vendor_id = $1
    LIMIT 5
  `, [testData.vendorId]);

  if (result.rows.length === 0) {
    throw new Error('Could not find products');
  }

  testData.products = result.rows.map(p => ({
    ...p,
    retail_price: p.price || p.regular_price || p.wholesale_price || 10
  }));

  console.log(`✅ Found ${result.rows.length} products:`);
  testData.products.forEach(p => console.log(`   - ${p.name} - $${p.retail_price}`));
}

async function createSuppliers() {
  console.log('\n🏭 Step 3: Creating test suppliers...');

  // Create external supplier
  const result1 = await pool.query(`
    INSERT INTO suppliers (
      vendor_id, external_name, external_company, contact_name, contact_email, contact_phone,
      address_line1, city, state, zip, country, payment_terms, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    testData.vendorId,
    'Acme Wholesale Supply Co',
    'Acme Corp',
    'Sales Team',
    'orders@acmewholesale.com',
    '555-0100',
    '123 Industrial Blvd',
    'Seattle',
    'WA',
    '98101',
    'US',
    'Net 30',
    'Primary external supplier for testing'
  ]);

  testData.suppliers.push(result1.rows[0]);
  console.log(`✅ Created external supplier: ${result1.rows[0].external_name}`);

  // Try to create vendor-linked supplier
  const otherVendorResult = await pool.query(`
    SELECT id, store_name FROM vendors WHERE id != $1 LIMIT 1
  `, [testData.vendorId]);

  if (otherVendorResult.rows.length > 0) {
    const result2 = await pool.query(`
      INSERT INTO suppliers (vendor_id, supplier_vendor_id, payment_terms, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      testData.vendorId,
      otherVendorResult.rows[0].id,
      'Net 15',
      'B2B vendor supplier for testing'
    ]);

    testData.suppliers.push(result2.rows[0]);
    console.log(`✅ Created vendor-linked supplier: ${otherVendorResult.rows[0].store_name}`);
  }

  console.log(`✅ Total suppliers created: ${testData.suppliers.length}`);
}

async function createWholesaleCustomers() {
  console.log('\n🏢 Step 4: Creating test wholesale customers...');

  // Create external wholesale customer
  const result1 = await pool.query(`
    INSERT INTO wholesale_customers (
      vendor_id, external_company_name, contact_name, contact_email, contact_phone,
      billing_address_line1, billing_city, billing_state, billing_zip, billing_country,
      shipping_address_line1, shipping_city, shipping_state, shipping_zip, shipping_country,
      pricing_tier, discount_percent, payment_terms, credit_limit, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *
  `, [
    testData.vendorId,
    'Green Valley Dispensary',
    'John Smith',
    'purchasing@greenvalley.com',
    '555-0200',
    '456 Main St',
    'Portland',
    'OR',
    '97201',
    'US',
    '456 Main St',
    'Portland',
    'OR',
    '97201',
    'US',
    'wholesale',
    15,
    'Net 30',
    10000,
    'Premium wholesale customer - testing'
  ]);

  testData.customers.push(result1.rows[0]);
  console.log(`✅ Created external customer: ${result1.rows[0].external_company_name} (${result1.rows[0].pricing_tier}, ${result1.rows[0].discount_percent}% discount)`);

  // Create distributor tier customer
  const result2 = await pool.query(`
    INSERT INTO wholesale_customers (
      vendor_id, external_company_name, contact_name, contact_email, contact_phone,
      billing_address_line1, billing_city, billing_state, billing_zip, billing_country,
      pricing_tier, discount_percent, payment_terms, credit_limit, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `, [
    testData.vendorId,
    'Pacific Northwest Distributors',
    'Jane Doe',
    'orders@pnwdist.com',
    '555-0300',
    '789 Commerce Dr',
    'Tacoma',
    'WA',
    '98402',
    'US',
    'distributor',
    25,
    'Net 45',
    50000,
    'Large distributor - testing'
  ]);

  testData.customers.push(result2.rows[0]);
  console.log(`✅ Created distributor customer: ${result2.rows[0].external_company_name} (${result2.rows[0].pricing_tier}, ${result2.rows[0].discount_percent}% discount)`);

  console.log(`✅ Total customers created: ${testData.customers.length}`);
}

async function createInboundPO() {
  console.log('\n📥 Step 6: Creating inbound purchase order (buying from supplier)...');

  const supplier = testData.suppliers[0];
  const products = testData.products.slice(0, 3);

  const items = products.map((product, index) => ({
    product_id: product.id,
    quantity: (index + 1) * 10,
    unit_price: product.retail_price * 0.5
  }));

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax = subtotal * 0.08;
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
  const poNumResult = await pool.query(`
    SELECT generate_po_number($1, $2) as po_number
  `, [testData.vendorId, 'inbound']);

  const poNumber = poNumResult.rows[0].po_number;

  // Create PO
  const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const poResult = await pool.query(`
    INSERT INTO purchase_orders (
      vendor_id, po_number, po_type, supplier_id, status,
      subtotal, tax, shipping, total, payment_terms, expected_delivery_date, internal_notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    testData.vendorId,
    poNumber,
    'inbound',
    supplier.id,
    'draft',
    subtotal,
    tax,
    shipping,
    total,
    'Net 30',
    deliveryDate,
    'Test inbound PO - restocking inventory'
  ]);

  const po = poResult.rows[0];
  console.log(`✅ Created inbound PO: ${po.po_number} (${po.status})`);

  // Create PO items
  for (const item of items) {
    await pool.query(`
      INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, line_total)
      VALUES ($1, $2, $3, $4, $5)
    `, [po.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
  }

  console.log(`✅ Added ${items.length} items to PO`);

  testData.inboundPOs.push({ po, items });
  return { po, items };
}

async function receiveInboundPO(poData) {
  console.log('\n📦 Step 7: Receiving inbound purchase order (inventory should increase)...');

  const { po, items } = poData;
  console.log(`   Receiving PO ${po.po_number}...`);

  const inventoryBefore = {};
  for (const item of items) {
    const result = await pool.query(`
      SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [item.product_id, testData.locationId]);

    inventoryBefore[item.product_id] = result.rows[0] ? result.rows[0].quantity : 0;
  }

  // Receive items
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);

    const existingInv = await pool.query(`
      SELECT * FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [item.product_id, testData.locationId]);

    if (existingInv.rows.length > 0) {
      await pool.query(`
        UPDATE inventory
        SET quantity = quantity + $1, updated_at = NOW()
        WHERE id = $2
      `, [item.quantity, existingInv.rows[0].id]);
    } else {
      await pool.query(`
        INSERT INTO inventory (product_id, location_id, vendor_id, quantity)
        VALUES ($1, $2, $3, $4)
      `, [item.product_id, testData.locationId, testData.vendorId, item.quantity]);
    }

    console.log(`   ✓ Received ${item.quantity} units of ${product.name}`);
  }

  // Update PO status
  await pool.query(`UPDATE purchase_orders SET status = 'received' WHERE id = $1`, [po.id]);

  // Verify inventory
  console.log('\n   📊 Inventory verification:');
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);
    const result = await pool.query(`
      SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [item.product_id, testData.locationId]);

    const before = parseInt(inventoryBefore[item.product_id]);
    const after = parseInt(result.rows[0].quantity);
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
  const products = testData.products.slice(0, 2);

  // Check current inventory
  console.log('   Current inventory:');
  for (const product of products) {
    const result = await pool.query(`
      SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [product.id, testData.locationId]);

    console.log(`   - ${product.name}: ${result.rows[0].quantity} units available`);
  }

  const items = products.map((product, index) => ({
    product_id: product.id,
    quantity: (index + 1) * 5,
    unit_price: product.retail_price * (1 - customer.discount_percent / 100)
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
  const poNumResult = await pool.query(`
    SELECT generate_po_number($1, $2) as po_number
  `, [testData.vendorId, 'outbound']);

  const poNumber = poNumResult.rows[0].po_number;

  // Create PO
  const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const poResult = await pool.query(`
    INSERT INTO purchase_orders (
      vendor_id, po_number, po_type, wholesale_customer_id, status,
      subtotal, tax, shipping, total, payment_terms, expected_delivery_date, internal_notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    testData.vendorId,
    poNumber,
    'outbound',
    customer.id,
    'draft',
    subtotal,
    tax,
    shipping,
    total,
    customer.payment_terms,
    deliveryDate,
    `Test outbound PO - wholesale order for ${customer.external_company_name}`
  ]);

  const po = poResult.rows[0];
  console.log(`✅ Created outbound PO: ${po.po_number} (${po.status})`);

  // Create PO items
  for (const item of items) {
    await pool.query(`
      INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, line_total)
      VALUES ($1, $2, $3, $4, $5)
    `, [po.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
  }

  // Create inventory reservations
  for (const item of items) {
    await pool.query(`
      INSERT INTO inventory_reservations (product_id, location_id, reservation_type, reference_id, quantity, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [item.product_id, testData.locationId, 'purchase_order', po.id, item.quantity, 'active']);
  }

  console.log(`✅ Created ${items.length} inventory reservations`);

  testData.outboundPOs.push({ po, items });
  return { po, items };
}

async function fulfillOutboundPO(poData) {
  console.log('\n📦 Step 9: Fulfilling outbound purchase order (inventory should decrease)...');

  const { po, items } = poData;
  console.log(`   Fulfilling PO ${po.po_number}...`);

  const inventoryBefore = {};
  for (const item of items) {
    const result = await pool.query(`
      SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [item.product_id, testData.locationId]);

    inventoryBefore[item.product_id] = result.rows[0].quantity;
  }

  // Fulfill items
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);

    const invResult = await pool.query(`
      SELECT * FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [item.product_id, testData.locationId]);

    if (invResult.rows.length === 0 || invResult.rows[0].quantity < item.quantity) {
      throw new Error(`Insufficient inventory for ${product.name}`);
    }

    await pool.query(`
      UPDATE inventory
      SET quantity = quantity - $1, updated_at = NOW()
      WHERE id = $2
    `, [item.quantity, invResult.rows[0].id]);

    console.log(`   ✓ Fulfilled ${item.quantity} units of ${product.name}`);
  }

  // Release reservations
  await pool.query(`
    UPDATE inventory_reservations
    SET status = 'released'
    WHERE reference_id = $1 AND reservation_type = 'purchase_order'
  `, [po.id]);

  // Update PO status
  await pool.query(`UPDATE purchase_orders SET status = 'fulfilled' WHERE id = $1`, [po.id]);

  // Verify inventory
  console.log('\n   📊 Inventory verification:');
  for (const item of items) {
    const product = testData.products.find(p => p.id === item.product_id);
    const result = await pool.query(`
      SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [item.product_id, testData.locationId]);

    const before = parseInt(inventoryBefore[item.product_id]);
    const after = parseInt(result.rows[0].quantity);
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
  const payment1Amount = parseFloat(inboundPO.total) / 2;
  await pool.query(`
    INSERT INTO purchase_order_payments (purchase_order_id, amount, payment_method, reference_number, notes)
    VALUES ($1, $2, $3, $4, $5)
  `, [inboundPO.id, payment1Amount, 'check', 'CHK-001', 'First payment - 50%']);

  console.log(`✅ Added payment to inbound PO: $${payment1Amount.toFixed(2)} (check)`);

  // Add payment to outbound PO
  const payment2Amount = parseFloat(outboundPO.total);
  await pool.query(`
    INSERT INTO purchase_order_payments (purchase_order_id, amount, payment_method, reference_number, notes)
    VALUES ($1, $2, $3, $4, $5)
  `, [outboundPO.id, payment2Amount, 'wire_transfer', 'WIRE-12345', 'Full payment received']);

  console.log(`✅ Added payment to outbound PO: $${payment2Amount.toFixed(2)} (wire_transfer)`);

  const paymentsResult = await pool.query(`
    SELECT * FROM purchase_order_payments WHERE purchase_order_id = ANY($1::uuid[])
  `, [[inboundPO.id, outboundPO.id]]);

  console.log(`✅ Total payments recorded: ${paymentsResult.rows.length}`);
  const totalPaid = paymentsResult.rows.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  console.log(`   Total amount: $${totalPaid.toFixed(2)}`);
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
    const result = await pool.query(`
      SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2
    `, [product.id, testData.locationId]);

    const qty = result.rows[0] ? result.rows[0].quantity : 0;
    console.log(`   - ${product.name}: ${qty} units`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TESTS PASSED!');
  console.log('='.repeat(80));
}

async function runTests() {
  try {
    console.log('\n🚀 Starting comprehensive wholesale system tests (Direct PostgreSQL)...\n');

    await getVendorAndLocation();
    await getProducts();
    await createSuppliers();
    await createWholesaleCustomers();

    const inboundPO = await createInboundPO();
    await receiveInboundPO(inboundPO);

    const outboundPO = await createOutboundPO();
    await fulfillOutboundPO(outboundPO);

    await testPayments();
    await printSummary();

    console.log('\n🎉 Test completed successfully!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runTests();
