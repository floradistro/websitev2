#!/usr/bin/env node

/**
 * Verify Moonwater Product Data
 * Checks that all products have complete and correct data
 */

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const API_URL = 'http://localhost:3000';

async function verifyMoonwaterData() {
  console.log('🌊 MOONWATER PRODUCTS VERIFICATION');
  console.log('='.repeat(80));

  try {
    const response = await fetch(`${API_URL}/api/vendor/products/full`, {
      headers: { 'x-vendor-id': VENDOR_ID }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    const allProducts = data.products || [];

    // Filter Moonwater products
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

    console.log(`Total Moonwater products found: ${moonwaterProducts.length}\n`);

    // Group by line and dosage
    const byLine = {};
    const issues = [];

    moonwaterProducts.forEach(p => {
      const fields = p.custom_fields || {};
      const line = fields.line || 'NO LINE';
      const dosage = fields.dosage || 'NO DOSAGE';
      const key = `${line} (${dosage})`;

      if (!byLine[key]) byLine[key] = [];

      // Check for required fields
      const requiredFields = ['dosage', 'flavor', 'line', 'thc_content', 'cbd_content', 'serving_size', 'calories', 'ingredients'];
      const missingFields = requiredFields.filter(field => !fields[field]);

      if (missingFields.length > 0) {
        issues.push(`${p.name}: Missing ${missingFields.join(', ')}`);
      }

      if (!p.description) {
        issues.push(`${p.name}: Missing description`);
      }

      byLine[key].push({
        name: p.name,
        category: p.category,
        dosage: fields.dosage,
        flavor: fields.flavor,
        line: fields.line,
        thc: fields.thc_content,
        cbd: fields.cbd_content,
        serving: fields.serving_size,
        calories: fields.calories,
        ingredients: fields.ingredients ? 'YES' : 'NO',
        description: p.description ? 'YES' : 'NO',
        fieldsCount: Object.keys(fields).length,
        missingFields
      });
    });

    // Display by line
    const sortedLines = Object.keys(byLine).sort((a, b) => {
      const order = {
        'Day Drinker (5mg)': 1,
        'Golden Hour (10mg)': 2,
        'Darkside (30mg)': 3,
        'Riptide (60mg)': 4
      };
      return (order[a] || 999) - (order[b] || 999);
    });

    sortedLines.forEach(lineKey => {
      console.log(`\n📦 ${lineKey}`);
      console.log('-'.repeat(80));

      byLine[lineKey].forEach(p => {
        const status = p.missingFields.length === 0 && p.description === 'YES' ? '✅' : '⚠️';
        console.log(`  ${status} ${p.name}`);
        console.log(`      Category: ${p.category}`);
        console.log(`      Flavor: ${p.flavor || 'MISSING'}`);
        console.log(`      THC: ${p.thc || 'MISSING'} | CBD: ${p.cbd || 'MISSING'}`);
        console.log(`      Serving: ${p.serving || 'MISSING'} | Calories: ${p.calories || 'MISSING'}`);
        console.log(`      Ingredients: ${p.ingredients}`);
        console.log(`      Description: ${p.description}`);
        console.log(`      Total Fields: ${p.fieldsCount}`);

        if (p.missingFields.length > 0) {
          console.log(`      🚨 Missing: ${p.missingFields.join(', ')}`);
        }
        console.log('');
      });
    });

    console.log('='.repeat(80));

    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ ALL PRODUCTS VERIFIED - NO ISSUES FOUND');
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Products: ${moonwaterProducts.length}`);
    console.log(`   Day Drinker (5mg): ${byLine['Day Drinker (5mg)']?.length || 0}`);
    console.log(`   Golden Hour (10mg): ${byLine['Golden Hour (10mg)']?.length || 0}`);
    console.log(`   Darkside (30mg): ${byLine['Darkside (30mg)']?.length || 0}`);
    console.log(`   Riptide (60mg): ${byLine['Riptide (60mg)']?.length || 0}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyMoonwaterData();
