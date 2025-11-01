#!/usr/bin/env node

/**
 * Fill Vape Strain Data from Web Research
 *
 * This script fills vape product fields with:
 * - genetics (parent strains/lineage)
 * - nose (aroma profile)
 * - strain_type (Indica/Sativa/Hybrid)
 * - terpenes (dominant terpenes)
 * - tank_size (all are 1g disposables)
 * - vape_type (all are Disposable)
 *
 * Does NOT fill: thca_percentage, d9_percentage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseKey);

const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const VAPE_CATEGORY_ID = '33f4655c-9a42-429c-b46b-ff0100d8d132';

// Verified strain data from web research
const STRAIN_DATA = {
  'G33': {
    genetics: 'Gorilla Glue #4 x Gelato 33',
    nose: 'Sweet cream, diesel, pine',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Gelato 33': {
    genetics: 'Sunset Sherbet x Thin Mint Girl Scout Cookies',
    nose: 'Sweet cream, citrus, berry',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Girl Scout Cookie': {
    genetics: 'OG Kush x Durban Poison',
    nose: 'Mint, sweet cherry, lemon',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Jet Fuel': {
    genetics: 'Aspen OG x High Country Diesel',
    nose: 'Diesel fuel, earthy, citrus',
    strain_type: 'Sativa',
    terpenes: 'Myrcene, Limonene, Caryophyllene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Jungle Cake': {
    genetics: 'White Fire #43 x Wedding Cake',
    nose: 'Sweet pastry, black pepper, toasted nuts',
    strain_type: 'Hybrid',
    terpenes: 'Myrcene, Caryophyllene, Limonene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Orange Candy Crush': {
    genetics: 'California Orange x Blueberry',
    nose: 'Sweet orange, citrus, berry',
    strain_type: 'Sativa',
    terpenes: 'Limonene, Myrcene, Pinene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Pink Lemonade': {
    genetics: 'Lemon Skunk x Purple Kush',
    nose: 'Sweet lemon, citrus, fruity',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Myrcene, Caryophyllene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Sprite': {
    genetics: 'Sprite OG x White Runtz',
    nose: 'Sweet citrus, earthy, floral',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Linalool, Caryophyllene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'Super Skunk': {
    genetics: 'Skunk #1 x Afghani',
    nose: 'Pungent skunk, earthy, pine',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Limonene',
    tank_size: '1g',
    vape_type: 'Disposable'
  },
  'White Truffle': {
    genetics: 'Gorilla Butter (Gorilla Glue #4 x Peanut Butter Breath)',
    nose: 'Earthy, nutty, pungent garlic',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Limonene, Caryophyllene',
    tank_size: '1g',
    vape_type: 'Disposable'
  }
};

async function fillVapeData() {
  console.log('🔍 Loading vape products...\n');

  // Get all vape products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, custom_fields')
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .eq('primary_category_id', VAPE_CATEGORY_ID)
    .order('name');

  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }

  console.log(`📋 Found ${products.length} vape products\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const strainName = product.name;
    const strainData = STRAIN_DATA[strainName];

    if (!strainData) {
      console.log(`⚠️  SKIP: "${strainName}" - No data available`);
      skipped++;
      continue;
    }

    // Merge existing custom_fields with new strain data
    const currentFields = typeof product.custom_fields === 'object' && !Array.isArray(product.custom_fields)
      ? product.custom_fields
      : {};

    const updatedFields = {
      ...currentFields,
      genetics: strainData.genetics,
      nose: strainData.nose,
      strain_type: strainData.strain_type,
      terpenes: strainData.terpenes,
      tank_size: strainData.tank_size,
      vape_type: strainData.vape_type
    };

    console.log(`📝 UPDATE: "${strainName}"`);
    console.log(`   ├─ Genetics: ${strainData.genetics}`);
    console.log(`   ├─ Nose: ${strainData.nose}`);
    console.log(`   ├─ Type: ${strainData.strain_type}`);
    console.log(`   ├─ Terpenes: ${strainData.terpenes}`);
    console.log(`   ├─ Tank Size: ${strainData.tank_size}`);
    console.log(`   └─ Vape Type: ${strainData.vape_type}`);

    // Update the product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        custom_fields: updatedFields
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
fillVapeData().catch(console.error);
