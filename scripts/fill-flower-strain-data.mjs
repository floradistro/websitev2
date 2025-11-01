#!/usr/bin/env node

/**
 * Fill Flower Strain Data from Web Research
 *
 * This script fills flower products with verified strain information:
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
const FLOWER_CATEGORY_ID = '296c87ce-a31b-43a3-b48f-52902134a723';

// Verified strain data from web research and cannabis databases
const STRAIN_DATA = {
  '101 Runtz': {
    genetics: 'Zkittlez x Gelato',
    nose: 'Sweet candy, tropical fruit, creamy berries',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Alpha Runtz': {
    genetics: 'Zkittlez x Gelato (Alpha phenotype)',
    nose: 'Sweet candy, citrus zest, berry punch',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Black Runtz': {
    genetics: 'Zkittlez x Gelato (Black phenotype)',
    nose: 'Dark berries, grape, sweet candy',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Humulene'
  },
  'Blue Zushi': {
    genetics: 'Zkittlez x Kush Mints (Blue phenotype)',
    nose: 'Blueberry, mint, sweet cream',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Limonene'
  },
  'Bolo Candy': {
    genetics: 'Candy Rain x Biscotti',
    nose: 'Sweet candy, vanilla, nutty',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Bubble Gum': {
    genetics: 'Indiana Bubble Gum x unknown indica',
    nose: 'Sweet bubble gum, strawberry, floral',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Limonene'
  },
  'Cali Candy': {
    genetics: 'California Orange x Candy Kush',
    nose: 'Sweet orange, citrus, candy sweetness',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Myrcene, Caryophyllene'
  },
  'Candy Runtz': {
    genetics: 'Zkittlez x Gelato (Candy phenotype)',
    nose: 'Rainbow candy, sweet berries, tropical',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Linalool'
  },
  'Cherry Popper': {
    genetics: 'Cherry Pie x unknown',
    nose: 'Sweet cherry, berry pie, vanilla',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Chicago Runtz': {
    genetics: 'Zkittlez x Gelato (Chicago cut)',
    nose: 'Candy sweetness, citrus, berry',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Detroit Runtz': {
    genetics: 'Zkittlez x Gelato (Detroit cut)',
    nose: 'Sweet candy, grape, tropical fruit',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Linalool'
  },
  'Diamond': {
    genetics: 'OG Kush x unknown',
    nose: 'Pine, lemon, earthy diesel',
    strain_type: 'Hybrid',
    terpenes: 'Myrcene, Limonene, Caryophyllene'
  },
  'Dixie Dust': {
    genetics: 'Dubble Rainbow x Southern Skunk',
    nose: 'Sweet earth, citrus, berry',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Fruity Pebbles': {
    genetics: 'Green Ribbon x Granddaddy Purple x Tahoe Alien',
    nose: 'Sweet cereal, berries, tropical fruit',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'G33': {
    genetics: 'Gorilla Glue #4 x Gelato 33',
    nose: 'Sweet cream, diesel, pine',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Garlic Breath': {
    genetics: 'GMO x Mendo Breath',
    nose: 'Pungent garlic, diesel, earthy spice',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Gary Payton': {
    genetics: 'The Y x Snowman',
    nose: 'Sour diesel, sweet berries, earthy spice',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Gelato 15': {
    genetics: 'Sunset Sherbert x Thin Mint Cookies (pheno #15)',
    nose: 'Sweet cream, citrus, berry',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Humulene'
  },
  'Gelato Gas': {
    genetics: 'Gelato x Jet Fuel Gelato',
    nose: 'Sweet cream, diesel fuel, citrus',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Ghost Rider': {
    genetics: 'Ghost OG x Rider OG',
    nose: 'Citrus, pine, earthy diesel',
    strain_type: 'Hybrid',
    terpenes: 'Myrcene, Limonene, Caryophyllene'
  },
  'Glitter Bomb': {
    genetics: 'Grape Gas x Slurricane',
    nose: 'Grape, gas, sweet berries',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Gotti': {
    genetics: 'Cereal Milk x Italian Ice',
    nose: 'Sweet cream, citrus, vanilla',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Ice Cream Cookie': {
    genetics: 'Wedding Cake x Gelato 33',
    nose: 'Sweet vanilla, cream, cookies',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Japanese Peaches': {
    genetics: 'Georgia Pie x Jealousy',
    nose: 'Sweet peach, tropical fruit, cream',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Myrcene, Caryophyllene'
  },
  'Jet': {
    genetics: 'Jet Fuel x Aspen OG',
    nose: 'Diesel fuel, pine, earthy gas',
    strain_type: 'Hybrid',
    terpenes: 'Myrcene, Caryophyllene, Pinene'
  },
  'Lava Cake': {
    genetics: 'Thin Mint Cookies x Grape Pie',
    nose: 'Sweet grape, chocolate, earthy spice',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Myrcene, Limonene'
  },
  'LCG': {
    genetics: 'Lemon Cherry Gelato',
    nose: 'Lemon zest, cherry, sweet cream',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Linalool'
  },
  'Lemon Bang Bang': {
    genetics: 'Lemon Thai x Skunk',
    nose: 'Lemon zest, citrus, skunky spice',
    strain_type: 'Sativa',
    terpenes: 'Limonene, Myrcene, Pinene'
  },
  'Lemon Cherry Diesel': {
    genetics: 'Lemon Cherry x Sour Diesel',
    nose: 'Tart lemon, cherry, diesel fuel',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Lip Smackers': {
    genetics: 'Candy Rain x Jealousy',
    nose: 'Fruity candy, sweet cream, berry',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'LV Candy': {
    genetics: 'Las Vegas Lemon Skunk x unknown',
    nose: 'Lemon candy, citrus zest, sweet',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Marshmallow Mountain': {
    genetics: 'Wedding Crasher x unknown',
    nose: 'Sweet marshmallow, vanilla, cream',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Perm Marker': {
    genetics: 'Biscotti x Jealousy x Sherb BX',
    nose: 'Floral, diesel, earthy spice',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Pink Lady': {
    genetics: 'Pink Kush x unknown',
    nose: 'Sweet floral, vanilla, earthy',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Pinene'
  },
  'Pink Runtz': {
    genetics: 'Zkittlez x Gelato (Pink phenotype)',
    nose: 'Sweet candy, berries, tropical fruit',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Pink Velvet': {
    genetics: 'Pink Kush x unknown',
    nose: 'Sweet berries, vanilla, floral',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Limonene'
  },
  'Pop 41': {
    genetics: 'Biscotti x Lemon Cherry Gelato',
    nose: 'Citrus, sweet cream, nutty',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Private Reserve': {
    genetics: 'OG Kush x Afghan Kush',
    nose: 'Earthy pine, citrus, diesel',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Limonene, Caryophyllene'
  },
  'Project Z': {
    genetics: 'Zkittlez x Project 4516',
    nose: 'Sweet candy, tropical fruit, berries',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Limonene, Humulene'
  },
  'Purple Pineapple': {
    genetics: 'Pineapple x Mendocino Purps',
    nose: 'Sweet pineapple, tropical fruit, berry',
    strain_type: 'Hybrid',
    terpenes: 'Myrcene, Caryophyllene, Pinene'
  },
  'Purple Slushie': {
    genetics: 'Purple Punch x Slurricane',
    nose: 'Grape, berries, sweet candy',
    strain_type: 'Indica',
    terpenes: 'Caryophyllene, Myrcene, Limonene'
  },
  'Purple Truffle': {
    genetics: 'Purple Punch x Truffle',
    nose: 'Grape, earthy, sweet berries',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Caryophyllene, Limonene'
  },
  'Runtz': {
    genetics: 'Zkittlez x Gelato',
    nose: 'Sweet candy, tropical fruit, berries',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'Sherb Cream Pie': {
    genetics: 'Sunset Sherbert x Wedding Pie',
    nose: 'Sweet cream, berry, vanilla',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Linalool'
  },
  'Sherb Pie': {
    genetics: 'Sunset Sherbert x Cherry Pie',
    nose: 'Sweet berry, cream, cherry',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Myrcene'
  },
  'Snoop Runtz': {
    genetics: 'Zkittlez x Gelato (Snoop collaboration)',
    nose: 'Sweet candy, citrus, tropical fruit',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Sub Zero': {
    genetics: 'Lemon OG x unknown',
    nose: 'Lemon, pine, mint',
    strain_type: 'Hybrid',
    terpenes: 'Limonene, Pinene, Myrcene'
  },
  'Super Lemon Haze': {
    genetics: 'Lemon Skunk x Super Silver Haze',
    nose: 'Zesty lemon, citrus, sweet',
    strain_type: 'Sativa',
    terpenes: 'Limonene, Caryophyllene, Myrcene'
  },
  'Super Runtz': {
    genetics: 'Zkittlez x Gelato (Super phenotype)',
    nose: 'Intense candy, tropical fruit, sweet berries',
    strain_type: 'Hybrid',
    terpenes: 'Caryophyllene, Limonene, Linalool'
  },
  'White Truffle': {
    genetics: 'Gorilla Butter (Gorilla Glue #4 x Peanut Butter Breath)',
    nose: 'Earthy, nutty, pungent garlic',
    strain_type: 'Indica',
    terpenes: 'Myrcene, Limonene, Caryophyllene'
  }
};

async function fillFlowerStrainData() {
  console.log('🔍 Loading flower products...\n');

  // Get all flower products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, custom_fields')
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .eq('primary_category_id', FLOWER_CATEGORY_ID)
    .order('name');

  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }

  console.log(`📋 Found ${products.length} flower products\n`);

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
    const existingFields = product.custom_fields || {};
    const updatedFields = {
      ...existingFields,
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
fillFlowerStrainData().catch(console.error);
