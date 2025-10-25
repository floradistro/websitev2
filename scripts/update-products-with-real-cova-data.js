#!/usr/bin/env node
/**
 * Update products with REAL data from COVA sales history
 * Uses actual: costs, pricing, sales volume, margins
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Load REAL COVA data
const covaProducts = JSON.parse(
  fs.readFileSync('/Users/whale/Desktop/COVA DATA/ALL/Sales by Product - 20250718-192105183.json', 'utf8')
);

console.log('='.repeat(80));
console.log('UPDATING PRODUCTS WITH REAL COVA DATA');
console.log('='.repeat(80));
console.log(`\n📊 Loaded ${covaProducts.length} products with REAL sales history\n`);

async function main() {
  // Get all Flora products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', FLORA_VENDOR_ID);
  
  if (!products) {
    console.error('No products found');
    return;
  }
  
  console.log(`🌿 Found ${products.length} products to enhance\n`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const product of products) {
    // Match by product name (fuzzy match)
    const productNameClean = product.name.toLowerCase().replace(/\s+/g, '');
    
    const covaMatch = covaProducts.find(cp => {
      const covaName = cp.Product.toLowerCase().replace(/\s+/g, '');
      return covaName.includes(productNameClean) || productNameClean.includes(covaName);
    });
    
    if (!covaMatch) {
      notFound++;
      console.log(`⚠️  No COVA data for: ${product.name}`);
      continue;
    }
    
    // Extract REAL data from COVA
    const realData = {
      sku: covaMatch.SKU,
      brand: covaMatch.Brand || 'Flora Flower',
      supplier: covaMatch.Supplier || 'CWS',
      category: covaMatch.Classification,
      
      // REAL pricing from actual sales
      avg_sold_price: parseFloat(covaMatch['Avg Sold At Price']),
      avg_regular_price: parseFloat(covaMatch['Avg Regular Price']),
      
      // REAL sales data
      total_sold: parseFloat(covaMatch['Net Sold']),
      total_revenue: parseFloat(covaMatch.Subtotal),
      total_cost: parseFloat(covaMatch['Total Cost']),
      gross_profit: parseFloat(covaMatch['Gross Profit']),
      gross_margin: parseFloat(covaMatch['Gross Margin']),
      
      // REAL inventory data
      unit_type: covaMatch['Unit Type'] || 'Gram',
      net_weight: parseFloat(covaMatch['Net Weight'] || 0),
      total_weight_sold: parseFloat(covaMatch['Total Net Weight'] || 0),
      
      // From COVA
      imported_from_cova: true,
      cova_product_data: covaMatch
    };
    
    // Update product with REAL data
    const { error } = await supabase
      .from('products')
      .update({
        sku: realData.sku,
        regular_price: realData.avg_sold_price,  // Use actual average selling price
        meta_data: {
          ...product.meta_data,
          ...realData,
          historical_performance: {
            units_sold: realData.total_sold,
            revenue: realData.total_revenue,
            margin: realData.gross_margin
          }
        }
      })
      .eq('id', product.id);
    
    if (error) {
      console.error(`❌ ${product.name}: ${error.message}`);
    } else {
      updated++;
      console.log(`✓ ${product.name} - SKU: ${realData.sku} - ${realData.total_sold} sold - ${realData.gross_margin}% margin`);
    }
  }
  
  console.log(`\n` + '='.repeat(80));
  console.log('✅ UPDATE COMPLETE');
  console.log('='.repeat(80));
  console.log(`\nUpdated: ${updated}`);
  console.log(`Not found in COVA: ${notFound}`);
  console.log(`Total: ${products.length}`);
}

main().catch(console.error);

