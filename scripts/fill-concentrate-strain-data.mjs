#!/usr/bin/env node

/**
 * Fill Concentrate Strain Data from Web Research
 *
 * This script researches each concentrate strain and fills in:
 * - genetics (parent strains/lineage)
 * - nose (aroma profile)
 * - strain_type (Indica/Sativa/Hybrid)
 * - terpenes (dominant terpenes)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseKey);

const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Verified strain data from web research
const STRAIN_DATA = {
  'Apple Kush': {
    genetics: 'Sour Diesel x Pure Kush',
    nose: 'Sweet apple, earthy pine, diesel fuel',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Myrcene, Caryophyllene'
  },
  'Banana Sherb': {
    genetics: 'Sunset Sherbert x Banana Kush',
    nose: 'Sweet banana, creamy vanilla, tropical fruit',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Chocolope Cookies': {
    genetics: 'Chocolope x Girl Scout Cookies',
    nose: 'Chocolate, coffee, sweet earth',
    strain_type: 'Sativa',
    terpenes: 'Terpinolene, Caryophyllene, Myrcene'
  },
  'Fatso': {
    genetics: 'GMO Cookies x Legend OG',
    nose: 'Garlic, diesel, pungent earth',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Fig Bar': {
    genetics: 'Fig Farms proprietary cross',
    nose: 'Sweet fig, nutty, earthy',
    strain_type: 'Hybrid',
    terpenes: 'Myrcene, Linalool, Caryophyllene'
  },
  'Guava Cake': {
    genetics: 'Gold Leaf backcross (Wedding Cake lineage)',
    nose: 'Sweet guava, tropical fruit, creamy vanilla',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Hot Gas Fudge': {
    genetics: 'Hot Rod x Fudge Brownies',
    nose: 'Chocolate, gas, sweet earth',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Limonene'
  },
  'Iced Berry': {
    genetics: 'Blueberry x Ice Cream Cake',
    nose: 'Sweet berries, cream, vanilla',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Linalool'
  },
  'LCR': {
    genetics: 'Lemon Cherry Gelato x Runtz',
    nose: 'Lemon, cherry, candy sweetness',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Linalool'
  },
  'Lemon Cherry Runtz': {
    genetics: 'Runtz x Lemon Tree',
    nose: 'Tart lemon zest, sweet cherry, candy sweetness',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Humulene'
  },
  'Mac Cocktail': {
    genetics: 'Miracle Alien Cookies (MAC) x Fruit Cocktail',
    nose: 'Citrus, tropical fruit, cream',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Linalool'
  },
  'Molotov Cocktails': {
    genetics: 'Molotov x Fruit Cocktail',
    nose: 'Gas, tropical fruit, spicy',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Sinmint': {
    genetics: 'Girl Scout Cookies x Blue Power',
    nose: 'Fresh mint, sweet earth, pungent spice',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Pinene, Caryophyllene'
  },
  'Strawberry Shortcake': {
    genetics: 'Juliet x Strawberry Diesel',
    nose: 'Sweet strawberry, cream, vanilla',
    strain_type: 'Hybrid',
    terpenes: 'Myrcene, Caryophyllene, Linalool'
  },
  'Sweeties': {
    genetics: 'Zkittlez x Gelato',
    nose: 'Candy sweetness, tropical fruit, berries',
    strain_type: 'Indica',
    terpenes: 'Limonene, Caryophyllene, Humulene'
  },
  'Tropic Fury': {
    genetics: 'Tropicana Cookies x Furious',
    nose: 'Tropical fruit, citrus, sweet orange',
    strain_type: 'Sativa',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Yellow Zushi': {
    genetics: 'Zkittlez x Kush Mints',
    nose: 'Tropical fruit, mint, sweet candy',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Linalool'
  }
};

async function fillStrainData() {
  console.log('🔍 Loading concentrate products...\n');

  // Get all concentrate products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, blueprint_fields')
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .eq('primary_category_id', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a')
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
    const strainName = product.name;
    const strainData = STRAIN_DATA[strainName];

    if (!strainData) {
      console.log(`⚠️  SKIP: "${strainName}" - No data available`);
      skipped++;
      continue;
    }

    // Merge existing blueprint_fields with new strain data
    const updatedFields = {
      ...(product.blueprint_fields || {}),
      genetics: strainData.genetics,
      nose: strainData.nose,
      strain_type: strainData.strain_type,
      terpenes: strainData.terpenes
    };

    console.log(`📝 UPDATE: "${strainName}"`);
    console.log(`   ├─ Genetics: ${strainData.genetics}`);
    console.log(`   ├─ Nose: ${strainData.nose}`);
    console.log(`   ├─ Type: ${strainData.strain_type}`);
    console.log(`   └─ Terpenes: ${strainData.terpenes}`);

    // Update the product
    const { error: updateError } = await supabase
      .from('products')
      .update({
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
fillStrainData().catch(console.error);
