/**
 * Create Test Shipping Orders
 * Creates 3 realistic shipping orders to Charlotte, NC for testing POS
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Charlotte shipping addresses
const charlotteAddresses = [
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (704) 555-0123',
    address_1: '1234 Queens Road',
    address_2: 'Apt 4B',
    city: 'Charlotte',
    state: 'NC',
    postcode: '28207',
    country: 'US'
  },
  {
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (704) 555-0456',
    address_1: '567 Park Avenue',
    address_2: '',
    city: 'Charlotte',
    state: 'NC',
    postcode: '28203',
    country: 'US'
  },
  {
    first_name: 'Emily',
    last_name: 'Rodriguez',
    email: 'emily.rodriguez@example.com',
    phone: '+1 (704) 555-0789',
    address_1: '890 Tryon Street',
    address_2: 'Suite 210',
    city: 'Charlotte',
    state: 'NC',
    postcode: '28202',
    country: 'US'
  }
];

async function createShippingOrders() {
  console.log('🚀 Creating test shipping orders...\n');

  // Get all vendors to see what's available
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, store_name')
    .limit(10);

  if (vendorError) {
    console.error('❌ Error fetching vendors:', vendorError);
  }

  console.log(`📋 Available vendors: ${vendors?.map(v => v.store_name).join(', ') || 'None found'}\n`);

  // Get Flora vendor or first available vendor
  let { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name')
    .ilike('store_name', '%flora%')
    .single();

  // If Flora not found, use first vendor
  if (!vendor && vendors && vendors.length > 0) {
    vendor = vendors[0];
    console.log(`⚠️  Flora vendor not found, using: ${vendor.store_name}`);
  }

  if (!vendor) {
    console.error('❌ No vendors found in database');
    process.exit(1);
  }

  console.log(`✅ Using vendor: ${vendor.store_name} (${vendor.id})\n`);

  // Get some products from Flora
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, stock_quantity, vendor_id')
    .eq('vendor_id', vendor.id)
    .limit(10);

  if (productsError) {
    console.error('❌ Error fetching products:', productsError);
  }

  if (!products || products.length === 0) {
    console.error('❌ No products found for this vendor');
    console.log('💡 Tip: Make sure the vendor has products in the database');
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products\n`);

  // Create 3 orders
  for (let i = 0; i < 3; i++) {
    const customerData = charlotteAddresses[i];

    console.log(`\n📦 Creating Order ${i + 1}...`);
    console.log(`   Customer: ${customerData.first_name} ${customerData.last_name}`);
    console.log(`   Ship to: ${customerData.city}, ${customerData.state}`);

    // Check if customer exists, otherwise create
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerData.email)
      .single();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          email: customerData.email,
          phone: customerData.phone,
          billing_address: {
            address_1: customerData.address_1,
            address_2: customerData.address_2,
            city: customerData.city,
            state: customerData.state,
            postcode: customerData.postcode,
            country: customerData.country
          }
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('❌ Failed to create customer:', customerError);
        continue;
      }

      customer = newCustomer;
      console.log('   ✅ Created customer');
    } else {
      console.log('   ✅ Using existing customer');
    }

    // Generate random order items (2-4 products per order)
    const numItems = Math.floor(Math.random() * 3) + 2;
    const orderProducts = products
      .sort(() => Math.random() - 0.5)
      .slice(0, numItems);

    const line_items = orderProducts.map(product => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      const quantityGrams = quantity * 28; // Convert oz to grams for testing

      return {
        product_id: product.id,
        name: product.name,
        quantity,
        quantity_grams: quantityGrams,
        quantity_display: `${quantity} oz`,
        price: parseFloat(product.price),
        image: null,
        tierName: 'Standard',
        orderType: 'delivery'
      };
    });

    const subtotal = line_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax_amount = subtotal * 0.0725; // 7.25% NC tax
    const shipping_amount = 15.99;
    const total_amount = subtotal + tax_amount + shipping_amount;

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        order_number: orderNumber,
        status: 'processing',
        payment_status: 'paid',
        fulfillment_status: 'unfulfilled',
        delivery_type: 'delivery',
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        currency: 'USD',
        payment_method: 'card',
        payment_method_title: 'Credit Card',
        shipping_method: 'standard',
        shipping_method_title: 'Standard Shipping (3-5 days)',
        billing_address: {
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          address_1: customerData.address_1,
          address_2: customerData.address_2,
          city: customerData.city,
          state: customerData.state,
          postcode: customerData.postcode,
          country: customerData.country,
          phone: customerData.phone,
          email: customerData.email
        },
        shipping_address: {
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          address_1: customerData.address_1,
          address_2: customerData.address_2,
          city: customerData.city,
          state: customerData.state,
          postcode: customerData.postcode,
          country: customerData.country,
          phone: customerData.phone
        },
        order_date: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Failed to create order:', orderError);
      continue;
    }

    console.log(`   ✅ Order created: ${orderNumber}`);

    // Create order items
    for (const item of line_items) {
      const lineTotal = item.price * item.quantity;

      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          quantity_grams: item.quantity_grams,
          quantity_display: item.quantity_display,
          unit_price: item.price,
          line_subtotal: lineTotal,
          line_total: lineTotal,
          tier_name: item.tierName,
          order_type: item.orderType,
          vendor_id: vendor.id,
          meta_data: {
            quantity_grams: item.quantity_grams,
            quantity_display: item.quantity_display
          }
        });

      if (itemError) {
        console.error('❌ Failed to create order item:', itemError);
        continue;
      }

      console.log(`   ✅ Added: ${item.name} (${item.quantity_display})`);
    }

    console.log(`   💰 Total: $${total_amount.toFixed(2)}`);
    console.log(`   ✅ Order ${i + 1} complete!`);
  }

  console.log('\n🎉 All test shipping orders created successfully!\n');
  console.log('These orders should now appear in your POS Shipping Queue.');
}

createShippingOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
