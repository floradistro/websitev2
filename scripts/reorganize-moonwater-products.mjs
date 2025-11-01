#!/usr/bin/env node

/**
 * Reorganize Moonwater Products to Match Official Website
 *
 * Based on trymoonwater.com product structure:
 * - 5mg = Day Drinker (no line suffix in name)
 * - 10mg = Golden Hour
 * - 30mg = Darkside
 * - 60mg = Riptide
 *
 * Product Name Format: "Moonwater [Flavor] - [Line]" (except 5mg which is just "Moonwater [Flavor]")
 * Standardize flavor capitalization to Title Case
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseKey);

const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Line names based on dosage (matching trymoonwater.com)
const DOSAGE_TO_LINE = {
  '5mg': 'Day Drinker',
  '10mg': 'Golden Hour',
  '30mg': 'Darkside',
  '60mg': 'Riptide'
};

// Standardize flavor names to Title Case (matching website)
function standardizeFlavor(flavor) {
  const flavorMap = {
    'CLEMENTINE ORANGE': 'Clementine Orange',
    'FIZZY LEMONADE': 'Fizzy Lemonade',
    'FIZZY PUNCH': 'Fizzy Punch',
    'LEMON GINGER': 'Lemon Ginger',
    'BERRY TWIST': 'Berry Twist',
    'COLD CLEMENTINE': 'Cold Clementine',
    'Carolina Cola': 'Carolina Cola',
    'Berry Twist': 'Berry Twist'
  };

  return flavorMap[flavor] || flavor;
}

// Generate proper product name based on dosage and flavor
function generateProductName(dosage, flavor) {
  const standardFlavor = standardizeFlavor(flavor);
  const line = DOSAGE_TO_LINE[dosage];

  // 5mg Day Drinker has no line suffix
  if (dosage === '5mg') {
    return `Moonwater ${standardFlavor}`;
  }

  // All other dosages include the line name
  return `Moonwater ${standardFlavor} - ${line}`;
}

async function reorganizeMoonwaterProducts() {
  console.log('🔍 Loading Moonwater products...\n');

  // Get all Moonwater products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, meta_data')
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .ilike('name', 'Moonwater%')
    .order('meta_data->dosage', 'meta_data->flavor');

  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }

  console.log(`📋 Found ${products.length} Moonwater products\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const dosage = product.meta_data?.dosage;
    const flavor = product.meta_data?.flavor;

    if (!dosage || !flavor) {
      console.log(`⚠️  SKIP: "${product.name}" - Missing dosage or flavor metadata`);
      skipped++;
      continue;
    }

    const newName = generateProductName(dosage, flavor);
    const line = DOSAGE_TO_LINE[dosage];
    const standardFlavor = standardizeFlavor(flavor);

    // Check if name needs updating
    if (product.name === newName &&
        product.meta_data?.line === line &&
        product.meta_data?.flavor === standardFlavor) {
      console.log(`✓ SKIP: "${product.name}" - Already correct`);
      skipped++;
      continue;
    }

    console.log(`📝 UPDATE: "${product.name}" → "${newName}"`);
    console.log(`   ├─ Dosage: ${dosage}`);
    console.log(`   ├─ Flavor: ${flavor} → ${standardFlavor}`);
    console.log(`   └─ Line: ${line}`);

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: newName,
        meta_data: {
          ...product.meta_data,
          dosage: dosage,
          flavor: standardFlavor,
          line: line
        }
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`   ❌ Error updating: ${updateError.message}`);
      errors++;
    } else {
      console.log(`   ✅ Updated successfully\n`);
      updated++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📦 Total: ${products.length}`);
  console.log('='.repeat(60));
}

// Run the script
reorganizeMoonwaterProducts().catch(console.error);
