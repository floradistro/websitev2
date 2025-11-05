/**
 * Add top-shelf pricing tiers to flower products
 * Run with: npx tsx scripts/add-top-shelf-pricing-tiers.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Top-shelf flower pricing tiers
const TOP_SHELF_TIERS = [
  { weight: '1g', qty: 1, price: '15' },
  { weight: '3.5g', qty: 3.5, price: '45' },
  { weight: '7g', qty: 7, price: '80' },
  { weight: '14g', qty: 14, price: '150' },
  { weight: '28g', qty: 28, price: '280' },
];

const FLOWER_PRODUCTS = [
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

async function addPricingTiers() {
  console.log('🚀 Adding top-shelf pricing tiers to flower products...\n');

  // Get all flower products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku, meta_data')
    .eq('vendor_id', VENDOR_ID)
    .in('name', FLOWER_PRODUCTS);

  if (productsError || !products) {
    console.error('❌ Failed to fetch products:', productsError);
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products to update\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    console.log(`📦 Processing: ${product.name}`);

    // Update meta_data with pricing tiers
    const updatedMetaData = {
      ...(product.meta_data || {}),
      pricing_mode: 'tiered',
      pricing_blueprint_id: '1cee41d3-ea3a-4a17-a39d-4652c695583e',
      pricing_tiers: TOP_SHELF_TIERS
    };

    const { error: updateError } = await supabase
      .from('products')
      .update({
        meta_data: updatedMetaData
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`   ❌ Failed: ${updateError.message}`);
      errorCount++;
      continue;
    }

    console.log(`   ✅ Added ${TOP_SHELF_TIERS.length} pricing tiers`);
    successCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} products`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} products`);
  }
  console.log('='.repeat(60) + '\n');

  // Show sample pricing
  console.log('📋 Top-Shelf Pricing Tiers:');
  TOP_SHELF_TIERS.forEach(tier => {
    console.log(`   ${tier.weight.padEnd(6)} - $${tier.price}`);
  });
}

addPricingTiers().catch(console.error);
