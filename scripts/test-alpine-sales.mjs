#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

console.log('🧪 Testing Alpine IQ Sales Submission\n');

// Test: Submit a sale/transaction
console.log('Testing: POST /api/v1.1/createUpdateSale/:uid');

try {
  const response = await fetch(`${ALPINE_BASE_URL}/api/v1.1/createUpdateSale/${ALPINE_USER_ID}`, {
    method: 'POST',
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      member: {
        email: 'testcustomer@example.com',
        mobilePhone: '5551234567',
        firstName: 'Test',
        lastName: 'Customer'
      },
      visit: {
        pos_id: 'TEST-ORDER-001',
        pos_user: 'testuser@example.com',
        pos_type: 'online',
        transaction_date: new Date().toISOString().replace('T', ' ').split('.')[0] + ' +0000',
        location: 'Test Store',
        budtenderName: 'Test Employee',
        budtenderID: 'EMP001',
        visit_details_attributes: [
          {
            sku: 'TEST-SKU-001',
            size: '3.5g',
            category: 'FLOWER',
            subcategory: 'Indoor',
            brand: 'Test Brand',
            name: 'Test Product - 3.5g',
            strain: 'Test Strain',
            grade: 'A',
            species: 'hybrid',
            price: 35.00,
            discount: 5.00,
            quantity: 1,
            customAttributes: [
              {
                key: 'TestAttribute',
                value: 'TestValue'
              }
            ]
          }
        ],
        transaction_total: 30.00,
        send_notification: false
      }
    })
  });

  console.log(`   Status: ${response.status} ${response.statusText}`);

  const text = await response.text();
  if (text) {
    try {
      const data = JSON.parse(text);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
    } catch {
      console.log(`   Response (text):`, text.substring(0, 500));
    }
  }
} catch (error) {
  console.error(`   ❌ Error:`, error.message);
}

console.log('\n✅ Testing complete\n');
