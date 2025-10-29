#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCustomerEmails() {
  console.log('🔍 Finding Flora Distro customers...\n');

  const vendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

  // Get order items for this vendor
  const { data: orderData } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('vendor_id', vendorId)
    .limit(1000);

  console.log(`📦 Found ${orderData?.length || 0} order items for Flora Distro`);

  if (!orderData || orderData.length === 0) {
    console.log('⚠️  No order items found');
    return;
  }

  // Get unique order IDs
  const orderIds = [...new Set(orderData.map(item => item.order_id))];
  console.log(`📋 Unique orders: ${orderIds.length}`);

  // Get customers from those orders
  const { data: orders } = await supabase
    .from('orders')
    .select('customer_id')
    .in('id', orderIds)
    .not('customer_id', 'is', null);

  console.log(`👥 Orders with customers: ${orders?.length || 0}`);

  if (!orders || orders.length === 0) {
    console.log('⚠️  No orders with customers found');
    return;
  }

  // Get unique customer IDs
  const customerIds = [...new Set(orders.map(o => o.customer_id))];
  console.log(`🆔 Unique customers: ${customerIds.length}`);

  // Get customer details
  const { data: customers } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name')
    .in('id', customerIds)
    .not('email', 'is', null)
    .limit(20);

  console.log(`\n📧 First 20 customers with email addresses:\n`);

  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ${c.email}`);
      console.log(`   Name: ${c.first_name || ''} ${c.last_name || ''}`);
    });

    console.log(`\n💡 Found ${customers.length} customers with emails`);
    console.log(`\n🧪 To test if any match Alpine IQ, run the sync with limit 50:`);
    console.log(`   curl -X POST http://localhost:3000/api/vendor/marketing/alpineiq/sync-loyalty \\`);
    console.log(`     -H "x-vendor-id: cd2e1122-d511-4edb-be5d-98ef274b4baf" \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"limit": 50}'`);
  } else {
    console.log('⚠️  No customers with email addresses found');
  }
}

testCustomerEmails().catch(console.error);
