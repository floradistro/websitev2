#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Checking product prices...\n');

  // Get first 10 products from Charlotte Central inventory
  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      product:products(
        id,
        name,
        price,
        primary_category:categories!primary_category_id(name)
      )
    `)
    .eq('location_id', 'c4eedafb-4050-4d2d-a6af-e164aad5d934')
    .gt('quantity', 0)
    .limit(10);

  console.log('Product Name | Category | Product Price');
  console.log('-------------------------------------------');

  for (const inv of inventory || []) {
    const p = inv.product;
    console.log(`${p.name.padEnd(30)} | ${(p.primary_category?.name || 'N/A').padEnd(15)} | $${p.price}`);
  }
}

main().catch(console.error);
