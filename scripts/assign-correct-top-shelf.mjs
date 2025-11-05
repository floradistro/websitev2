#!/usr/bin/env node

/**
 * Assign the CORRECT Top Shelf pricing tier to flower products
 * Uses "Retail Flower - Top Shelf (Custom)" blueprint that has vendor pricing configured
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const CORRECT_BLUEPRINT_ID = 'f408beb5-8ccf-45dd-9d98-6321d3d7fab7'; // Retail Flower - Top Shelf (Custom)

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
  console.log('🚀 Assigning CORRECT Top Shelf pricing...\n');

  // 1. Verify the blueprint
  const { data: blueprint } = await supabase
    .from('pricing_tier_blueprints')
    .select('*')
    .eq('id', CORRECT_BLUEPRINT_ID)
    .single();

  console.log(`✅ Blueprint: ${blueprint.name}`);
  console.log(`   Quality Tier: ${blueprint.quality_tier}`);
  console.log(`   ID: ${blueprint.id}\n`);

  // 2. Verify vendor pricing config exists
  const { data: vendorConfig } = await supabase
    .from('vendor_pricing_configs')
    .select('*')
    .eq('vendor_id', VENDOR_ID)
    .eq('blueprint_id', CORRECT_BLUEPRINT_ID)
    .single();

  if (!vendorConfig) {
    console.error('❌ NO VENDOR PRICING CONFIG FOR THIS BLUEPRINT!');
    process.exit(1);
  }

  console.log(`✅ Vendor pricing config exists:`);
  console.log(`   ${JSON.stringify(vendorConfig.pricing_values, null, 2)}\n`);

  // 3. Get products
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('vendor_id', VENDOR_ID)
    .in('name', PRODUCT_NAMES);

  console.log(`✅ Found ${products.length} products\n`);

  // 4. Delete old assignments
  const productIds = products.map(p => p.id);
  await supabase
    .from('product_pricing_assignments')
    .delete()
    .in('product_id', productIds);

  console.log(`✅ Cleared old assignments\n`);

  // 5. Create correct assignments
  const assignments = products.map(p => ({
    product_id: p.id,
    blueprint_id: CORRECT_BLUEPRINT_ID,
    is_active: true,
    price_overrides: {}
  }));

  const { data: inserted, error } = await supabase
    .from('product_pricing_assignments')
    .insert(assignments)
    .select();

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log(`✅ Created ${inserted.length} assignments\n`);
  console.log('='.repeat(60));
  console.log('✅ DONE - Pricing should now show on storefront');
  console.log('='.repeat(60));
}

main().catch(console.error);
