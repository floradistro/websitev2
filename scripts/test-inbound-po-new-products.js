const axios = require('axios');

async function testInboundPOWithNewProducts() {
  console.log('🧪 Testing Inbound PO with non-existent product...\n');

  try {
    // Test 1: Try to create PO with fake product ID
    console.log('Test 1: Creating PO with non-existent product_id');
    const response = await axios.post('http://localhost:3000/api/vendor/purchase-orders', {
      action: 'create',
      vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
      po_type: 'inbound',
      supplier_id: 'bd4b6ab3-7049-4045-a0fe-4f5c3bf6aab6',
      items: [{
        product_id: '00000000-0000-0000-0000-000000000000', // Fake ID
        quantity: 10,
        unit_price: 25.00
      }]
    });

    console.log('✅ PO Created (UNEXPECTED!):', response.data);
  } catch (error) {
    console.log('❌ PO Creation Failed (EXPECTED):');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.error || error.message);
  }

  console.log('\n---\n');

  // Test 2: Check what products are available for inbound POs
  console.log('Test 2: Checking available products for inbound PO creation');
  try {
    const productsRes = await axios.get('http://localhost:3000/api/vendor/products', {
      headers: { 'x-vendor-id': 'cd2e1122-d511-4edb-be5d-98ef274b4baf' }
    });

    const publishedCount = (productsRes.data.products || []).filter(p => p.status === 'published').length;
    console.log('📦 Total products in catalog:', productsRes.data.total || 0);
    console.log('✅ Published products:', publishedCount);
    console.log('⚠️  Can ONLY order from these', publishedCount, 'products');
  } catch (error) {
    console.log('❌ Error fetching products:', error.message);
  }

  console.log('\n---\n');
  console.log('💡 Conclusion:');
  console.log('   Current system can ONLY create POs for products already in catalog.');
  console.log('   This is BROKEN for real-world inbound PO workflow!');
  console.log('   Suppliers have products you don\'t carry yet.');
}

testInboundPOWithNewProducts();
