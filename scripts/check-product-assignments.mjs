#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Checking product pricing assignments...\n');

  // Get first 10 products with their assignments
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      vendor:vendors(id, store_name),
      primary_category:categories!primary_category_id(name),
      product_pricing_assignments(
        id,
        is_active,
        blueprint:pricing_tier_blueprints(id, name, price_breaks)
      )
    `)
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log(`📦 Checking first ${products.length} products:\n`);

  products.forEach(product => {
    const assignment = product.product_pricing_assignments?.[0];
    console.log(`\n${product.name}`);
    console.log(`  Vendor: ${product.vendor?.store_name}`);
    console.log(`  Category: ${product.primary_category?.name || 'None'}`);
    if (assignment) {
      console.log(`  Blueprint: ${assignment.blueprint?.name}`);
      console.log(`  Price breaks: ${assignment.blueprint?.price_breaks?.length || 0}`);
      console.log(`  Active: ${assignment.is_active ? '✅' : '❌'}`);
    } else {
      console.log(`  ⚠️  NO ASSIGNMENT`);
    }
  });

  // Check if vendor has pricing for the assigned blueprint
  console.log('\n\n🔍 Checking vendor pricing configs for assigned blueprints...\n');

  for (const product of products) {
    const assignment = product.product_pricing_assignments?.[0];
    if (!assignment || !product.vendor) continue;

    const { data: config } = await supabase
      .from('vendor_pricing_configs')
      .select('id, pricing_values, is_active')
      .eq('vendor_id', product.vendor.id)
      .eq('blueprint_id', assignment.blueprint.id)
      .single();

    console.log(`${product.name} (${product.vendor.store_name})`);
    if (config) {
      const priceCount = Object.keys(config.pricing_values || {}).length;
      console.log(`  ✅ Config found: ${priceCount} prices ${config.is_active ? '(active)' : '(inactive)'}`);
    } else {
      console.log(`  ❌ NO CONFIG for ${assignment.blueprint.name}`);
    }
  }
}

main().catch(console.error);
