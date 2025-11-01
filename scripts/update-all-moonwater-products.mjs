#!/usr/bin/env node

/**
 * Complete Moonwater Products Update
 * Updates ALL Moonwater products across all dosage lines with real data
 */

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const API_URL = 'http://localhost:3000';

// Complete Moonwater catalog from trymoonwater.com + local catalog
const MOONWATER_CATALOG = {
  // ===== DAY DRINKER (5MG) =====
  'Day Drinker (5mg) - Fizzy Lemonade': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Fizzy Lemonade',
    description: 'Classic lemonade with a cannabis twist. Crisp, refreshing, and infused with 5mg of pure THC. Perfect for sunny days and light sessions. All natural, low-calorie cannabis soda.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Flavors, THC Extract, Citric Acid'
  },
  'Day Drinker (5mg) - Lemon Ginger': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Lemon Ginger',
    description: 'Zesty lemon meets spicy ginger in this invigorating cannabis soda. Contains 5mg of pure THC for a light, uplifting experience. All natural and low-calorie.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Lemon & Ginger Flavors, THC Extract, Citric Acid'
  },
  'Day Drinker (5mg) - Fizzy Punch': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Fizzy Punch',
    description: 'Tropical fruit punch bursting with flavor and fun. Infused with 5mg of pure THC for an easy-going vibe. All natural, low-calorie cannabis soda.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Fruit Punch Flavors, THC Extract, Citric Acid'
  },
  'Day Drinker (5mg) - Clementine Orange': {
    line: 'Day Drinker',
    dosage: '5mg',
    flavor: 'Clementine Orange',
    description: 'Bright and citrusy clementine orange flavor that energizes your day. Infused with 5mg of pure THC. All natural, low-calorie cannabis beverage.',
    thc_content: '5',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Clementine & Orange Flavors, THC Extract, Citric Acid'
  },

  // ===== GOLDEN HOUR (10MG) =====
  'Golden Hour (10mg) - Fizzy Lemonade': {
    line: 'Golden Hour',
    dosage: '10mg',
    flavor: 'Fizzy Lemonade',
    description: 'Classic lemonade elevated with 10mg of pure THC. Mid-tier potency for a balanced, enjoyable experience. All natural, low-calorie cannabis soda perfect for social settings.',
    thc_content: '10',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Flavors, THC Extract, Citric Acid'
  },
  'Golden Hour (10mg) - Berry Twist': {
    line: 'Golden Hour',
    dosage: '10mg',
    flavor: 'Berry Twist',
    description: 'A refreshing blend of mixed berries with 10mg of pure THC. Perfect for unwinding with friends. All natural, low-calorie cannabis soda with a smooth, fruity finish.',
    thc_content: '10',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Berry Flavors, THC Extract, Citric Acid'
  },
  'Golden Hour (10mg) - Lemon Ginger': {
    line: 'Golden Hour',
    dosage: '10mg',
    flavor: 'Lemon Ginger',
    description: 'Zesty lemon and spicy ginger infused with 10mg of pure THC. Mid-tier potency for a balanced, uplifting experience. All natural and low-calorie.',
    thc_content: '10',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Lemon & Ginger Flavors, THC Extract, Citric Acid'
  },
  'Golden Hour (10mg) - Fizzy Punch': {
    line: 'Golden Hour',
    dosage: '10mg',
    flavor: 'Fizzy Punch',
    description: 'Tropical fruit punch with 10mg of pure THC for a smooth, balanced high. Perfect for social gatherings and good times. All natural, low-calorie cannabis beverage.',
    thc_content: '10',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Fruit Punch Flavors, THC Extract, Citric Acid'
  },
  'Golden Hour (10mg) - Clementine Orange': {
    line: 'Golden Hour',
    dosage: '10mg',
    flavor: 'Clementine Orange',
    description: 'Bright citrus flavor with 10mg of pure THC. Mid-tier potency for a balanced, refreshing experience. All natural, low-calorie cannabis soda.',
    thc_content: '10',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Clementine & Orange Flavors, THC Extract, Citric Acid'
  },

  // ===== DARKSIDE (30MG) =====
  'Darkside (30mg) - Cold Clementine': {
    line: 'Darkside',
    dosage: '30mg',
    flavor: 'Cold Clementine',
    description: 'Ice-cold clementine flavor with 30mg of pure THC. Higher potency for experienced users seeking powerful effects. All natural, low-calorie premium cannabis beverage.',
    thc_content: '30',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Clementine Flavors, THC Extract, Citric Acid'
  },
  'Darkside (30mg) - Fizzy Lemonade': {
    line: 'Darkside',
    dosage: '30mg',
    flavor: 'Fizzy Lemonade',
    description: 'Classic lemonade with 30mg of pure THC. Higher potency for those who want more. All natural, low-calorie premium cannabis soda for experienced consumers.',
    thc_content: '30',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Flavors, THC Extract, Citric Acid'
  },
  'Darkside (30mg) - Berry Twist': {
    line: 'Darkside',
    dosage: '30mg',
    flavor: 'Berry Twist',
    description: 'Mixed berry flavor with 30mg of pure THC. Higher potency cannabis soda designed for experienced users. All natural, low-calorie premium formula.',
    thc_content: '30',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Berry Flavors, THC Extract, Citric Acid'
  },
  'Darkside (30mg) - Lemon Ginger': {
    line: 'Darkside',
    dosage: '30mg',
    flavor: 'Lemon Ginger',
    description: 'Zesty lemon and ginger with 30mg of pure THC. Higher potency for intense, uplifting effects. All natural, low-calorie premium cannabis beverage.',
    thc_content: '30',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Lemon & Ginger Flavors, THC Extract, Citric Acid'
  },
  'Darkside (30mg) - Fizzy Punch': {
    line: 'Darkside',
    dosage: '30mg',
    flavor: 'Fizzy Punch',
    description: 'Tropical fruit punch with 30mg of pure THC. Higher potency for experienced cannabis consumers. All natural, low-calorie premium soda.',
    thc_content: '30',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Fruit Punch Flavors, THC Extract, Citric Acid'
  },

  // ===== RIPTIDE (60MG) =====
  'Riptide (60mg) - Berry Twist': {
    line: 'Riptide',
    dosage: '60mg',
    flavor: 'Berry Twist',
    description: 'Maximum strength Berry Twist with 60mg of pure THC. Premium cannabis soda for experienced users seeking powerful effects. All natural, low-calorie formula.',
    thc_content: '60',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Berry Flavors, THC Extract, Citric Acid'
  },
  'Riptide (60mg) - Carolina Cola': {
    line: 'Riptide',
    dosage: '60mg',
    flavor: 'Carolina Cola',
    description: 'Classic cola flavor with maximum 60mg THC punch. Premium cannabis beverage designed for experienced consumers. All natural, low-calorie formula with bold cola taste.',
    thc_content: '60',
    cbd_content: '0',
    serving_size: '12 fl oz',
    calories: '25',
    ingredients: 'Carbonated Water, Cane Sugar, Natural Cola Flavors, THC Extract, Caramel Color, Phosphoric Acid'
  }
};

