#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function main() {
  console.log('🔍 Checking Flora Distro customers...\n');

  // Get all vendor_customers for Flora Distro
  const { data, error } = await supabase
    .from('vendor_customers')
    .select(`
      id,
      vendor_customer_number,
      loyalty_points,
      loyalty_tier,
      total_orders,
      total_spent,
      last_purchase_date,
      created_at,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total vendor_customers records: ${data.length}`);
  console.log(`📊 Records with customer data: ${data.filter(vc => vc.customers).length}`);
  console.log(`📊 Records with NULL customer: ${data.filter(vc => !vc.customers).length}\n`);

  // Show first 10 customers
  console.log('👥 First 10 customers:\n');
  data.slice(0, 10).forEach((vc, i) => {
    if (vc.customers) {
      console.log(`${i + 1}. ${vc.customers.first_name} ${vc.customers.last_name}`);
      console.log(`   Email: ${vc.customers.email}`);
      console.log(`   Phone: ${vc.customers.phone || 'N/A'}`);
      console.log(`   Points: ${vc.loyalty_points || 0} | Tier: ${vc.loyalty_tier || 'bronze'}`);
      console.log(`   Orders: ${vc.total_orders || 0} | Spent: $${vc.total_spent || 0}`);
      console.log('');
    } else {
      console.log(`${i + 1}. ⚠️  NULL customer (orphaned record)`);
      console.log(`   Vendor Customer ID: ${vc.id}`);
      console.log('');
    }
  });

  // Check for any with null last_purchase_date
  const noLastPurchase = data.filter(vc => !vc.last_purchase_date);
  console.log(`\n📊 Customers with no last_purchase_date: ${noLastPurchase.length}`);
}

main().catch(console.error);
