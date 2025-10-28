/**
 * Fix missing vendor_id in orders table
 *
 * This script populates the vendor_id column in the orders table
 * by using the vendor_id from associated order_items.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixOrderVendorIds() {
  console.log('🔍 Finding orders with missing vendor_id...\n');

  // Get all orders with NULL vendor_id
  const { data: ordersWithoutVendor, error: ordersError } = await supabase
    .from('orders')
    .select('id, delivery_type, fulfillment_status, created_at')
    .is('vendor_id', null);

  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError);
    return;
  }

  if (!ordersWithoutVendor || ordersWithoutVendor.length === 0) {
    console.log('✅ No orders need fixing - all have vendor_id set!');
    return;
  }

  console.log(`📋 Found ${ordersWithoutVendor.length} orders with missing vendor_id\n`);

  let fixedCount = 0;
  let errorCount = 0;

  // Process each order
  for (const order of ordersWithoutVendor) {
    try {
      // Get the vendor_id from the first order_item
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('vendor_id')
        .eq('order_id', order.id)
        .not('vendor_id', 'is', null)
        .limit(1)
        .single();

      if (itemsError || !orderItems) {
        console.log(`⚠️  Order ${order.id}: No order_items with vendor_id found`);
        errorCount++;
        continue;
      }

      // Update the order with the vendor_id
      const { error: updateError } = await supabase
        .from('orders')
        .update({ vendor_id: orderItems.vendor_id })
        .eq('id', order.id);

      if (updateError) {
        console.error(`❌ Order ${order.id}: Failed to update -`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ Order ${order.id}: Updated vendor_id to ${orderItems.vendor_id}`);
        fixedCount++;
      }
    } catch (err) {
      console.error(`❌ Order ${order.id}: Unexpected error -`, err);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixedCount} orders`);
  console.log(`   ❌ Errors: ${errorCount} orders`);
  console.log(`   📋 Total processed: ${ordersWithoutVendor.length} orders\n`);
}

// Run the fix
fixOrderVendorIds()
  .then(() => {
    console.log('✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
