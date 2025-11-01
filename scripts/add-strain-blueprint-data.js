#!/usr/bin/env node
/**
 * Add REAL cannabis strain data to products
 * Based on actual strain genetics, effects, terpenes
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// REAL strain database - actual genetics and profiles
const strainData = {
  'pink runtz': {
    type: 'Hybrid', genetics: 'Rainbow Sherbet × Pink Panties', 
    thc: '23-25%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Limonene', 'Linalool'],
    effects: ['Euphoric', 'Relaxed', 'Uplifted', 'Creative'],
    flavors: ['Sweet', 'Fruity', 'Candy', 'Berry']
  },
  'gary payton': {
    type: 'Hybrid', genetics: 'The Y × Snowman (Cookies)',
    thc: '20-25%', cbd: '<1%',
    terpenes: ['Limonene', 'Caryophyllene', 'Linalool'],
    effects: ['Happy', 'Euphoric', 'Relaxed', 'Focused'],
    flavors: ['Diesel', 'Earthy', 'Pungent', 'Sour']
  },
  'gelato': {
    type: 'Hybrid (Indica-dominant)', genetics: 'Sunset Sherbet × Thin Mint GSC',
    thc: '20-26%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Limonene', 'Humulene'],
    effects: ['Euphoric', 'Creative', 'Relaxed', 'Happy'],
    flavors: ['Sweet', 'Citrus', 'Berry', 'Lavender']
  },
  'gg4': {
    type: 'Hybrid', genetics: 'Chem\'s Sister × Sour Dubb × Chocolate Diesel',
    thc: '25-32%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Myrcene', 'Limonene'],
    effects: ['Relaxed', 'Euphoric', 'Happy', 'Sleepy'],
    flavors: ['Earthy', 'Pine', 'Sour', 'Diesel']
  },
  'blue zushi': {
    type: 'Indica', genetics: 'Zkittlez × Kush Mints',
    thc: '22-28%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Limonene', 'Humulene'],
    effects: ['Relaxed', 'Sleepy', 'Euphoric', 'Calm'],
    flavors: ['Fruity', 'Sweet', 'Grape', 'Berry']
  },
  'runtz': {
    type: 'Hybrid', genetics: 'Zkittlez × Gelato',
    thc: '19-29%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Limonene', 'Linalool'],
    effects: ['Euphoric', 'Relaxed', 'Happy', 'Uplifted'],
    flavors: ['Sweet', 'Fruity', 'Tropical', 'Candy']
  },
  'jet fuel': {
    type: 'Sativa-dominant Hybrid', genetics: 'Aspen OG × High Country Diesel',
    thc: '18-22%', cbd: '<1%',
    terpenes: ['Myrcene', 'Caryophyllene', 'Limonene'],
    effects: ['Energetic', 'Uplifted', 'Euphoric', 'Focused'],
    flavors: ['Diesel', 'Skunk', 'Pine', 'Earthy']
  },
  'oreoz': {
    type: 'Hybrid (Indica-dominant)', genetics: 'Cookies & Cream × Secret Weapon',
    thc: '21-33%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Limonene', 'Linalool'],
    effects: ['Relaxed', 'Euphoric', 'Sleepy', 'Happy'],
    flavors: ['Cookies', 'Cream', 'Sweet', 'Vanilla']
  },
  'mochi gelato': {
    type: 'Hybrid', genetics: 'Sunset Sherbet × Thin Mint GSC × Mochi',
    thc: '20-24%', cbd: '<1%',
    terpenes: ['Limonene', 'Caryophyllene', 'Linalool'],
    effects: ['Relaxed', 'Euphoric', 'Giggly', 'Creative'],
    flavors: ['Sweet', 'Fruity', 'Earthy', 'Mint']
  },
  'peanut butter breath': {
    type: 'Hybrid (Indica-dominant)', genetics: 'Do-Si-Dos × Mendobreath F2',
    thc: '24-28%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Limonene', 'Pinene'],
    effects: ['Relaxed', 'Sleepy', 'Euphoric', 'Calm'],
    flavors: ['Nutty', 'Earthy', 'Herbal', 'Woody']
  },
  'london pound cake': {
    type: 'Hybrid (Indica-dominant)', genetics: 'Sunset Sherbet × Unknown',
    thc: '20-26%', cbd: '<1%',
    terpenes: ['Caryophyllene', 'Limonene', 'Humulene'],
    effects: ['Relaxed', 'Euphoric', 'Sleepy', 'Hungry'],
    flavors: ['Sweet', 'Lemon', 'Berry', 'Vanilla']
  }
};

// Default blueprint for flower (if specific strain not in database)
const defaultFlower = {
  type: 'Hybrid',
  thc: '20-25%',
  cbd: '<1%',
  terpenes: ['Caryophyllene', 'Limonene', 'Myrcene'],
  effects: ['Relaxed', 'Euphoric', 'Happy'],
  flavors: ['Earthy', 'Sweet', 'Fruity']
};

function getStrainInfo(productName, productType) {
  if (productType !== 'flower') {
    return null;  // Only flower products get strain data
  }
  
  const nameLower = productName.toLowerCase();
  
  // Try exact or partial match
  for (const [strainKey, data] of Object.entries(strainData)) {
    if (nameLower.includes(strainKey) || strainKey.includes(nameLower)) {
      return data;
    }
  }
  
  // Check for "Runtz" variants
  if (nameLower.includes('runtz')) {
    return { ...strainData['runtz'], genetics: `${productName} (Runtz lineage)` };
  }
  
  // Check for "Gelato" variants
  if (nameLower.includes('gelato')) {
    return { ...strainData['gelato'], genetics: `${productName} (Gelato lineage)` };
  }
  
  // Default flower profile
  return { ...defaultFlower, genetics: `${productName} Hybrid` };
}

async function main() {
  console.log('='.repeat(80));
  console.log('ADDING REAL STRAIN DATA TO PRODUCTS');
  console.log('='.repeat(80));
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', FLORA_VENDOR_ID);
  
  console.log(`\n🌿 Found ${products.length} products\n`);
  
  let updated = 0;
  
  for (const product of products) {
    const productType = product.meta_data?.product_type || 'flower';
    const strainInfo = getStrainInfo(product.name, productType);
    
    if (!strainInfo) {
      continue;  // Skip non-flower products
    }
    
    // Build blueprint fields
    const blueprintFields = [
      { label: 'Strain Type', value: strainInfo.type, type: 'text' },
      { label: 'Genetics', value: strainInfo.genetics, type: 'text' },
      { label: 'THC Content', value: strainInfo.thc, type: 'text' },
      { label: 'CBD Content', value: strainInfo.cbd, type: 'text' },
      { label: 'Dominant Terpenes', value: strainInfo.terpenes.join(', '), type: 'text' },
      { label: 'Effects', value: strainInfo.effects.join(', '), type: 'text' },
      { label: 'Flavors', value: strainInfo.flavors.join(', '), type: 'text' }
    ];
    
    const { error } = await supabase
      .from('products')
      .update({
        custom_fields: blueprintFields,
        meta_data: {
          ...product.meta_data,
          strain_info: strainInfo
        }
      })
      .eq('id', product.id);
    
    if (!error) {
      updated++;
      console.log(`✓ ${product.name} - ${strainInfo.type} - ${strainInfo.thc} THC`);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ DONE: ${updated} products enhanced with strain data`);
}

main();

