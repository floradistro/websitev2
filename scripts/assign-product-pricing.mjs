#!/usr/bin/env node

/**
 * Assign pricing tiers to all products
 * - Flower products get the Flower pricing tier
 * - Concentrate products get the Concentrate pricing tier
 * - Vape products get the Vape pricing tier
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

async function main() {
  console.log('🚀 Starting pricing tier assignment...\n');

  // 1. Get all pricing tier blueprints
  const { data: blueprints, error: blueprintsError } = await supabase
    .from('pricing_tier_blueprints')
    .select('id, name')
    .order('name');

  if (blueprintsError) {
    console.error('❌ Error fetching blueprints:', blueprintsError);
    process.exit(1);
  }

  console.log('📋 Available pricing blueprints:');
  blueprints.forEach(b => console.log(`   - ${b.name} (${b.id})`));

  // Map blueprint names to IDs
  const blueprintMap = {};
  blueprints.forEach(b => {
    const nameLower = b.name.toLowerCase();
    blueprintMap[nameLower] = b.id;

    // Also create simplified keys for easier matching
    if (nameLower.includes('flower')) {
      blueprintMap['flower'] = blueprintMap['flower'] || b.id;
    }
    if (nameLower.includes('concentrate') || nameLower.includes('shatter') || nameLower.includes('crumble') || nameLower.includes('rosin')) {
      blueprintMap['concentrate'] = blueprintMap['concentrate'] || b.id;
    }
    if (nameLower.includes('vape')) {
      blueprintMap['vape'] = blueprintMap['vape'] || b.id;
    }
  });

  console.log(`\n🔑 Blueprint mapping:`);
  console.log(`   - flower → ${blueprintMap['flower']}`);
  console.log(`   - concentrate → ${blueprintMap['concentrate']}`);
  console.log(`   - vape → ${blueprintMap['vape']}\n`);

  // 2. Get all products with their categories
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, vendor_id, primary_category:categories!primary_category_id(name)')
    .not('primary_category_id', 'is', null);

  if (productsError) {
    console.error('❌ Error fetching products:', productsError);
    process.exit(1);
  }

  console.log(`\n📦 Found ${products.length} products with categories\n`);

  // 3. Assign pricing tiers based on category
  const assignments = [];
  let flowerCount = 0;
  let concentrateCount = 0;
  let vapeCount = 0;
  let otherCount = 0;

  for (const product of products) {
    const categoryName = product.primary_category?.name?.toLowerCase() || '';
    let blueprintId = null;

    if (categoryName.includes('flower')) {
      blueprintId = blueprintMap['flower'];
      flowerCount++;
    } else if (categoryName.includes('concentrate') || categoryName.includes('dab') || categoryName.includes('wax')) {
      blueprintId = blueprintMap['concentrate'] || blueprintMap['concentrates'];
      concentrateCount++;
    } else if (categoryName.includes('vape') || categoryName.includes('cartridge') || categoryName.includes('cart')) {
      blueprintId = blueprintMap['vape'] || blueprintMap['vapes'];
      vapeCount++;
    } else {
      // Default to flower for unknown categories
      blueprintId = blueprintMap['flower'];
      otherCount++;
      console.log(`⚠️  Unknown category "${categoryName}" for ${product.name}, defaulting to Flower`);
    }

    if (blueprintId) {
      assignments.push({
        product_id: product.id,
        blueprint_id: blueprintId,
        is_active: true,
        price_overrides: {}
      });
    }
  }

  console.log(`\n📊 Assignment Summary:`);
  console.log(`   - Flower: ${flowerCount}`);
  console.log(`   - Concentrate: ${concentrateCount}`);
  console.log(`   - Vape: ${vapeCount}`);
  console.log(`   - Other: ${otherCount}`);
  console.log(`   - Total: ${assignments.length}\n`);

  // 4. Delete existing assignments
  console.log('🗑️  Removing existing assignments...');
  const { error: deleteError } = await supabase
    .from('product_pricing_assignments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('❌ Error deleting old assignments:', deleteError);
  } else {
    console.log('✅ Cleared existing assignments\n');
  }

  // 5. Insert new assignments in batches
  console.log('📝 Creating new assignments...');
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < assignments.length; i += batchSize) {
    const batch = assignments.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('product_pricing_assignments')
      .insert(batch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError);
    } else {
      inserted += batch.length;
      console.log(`   ✅ Inserted ${inserted}/${assignments.length} assignments`);
    }
  }

  console.log(`\n✅ Successfully assigned pricing tiers to ${inserted} products!`);
  console.log(`\n💡 Next: Configure vendor pricing for each tier in the Products > Pricing page`);
}

main().catch(console.error);
