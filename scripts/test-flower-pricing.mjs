#!/usr/bin/env node

async function test() {
  const locationId = 'c4eedafb-4050-4d2d-a6af-e164aad5d934'; // Charlotte Central

  const response = await fetch(`http://localhost:3000/api/pos/inventory?locationId=${locationId}`);
  const data = await response.json();

  console.log('\n🌸 FLOWER PRODUCTS:\n');

  const flowerProducts = (data.products || []).filter(p => p.category === 'Flower');

  flowerProducts.slice(0, 5).forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name}`);
    console.log(`   Category: ${p.category}`);
    console.log(`   Pricing Tiers: ${p.pricing_tiers?.length || 0}`);
    if (p.pricing_tiers && p.pricing_tiers.length > 0) {
      p.pricing_tiers.forEach(t => console.log(`      - ${t.label}: $${t.price}`));
    }
    console.log('');
  });

  console.log('\n🔥 CONCENTRATES:\n');

  const concentrates = (data.products || []).filter(p => p.category === 'Concentrates');

  concentrates.slice(0, 3).forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name}`);
    console.log(`   Pricing Tiers: ${p.pricing_tiers?.length || 0}`);
    if (p.pricing_tiers && p.pricing_tiers.length > 0) {
      p.pricing_tiers.forEach(t => console.log(`      - ${t.label}: $${t.price}`));
    }
    console.log('');
  });
}

test().catch(console.error);
