#!/usr/bin/env node

/**
 * Cleanup Concentrate Product Names
 *
 * This script:
 * 1. Extracts consistency (Shatter, Rosin, etc.) from product names
 * 2. Updates product name to just be the strain name
 * 3. Sets the consistency field properly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseKey);

const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Consistency patterns - map variations to standard values
const CONSISTENCY_MAP = {
  'Rosin': 'Rosin',
  'Shatter': 'Shatter',
  'Wax': 'Wax',
  'Live Resin': 'Live Resin',
  'Distillate': 'Distillate',
  'Crumble': 'Crumble',
  'Budder': 'Budder',
  'Sauce': 'Sauce'
};

async function cleanupConcentrates() {
  console.log('🔍 Finding concentrate products for Flora Distro...\n');

  // Get concentrates category
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .ilike('name', '%concentrate%')
    .single();

  if (!categories) {
    console.error('❌ Could not find Concentrates category');
    return;
  }

  console.log(`📦 Found category: ${categories.name} (${categories.id})\n`);

  // Get all concentrate products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, blueprint_fields, primary_category_id')
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .eq('primary_category_id', categories.id)
    .order('name');

  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }

  console.log(`📋 Found ${products.length} concentrate products\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    // Check if name contains " – " separator
    if (!product.name.includes(' – ')) {
      console.log(`⏭️  SKIP: "${product.name}" - No separator found`);
      skipped++;
      continue;
    }

    // Extract consistency and strain name
    const [consistencyPart, ...strainParts] = product.name.split(' – ');
    const strainName = strainParts.join(' – ').trim();
    const consistency = consistencyPart.trim();

    // Validate consistency
    if (!CONSISTENCY_MAP[consistency]) {
      console.log(`⚠️  SKIP: "${product.name}" - Unknown consistency: "${consistency}"`);
      skipped++;
      continue;
    }

    const standardConsistency = CONSISTENCY_MAP[consistency];

    // Prepare updated blueprint_fields
    const currentFields = product.blueprint_fields || {};
    const updatedFields = {
      ...currentFields,
      consistency: standardConsistency
    };

    console.log(`📝 UPDATE: "${product.name}"`);
    console.log(`   ├─ New Name: "${strainName}"`);
    console.log(`   └─ Consistency: "${standardConsistency}"`);

    // Update the product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: strainName,
        blueprint_fields: updatedFields
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
cleanupConcentrates().catch(console.error);
