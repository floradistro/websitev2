#!/usr/bin/env node

/**
 * Smart Pricing Assignment
 * - ALL Flower → Retail Flower - Top Shelf
 * - ALL Vapes → Retail Vape (Custom)
 * - Concentrates → Match by type (Crumble/SHATTER/Hash Rosin)
 * - Hash Holes → Match by weight (1.5g/2.5g)
 * - Beverages → Match by mg (5mg/10mg/30mg/60mg)
 */

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
  console.log('🚀 Smart Pricing Assignment...\n');

  // 1. Get all blueprints
  const { data: blueprints } = await supabase
    .from('pricing_tier_blueprints')
    .select('id, name')
    .order('name');

  const blueprintMap = {};
  blueprints.forEach(b => {
    blueprintMap[b.name] = b.id;
  });

  console.log('📋 Available Blueprints:');
  Object.keys(blueprintMap).forEach(name => console.log(`   - ${name}`));

  // 2. Get all products with categories
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      vendor_id,
      primary_category:categories!primary_category_id(name)
    `)
    .not('primary_category_id', 'is', null);

  console.log(`\n📦 Found ${products.length} products\n`);

  // 3. Analyze and assign
  const assignments = [];
  const stats = {
    flower_top_shelf: 0,
    vape: 0,
    crumble: 0,
    shatter: 0,
    hash_rosin: 0,
    hash_hole_1_5g: 0,
    hash_hole_2_5g: 0,
    moonwater_5mg: 0,
    moonwater_10mg: 0,
    moonwater_30mg: 0,
    moonwater_60mg: 0,
    edibles: 0,
    unmatched: 0
  };

  for (const product of products) {
    const categoryName = product.primary_category?.name?.toLowerCase() || '';
    const productName = product.name?.toLowerCase() || '';
    let blueprintId = null;
    let matchType = '';

    // FLOWER → Retail Flower - Top Shelf
    if (categoryName.includes('flower') && !categoryName.includes('hash')) {
      blueprintId = blueprintMap['Retail Flower - Top Shelf (Custom)'];
      matchType = 'flower_top_shelf';
      stats.flower_top_shelf++;
    }
    // VAPE → Retail Vape (Custom)
    else if (categoryName.includes('vape') || categoryName.includes('cartridge') || categoryName.includes('cart')) {
      blueprintId = blueprintMap['Retail Vape (Custom)'];
      matchType = 'vape';
      stats.vape++;
    }
    // HASH HOLES → Match by weight
    else if (categoryName.includes('hash hole') || productName.includes('hash hole')) {
      if (productName.includes('1.5g') || productName.includes('1.3g')) {
        blueprintId = blueprintMap['HASH HOLES 1.5g'];
        matchType = 'hash_hole_1_5g';
        stats.hash_hole_1_5g++;
      } else if (productName.includes('2.5g')) {
        blueprintId = blueprintMap['HASH HOLE 2.5g'];
        matchType = 'hash_hole_2_5g';
        stats.hash_hole_2_5g++;
      }
    }
    // BEVERAGES → Match by mg
    else if (categoryName.includes('drinker') || categoryName.includes('golden') ||
             categoryName.includes('darkside') || categoryName.includes('riptide') ||
             productName.includes('moonwater')) {
      if (categoryName.includes('5mg') || productName.includes('5mg')) {
        blueprintId = blueprintMap['Moonwater 5mg'];
        matchType = 'moonwater_5mg';
        stats.moonwater_5mg++;
      } else if (categoryName.includes('10mg') || productName.includes('10mg')) {
        blueprintId = blueprintMap['MOONWATER 10MG'];
        matchType = 'moonwater_10mg';
        stats.moonwater_10mg++;
      } else if (categoryName.includes('30mg') || productName.includes('30mg')) {
        blueprintId = blueprintMap['MOONWATER 30MG'];
        matchType = 'moonwater_30mg';
        stats.moonwater_30mg++;
      } else if (categoryName.includes('60mg') || productName.includes('60mg')) {
        blueprintId = blueprintMap['MOONWATER 60MG'];
        matchType = 'moonwater_60mg';
        stats.moonwater_60mg++;
      }
    }
    // CONCENTRATES → Match by type
    else if (categoryName.includes('concentrate') || categoryName.includes('dab') ||
             categoryName.includes('wax') || categoryName.includes('shatter') ||
             categoryName.includes('crumble') || categoryName.includes('rosin')) {

      if (productName.includes('crumble')) {
        blueprintId = blueprintMap['Crumble'];
        matchType = 'crumble';
        stats.crumble++;
      } else if (productName.includes('shatter')) {
        blueprintId = blueprintMap['SHATTER'];
        matchType = 'shatter';
        stats.shatter++;
      } else if (productName.includes('rosin') || productName.includes('hash rosin')) {
        blueprintId = blueprintMap['Hash Rosin'];
        matchType = 'hash_rosin';
        stats.hash_rosin++;
      } else {
        // Default concentrates to Crumble
        blueprintId = blueprintMap['Crumble'];
        matchType = 'crumble';
        stats.crumble++;
      }
    }
    // EDIBLES → Retail Edibles (Custom)
    else if (categoryName.includes('edible') || categoryName.includes('gummies') ||
             categoryName.includes('cookie') || categoryName.includes('brownie')) {
      blueprintId = blueprintMap['Retail Edibles (Custom)'];
      matchType = 'edibles';
      stats.edibles++;
    }

    if (blueprintId) {
      assignments.push({
        product_id: product.id,
        blueprint_id: blueprintId,
        is_active: true,
        price_overrides: {}
      });
    } else {
      stats.unmatched++;
      console.log(`⚠️  Could not match: ${product.name} (${categoryName})`);
    }
  }

  console.log(`\n📊 Assignment Summary:`);
  console.log(`   Flower (Top Shelf): ${stats.flower_top_shelf}`);
  console.log(`   Vape: ${stats.vape}`);
  console.log(`   Crumble: ${stats.crumble}`);
  console.log(`   Shatter: ${stats.shatter}`);
  console.log(`   Hash Rosin: ${stats.hash_rosin}`);
  console.log(`   Hash Hole 1.5g: ${stats.hash_hole_1_5g}`);
  console.log(`   Hash Hole 2.5g: ${stats.hash_hole_2_5g}`);
  console.log(`   Moonwater 5mg: ${stats.moonwater_5mg}`);
  console.log(`   Moonwater 10mg: ${stats.moonwater_10mg}`);
  console.log(`   Moonwater 30mg: ${stats.moonwater_30mg}`);
  console.log(`   Moonwater 60mg: ${stats.moonwater_60mg}`);
  console.log(`   Edibles: ${stats.edibles}`);
  console.log(`   Unmatched: ${stats.unmatched}`);
  console.log(`   Total: ${assignments.length}\n`);

  // 4. Delete existing assignments
  console.log('🗑️  Removing existing assignments...');
  const { error: deleteError } = await supabase
    .from('product_pricing_assignments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('❌ Error deleting:', deleteError);
  } else {
    console.log('✅ Cleared existing assignments\n');
  }

  // 5. Insert new assignments
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

  console.log(`\n✅ Successfully assigned ${inserted} products!`);
  console.log(`\n🎯 Next: Test POS to verify pricing tiers are correct`);
}

main().catch(console.error);
