#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function cleanup() {
  console.log('\n' + '='.repeat(80));
  console.log('🧹 CLEANING UP TEST DATA');
  console.log('='.repeat(80) + '\n');

  // Find all test customers
  const testCustomerPatterns = [
    'test.pos@floradistro.test',
    '%@test.com',
    'Stress Test%',
    'Multi%Test',
    'Oversell%Test',
    'Tier%Test',
    'Concurrent%Test',
    'AlpineIQ%Test',
    'Large%Test',
    'Low%Test',
    'RaceTest%'
  ];

  let totalCustomersDeleted = 0;
  let totalOrdersDeleted = 0;
  let totalLoyaltyDeleted = 0;

  for (const pattern of testCustomerPatterns) {
    const { data: testCustomers } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .or(`email.like.${pattern},first_name.like.${pattern}`)
      .limit(1000);

    if (testCustomers && testCustomers.length > 0) {
      console.log(`\n📋 Found ${testCustomers.length} customers matching "${pattern}"`);

      for (const customer of testCustomers) {
        console.log(`   Deleting: ${customer.first_name} ${customer.last_name} (${customer.email})`);

        // Delete related orders (CASCADE will handle order_items)
        const { data: orders } = await supabase
          .from('orders')
          .delete()
          .eq('customer_id', customer.id)
          .select('id');

        if (orders) {
          console.log(`      ↳ Deleted ${orders.length} orders`);
          totalOrdersDeleted += orders.length;
        }

        // Delete loyalty records
        const { data: loyalty } = await supabase
          .from('customer_loyalty')
          .delete()
          .eq('customer_id', customer.id)
          .select('id');

        if (loyalty) {
          totalLoyaltyDeleted += loyalty.length;
        }

        // Delete loyalty transactions
        await supabase
          .from('loyalty_transactions')
          .delete()
          .eq('customer_id', customer.id);

        // Delete vendor_customers link
        await supabase
          .from('vendor_customers')
          .delete()
          .eq('customer_id', customer.id);

        // Delete customer
        await supabase
          .from('customers')
          .delete()
          .eq('id', customer.id);

        totalCustomersDeleted++;
      }
    }
  }

  // Delete test POS orders from today (walk-in customers or missed tests)
  const today = new Date().toISOString().split('T')[0];
  const { data: todayOrders } = await supabase
    .from('orders')
    .delete()
    .eq('vendor_id', FLORA_VENDOR_ID)
    .like('order_number', `POS-CHA-${today.replace(/-/g, '')}-%`)
    .is('customer_id', null) // Walk-in orders
    .select('id, order_number');

  if (todayOrders) {
    console.log(`\n📦 Deleted ${todayOrders.length} walk-in POS orders from today`);
    totalOrdersDeleted += todayOrders.length;
  }

  // Clean up Alpine IQ sync queue
  const { data: queueItems } = await supabase
    .from('alpine_iq_sync_queue')
    .delete()
    .eq('vendor_id', FLORA_VENDOR_ID)
    .eq('status', 'pending')
    .select('id');

  console.log(`\n🔄 Deleted ${queueItems?.length || 0} pending Alpine IQ sync queue items`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ CLEANUP COMPLETE');
  console.log('='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Customers Deleted: ${totalCustomersDeleted}`);
  console.log(`   Orders Deleted: ${totalOrdersDeleted}`);
  console.log(`   Loyalty Records Deleted: ${totalLoyaltyDeleted}`);
  console.log(`   Alpine IQ Queue Cleaned: ${queueItems?.length || 0}\n`);
}

cleanup().catch(console.error);
