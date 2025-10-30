#!/usr/bin/env node

// Assign random pricing tiers to Flora's flower products

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

const PRICING_TIERS = [
  {
    id: 'a0c471db-a9d4-406a-bd5d-9b9e98bafd4d',
    name: 'Retail Flower - Exotic'
  },
  {
    id: '97261244-d8dc-4a68-b710-d98727907d55',
    name: 'Retail Flower - Top Shelf'
  },
  {
    id: '53131b33-7947-49f6-838c-f531ee19bb47',
    name: 'Retail Flower - Deals'
  }
];

async function main() {
  console.log('🎲 Randomly assigning pricing tiers to flower products...\n');

  // Fetch all products
  const productsResponse = await fetch(`http://localhost:3000/api/vendor/products?vendor_id=${VENDOR_ID}`);
  const productsData = await productsResponse.json();

  if (!productsData.success) {
    console.error('❌ Failed to fetch products:', productsData.error);
    return;
  }

  const products = productsData.products;
  console.log(`📦 Found ${products.length} products\n`);

  // Filter for flower products (excluding concentrates, gummies, etc.)
  const flowerProducts = products.filter(p => {
    const name = p.name.toLowerCase();
    return !name.includes('concentrate') &&
           !name.includes('gummy') &&
           !name.includes('vape') &&
           !name.includes('cart') &&
           !name.includes('mg') &&
           !name.includes('cookie') &&
           !name.includes('bulk') &&
           p.name.trim().length > 0;
  });

  console.log(`🌸 Filtered to ${flowerProducts.length} flower products\n`);

  // Randomly assign pricing tiers
  let assignments = {
    exotic: [],
    topShelf: [],
    deals: []
  };

  for (const product of flowerProducts) {
    // Randomly pick a tier (0, 1, or 2)
    const randomIndex = Math.floor(Math.random() * PRICING_TIERS.length);
    const tier = PRICING_TIERS[randomIndex];

    // Assign the product to this tier via API
    try {
      const response = await fetch('http://localhost:3000/api/vendor/product-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor_id: VENDOR_ID,
          product_ids: [product.id],
          blueprint_id: tier.id
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ ${product.name} → ${tier.name}`);

        if (randomIndex === 0) assignments.exotic.push(product.name);
        else if (randomIndex === 1) assignments.topShelf.push(product.name);
        else assignments.deals.push(product.name);
      } else {
        console.log(`❌ ${product.name} → ${tier.name} (${result.error})`);
      }
    } catch (error) {
      console.error(`❌ Error assigning ${product.name}:`, error.message);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n\n📊 Assignment Summary:');
  console.log(`🔥 Exotic (${assignments.exotic.length}): ${assignments.exotic.slice(0, 5).join(', ')}${assignments.exotic.length > 5 ? '...' : ''}`);
  console.log(`⭐ Top Shelf (${assignments.topShelf.length}): ${assignments.topShelf.slice(0, 5).join(', ')}${assignments.topShelf.length > 5 ? '...' : ''}`);
  console.log(`💰 Deals (${assignments.deals.length}): ${assignments.deals.slice(0, 5).join(', ')}${assignments.deals.length > 5 ? '...' : ''}`);
  console.log('\n✨ Done! Refresh your TV display to see the pricing.');
}

main().catch(console.error);
