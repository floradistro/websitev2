#!/usr/bin/env tsx
/**
 * Quick test for zero stock product creation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function testZeroStock() {
  console.log('🧪 Testing zero stock product creation...\n');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `QUICK TEST Zero Stock ${Date.now()}`,
        slug: `quick-test-${Date.now()}`,
        sku: `QUICK-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: 0,
      p_variants: null,
    });

    if (error) {
      console.log('❌ FAILED:', error.message);
      console.log('\nThis means the function still has the old code.');
      console.log('The fix needs to be redeployed.\n');
      process.exit(1);
    }

    console.log('✅ SUCCESS! Zero stock product created');
    console.log('\nResult:');
    console.log(JSON.stringify(data, null, 2));

    // Cleanup
    if (data?.product_id) {
      await supabase.from('products').delete().eq('id', data.product_id);
      console.log('\n🧹 Cleaned up test product');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Test crashed:', err);
    process.exit(1);
  }
}

testZeroStock();
