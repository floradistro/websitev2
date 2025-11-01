#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Debugging pricing tier mismatch...\n');

  // Get first 3 products from Charlotte Central inventory
  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      id,
      product:products(
        id,
        name,
        vendor_id,
        vendor:vendors(store_name),
        assignments:product_pricing_assignments(
          blueprint_id,
          is_active,
          blueprint:pricing_tier_blueprints(id, name)
        )
      )
    `)
    .eq('location_id', 'c4eedafb-4050-4d2d-a6af-e164aad5d934')
    .gt('quantity', 0)
    .limit(3);

  for (const inv of inventory || []) {
    const product = inv.product;
    const assignment = product.assignments?.[0];

    console.log(`\n📦 ${product.name}`);
    console.log(`   Vendor: ${product.vendor?.store_name} (${product.vendor_id})`);

    if (!assignment) {
      console.log(`   ❌ NO PRICING ASSIGNMENT`);
      continue;
    }

    console.log(`   Assignment Blueprint: ${assignment.blueprint?.name} (${assignment.blueprint_id})`);

    // Check if vendor has pricing config for this blueprint
    const { data: config } = await supabase
      .from('vendor_pricing_configs')
      .select('id, pricing_values, is_active')
      .eq('vendor_id', product.vendor_id)
      .eq('blueprint_id', assignment.blueprint_id)
      .single();

    if (!config) {
      console.log(`   ❌ NO VENDOR PRICING CONFIG for this blueprint`);
    } else {
      const priceCount = Object.keys(config.pricing_values || {}).length;
      console.log(`   ✅ Vendor config found: ${priceCount} prices, ${config.is_active ? 'active' : 'inactive'}`);
      console.log(`   Price values:`, config.pricing_values);
    }
  }
}

main().catch(console.error);
