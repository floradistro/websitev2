#!/usr/bin/env node

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const API_URL = 'http://localhost:3000';

async function testUpdate() {
  const productId = '682813c0-2713-41e0-acd9-dff3abc47a99'; // Carolina Cola

  const payload = {
    description: 'Classic cola flavor with maximum 60mg THC punch. Premium cannabis beverage designed for experienced consumers. All natural, low-calorie formula with bold cola taste.',
    custom_fields: {
      dosage: '60mg',
      flavor: 'Carolina Cola',
      line: 'Riptide',
      thc_content: '60',
      cbd_content: '0',
      serving_size: '12 fl oz',
      calories: '25',
      ingredients: 'Carbonated Water, Cane Sugar, Natural Cola Flavors, THC Extract, Caramel Color, Phosphoric Acid'
    }
  };

  console.log('Sending update request...');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${API_URL}/api/vendor/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-vendor-id': VENDOR_ID
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  console.log('\nResponse:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ Update successful!');
    console.log('custom_fields:', result.product.custom_fields);
  } else {
    console.log('\n❌ Update failed!');
  }
}

testUpdate();