// Matching patterns for existing products
function matchProduct(product, catalogData) {
  const productName = product.name.toLowerCase();
  const productSlug = (product.slug || '').toLowerCase();
  const productCategory = (product.category || '').toLowerCase();
  const productMetaData = product.meta_data || {};

  // Extract dosage and line from product data
  let productDosage = productMetaData.dosage || '';
  let productLine = productMetaData.line || '';

  // Also check slug for dosage hints
  if (!productDosage) {
    if (productSlug.includes('60mg') || productSlug.includes('riptide')) {
      productDosage = '60mg';
      productLine = 'Riptide';
    } else if (productSlug.includes('30mg') || productSlug.includes('darkside')) {
      productDosage = '30mg';
      productLine = 'Darkside';
    } else if (productSlug.includes('10mg') || productSlug.includes('golden') || productCategory.includes('golden')) {
      productDosage = '10mg';
      productLine = 'Golden Hour';
    } else if (productSlug.includes('5mg') || productSlug.includes('day-drinker') || productCategory.includes('day drinker')) {
      productDosage = '5mg';
      productLine = 'Day Drinker';
    }
  }

  // Try exact match with dosage + flavor
  for (const [key, data] of Object.entries(catalogData)) {
    if (productDosage === data.dosage &&
        productName.includes(data.flavor.toLowerCase())) {
      return data;
    }
  }

  // Try match with line + flavor
  if (productLine) {
    for (const [key, data] of Object.entries(catalogData)) {
      if (productLine === data.line &&
          productName.includes(data.flavor.toLowerCase())) {
        return data;
      }
    }
  }

  return null;
}

async function updateAllMoonwaterProducts() {
  console.log('🌊 Starting COMPLETE Moonwater Product Update...\n');
  console.log(`📋 Catalog contains ${Object.keys(MOONWATER_CATALOG).length} product definitions\n`);

  try {
    // Fetch all products
    const response = await fetch(`${API_URL}/api/vendor/products/full`, {
      headers: { 'x-vendor-id': VENDOR_ID }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    const allProducts = data.products || [];

    // Filter for potential Moonwater products
    const moonwaterProducts = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();

      return category.includes('beverage') ||
             category.includes('day drinker') ||
             category.includes('golden hour') ||
             category.includes('darkside') ||
             category.includes('riptide') ||
             name.includes('berry') ||
             name.includes('clementine') ||
             name.includes('lemon') ||
             name.includes('fizzy') ||
             name.includes('carolina');
    });

    console.log(`📦 Found ${allProducts.length} total products`);
    console.log(`🌊 Found ${moonwaterProducts.length} potential Moonwater products\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const notFound = [];

    for (const product of moonwaterProducts) {
      const productName = product.name;
      const productData = matchProduct(product, MOONWATER_CATALOG);

      if (!productData) {
        notFound.push(productName);
        skippedCount++;
        continue;
      }

      // Build update payload
      // IMPORTANT: API expects "custom_fields" which it stores as "blueprint_fields"
      const updatePayload = {
        description: productData.description,
        custom_fields: {
          dosage: productData.dosage,
          flavor: productData.flavor,
          line: productData.line,
          thc_content: productData.thc_content,
          cbd_content: productData.cbd_content,
          serving_size: productData.serving_size,
          calories: productData.calories,
          ingredients: productData.ingredients,
          servings_per_container: '1',
          total_fat: '0g',
          sodium: '5mg',
          total_carbohydrate: '7g',
          total_sugars: '6g',
          protein: '0g'
        }
      };

      console.log(`✏️  ${productName}`);
      console.log(`   → ${productData.line} | ${productData.dosage} | ${productData.flavor}`);

      // Update product
      const updateResponse = await fetch(`${API_URL}/api/vendor/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': VENDOR_ID
        },
        body: JSON.stringify(updatePayload)
      });

      if (updateResponse.ok) {
        console.log(`   ✅ Updated\n`);
        updatedCount++;
      } else {
        const error = await updateResponse.text();
        console.log(`   ❌ Failed: ${error}\n`);
        skippedCount++;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Complete Update Finished!');
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⚠️  Skipped: ${skippedCount} products`);

    if (notFound.length > 0) {
      console.log('\n📝 Products not matched (might not be Moonwater):');
      notFound.forEach(name => console.log(`   - ${name}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the complete update
updateAllMoonwaterProducts();
