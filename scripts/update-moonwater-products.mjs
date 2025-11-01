#!/usr/bin/env node

/**
 * Update Moonwater Products with Real Data
 *
 * Sources:
 * - trymoonwater.com website data
 * - /Users/whale/Downloads/MOONWATER CATELOG
 *
 * Updates:
 * - Product descriptions (real marketing copy)
 * - Blueprint fields (dosage, flavor, line, etc.)
 */

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const API_URL = 'http://localhost:3000';

// Real product data from trymoonwater.com
const MOONWATER_PRODUCTS = {
  // Day Drinker (5mg)
  'Berry Twist': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Berry Twist',
    description: 'A refreshing blend of mixed berries with just the right amount of fizz. Perfect for daytime enjoyment with 5mg of pure THC. All natural, low-calorie cannabis soda.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25'
  },
  'Clementine Orange': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Clementine Orange',
    description: 'Bright and citrusy clementine orange flavor that energizes your day. Infused with 5mg of pure THC. All natural, low-calorie cannabis beverage.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25'
  },
  'Lemon Ginger': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Lemon Ginger',
    description: 'Zesty lemon meets spicy ginger in this invigorating cannabis soda. Contains 5mg of pure THC for a light, uplifting experience. All natural and low-calorie.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25'
  },
  'Fizzy Lemonade': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Fizzy Lemonade',
    description: 'Classic lemonade with a cannabis twist. Crisp, refreshing, and infused with 5mg of pure THC. Perfect for sunny days and light sessions.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25'
  },
  'Fizzy Punch': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Fizzy Punch',
    description: 'Tropical fruit punch bursting with flavor and fun. Infused with 5mg of pure THC for an easy-going vibe. All natural, low-calorie cannabis soda.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25'
  }
};

// Golden Hour products (10mg) - same flavors, higher dose
const GOLDEN_HOUR_FLAVORS = ['Berry Twist', 'Clementine Orange', 'Lemon Ginger', 'Fizzy Lemonade', 'Fizzy Punch'];
GOLDEN_HOUR_FLAVORS.forEach(flavor => {
  const baseProduct = MOONWATER_PRODUCTS[flavor];
  if (baseProduct) {
    MOONWATER_PRODUCTS[`${flavor} (Golden Hour)`] = {
      ...baseProduct,
      line: 'Golden Hour',
      dosage: '10mg',
      description: baseProduct.description.replace('5mg', '10mg').replace('Day Drinker', 'Golden Hour').replace('light', 'moderate'),
      thc_content: '10'
    };
  }
});

// Darkside products (30mg)
const DARKSIDE_FLAVORS = ['Berry Twist', 'Clementine Orange', 'Lemon Ginger', 'Fizzy Lemonade', 'Fizzy Punch'];
DARKSIDE_FLAVORS.forEach(flavor => {
  const baseProduct = MOONWATER_PRODUCTS[flavor];
  if (baseProduct) {
    MOONWATER_PRODUCTS[`${flavor} (Darkside)`] = {
      ...baseProduct,
      line: 'Darkside',
      dosage: '30mg',
      description: baseProduct.description.replace('5mg', '30mg').replace('Day Drinker', 'Darkside').replace('light', 'higher potency'),
      thc_content: '30'
    };
  }
});

// Riptide products (60mg)
MOONWATER_PRODUCTS['Berry Twist (Riptide)'] = {
  line: 'Riptide',
  dosage: '60mg',
  flavor: 'Berry Twist',
  description: 'Maximum strength Berry Twist with 60mg of pure THC. Premium cannabis soda for experienced users seeking powerful effects. All natural, low-calorie.',
  thc_content: '60',
  cbd_content: '0',
  serving_size: '12 fl oz',
  calories: '25'
};

MOONWATER_PRODUCTS['Carolina Cola'] = {
  line: 'Riptide',
  dosage: '60mg',
  flavor: 'Carolina Cola',
  description: 'Classic cola flavor with maximum 60mg THC punch. Premium cannabis beverage designed for experienced consumers. All natural, low-calorie formula.',
  thc_content: '60',
  cbd_content: '0',
  serving_size: '12 fl oz',
  calories: '25'
};

async function updateMoonwaterProducts() {
  console.log('🌊 Starting Moonwater Product Update...\n');

  try {
    // Fetch all products from vendor
    const response = await fetch(`${API_URL}/api/vendor/products/full`, {
      headers: {
        'x-vendor-id': VENDOR_ID
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    const allProducts = data.products || [];

    console.log(`📦 Found ${allProducts.length} total products`);

    // Filter Moonwater products
    const moonwaterProducts = allProducts.filter(p => {
      const name = p.name || '';
      return name.includes('Berry') ||
             name.includes('Clementine') ||
             name.includes('Lemon') ||
             name.includes('Fizzy') ||
             name.includes('Carolina');
    });

    console.log(`🌊 Found ${moonwaterProducts.length} Moonwater products\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of moonwaterProducts) {
      const productName = product.name;

      // Find matching product data
      let productData = null;
      for (const [key, value] of Object.entries(MOONWATER_PRODUCTS)) {
        if (productName.includes(value.flavor) || productName === key) {
          productData = value;
          break;
        }
      }

      if (!productData) {
        console.log(`⚠️  No data found for: ${productName}`);
        skippedCount++;
        continue;
      }

      // Build update payload
      const updatePayload = {
        description: productData.description,
        blueprint_fields: {
          dosage: productData.dosage,
          flavor: productData.flavor,
          line: productData.line,
          thc_content: productData.thc_content,
          cbd_content: productData.cbd_content,
          serving_size: productData.serving_size,
          calories: productData.calories
        }
      };

      console.log(`✏️  Updating: ${productName}`);
      console.log(`   Line: ${productData.line} | Dosage: ${productData.dosage}`);

      // Update product via API
      const updateResponse = await fetch(`${API_URL}/api/vendor/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': VENDOR_ID
        },
        body: JSON.stringify(updatePayload)
      });

      if (updateResponse.ok) {
        console.log(`   ✅ Updated successfully\n`);
        updatedCount++;
      } else {
        const error = await updateResponse.text();
        console.log(`   ❌ Failed: ${error}\n`);
        skippedCount++;
      }
    }

    console.log('\n🎉 Update Complete!');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the update
updateMoonwaterProducts();
