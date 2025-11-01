#!/usr/bin/env node

// Test the inventory API directly
async function test() {
  const locationId = 'c4eedafb-4050-4d2d-a6af-e164aad5d934'; // Charlotte Central

  const response = await fetch(`http://localhost:3000/api/pos/inventory?locationId=${locationId}`);
  const data = await response.json();

  console.log('\n📦 Products returned:', data.products?.length || 0);

  if (data.products && data.products.length > 0) {
    console.log('\n🔍 First 3 products:');
    data.products.slice(0, 3).forEach((p, idx) => {
      console.log(`\n${idx + 1}. ${p.name}`);
      console.log(`   Category: ${p.category}`);
      console.log(`   Pricing Tiers: ${p.pricing_tiers?.length || 0}`);
      if (p.pricing_tiers && p.pricing_tiers.length > 0) {
        console.log(`   Tiers:`, p.pricing_tiers.map(t => `${t.label}: $${t.price}`));
      } else {
        console.log(`   ⚠️  NO PRICING TIERS`);
      }
    });
  }
}

test().catch(console.error);
