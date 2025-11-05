#!/usr/bin/env node

/**
 * Assign Top Shelf pricing tier to specific flower products
 * Run with: node scripts/assign-top-shelf-to-products.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Products to assign top-shelf pricing
const PRODUCT_NAMES = [
  'Garlic Breath',
  'GMO',
  'Fizz',
  'Lemon Cherry Gelato',
  'Banana Punch',
  'Kush Mintz',
  'Super Boof',
  'Runtz',
  'Black Cherry Gelato',
  'Lemon Tree',
  'Sour Guava',
  'Blue Zushi'
];

async function main() {
  console.log('🚀 Assigning Top Shelf pricing to flower products...\n');

  // 1. Find the "Retail Flower - Top Shelf (Custom)" blueprint
  const { data: blueprints, error: blueprintsError } = await supabase
    .from('pricing_tier_blueprints')
    .select('id, name, quality_tier')
    .eq('vendor_id', VENDOR_ID)
    .eq('quality_tier', 'top-shelf');

  if (blueprintsError || !blueprints || blueprints.length === 0) {
    console.error('❌ Error fetching top-shelf blueprint:', blueprintsError);
    process.exit(1);
  }

  const topShelfBlueprint = blueprints[0];
  console.log(`✅ Found blueprint: ${topShelfBlueprint.name} (${topShelfBlueprint.id})\n`);

  // 2. Get the products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .eq('vendor_id', VENDOR_ID)
    .in('name', PRODUCT_NAMES);

  if (productsError || !products) {
    console.error('❌ Error fetching products:', productsError);
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products:\n`);
  products.forEach(p => console.log(`   - ${p.name}`));
  console.log();

  // 3. Check for missing products
  const foundNames = products.map(p => p.name);
  const missingProducts = PRODUCT_NAMES.filter(name => !foundNames.includes(name));
  if (missingProducts.length > 0) {
    console.log('⚠️  Missing products:');
    missingProducts.forEach(name => console.log(`   - ${name}`));
    console.log();
  }

  // 4. Create assignments
  const assignments = products.map(product => ({
    product_id: product.id,
    blueprint_id: topShelfBlueprint.id,
    is_active: true,
    price_overrides: {}
  }));

  console.log(`📝 Creating ${assignments.length} pricing assignments...\n`);

  // 5. Delete existing assignments for these products
  const productIds = products.map(p => p.id);
  const { error: deleteError } = await supabase
    .from('product_pricing_assignments')
    .delete()
    .in('product_id', productIds);

  if (deleteError) {
    console.warn('⚠️  Could not delete existing assignments:', deleteError);
  } else {
    console.log('✅ Cleared existing assignments for these products\n');
  }

  // 6. Insert new assignments
  const { data: inserted, error: insertError } = await supabase
    .from('product_pricing_assignments')
    .insert(assignments)
    .select();

  if (insertError) {
    console.error('❌ Error creating assignments:', insertError);
    process.exit(1);
  }

  console.log(`✅ Successfully assigned Top Shelf pricing to ${inserted.length} products!\n`);
  console.log('='.repeat(60));
  console.log('✅ COMPLETE - Pricing tiers should now display on storefront');
  console.log('='.repeat(60));
}

main().catch(console.error);
