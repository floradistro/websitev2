#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

async function testEndpoint(endpoint, method, body) {
  console.log(`\n🧪 Testing: ${method} ${endpoint}`);

  try {
    const response = await fetch(`${ALPINE_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    const text = await response.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log(`   Response:`, JSON.stringify(data, null, 2));
      } catch {
        console.log(`   Response (text):`, text.substring(0, 200));
      }
    }

    return response.status;
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return null;
  }
}

console.log('🚀 Testing Alpine IQ Push Endpoints\n');

// Test contact creation/update endpoints
const testContact = {
  firstName: 'Test',
  lastName: 'Customer',
  email: 'test@example.com',
  phone: '5551234567',
  birthdate: '1990-01-01'
};

await testEndpoint(`/api/v1.1/contact/${ALPINE_USER_ID}`, 'POST', testContact);
await testEndpoint(`/api/v2/contact/${ALPINE_USER_ID}`, 'POST', testContact);
await testEndpoint(`/api/v1.1/contacts/${ALPINE_USER_ID}`, 'POST', testContact);
await testEndpoint(`/api/v2/contacts`, 'POST', { ...testContact, userId: ALPINE_USER_ID });

// Test transaction endpoints
const testTransaction = {
  contactEmail: 'test@example.com',
  amount: 50.00,
  timestamp: new Date().toISOString(),
  items: [
    { name: 'Test Product', quantity: 1, price: 50.00 }
  ]
};

await testEndpoint(`/api/v1.1/transaction/${ALPINE_USER_ID}`, 'POST', testTransaction);
await testEndpoint(`/api/v2/transaction/${ALPINE_USER_ID}`, 'POST', testTransaction);
await testEndpoint(`/api/v1.1/sales/${ALPINE_USER_ID}`, 'POST', testTransaction);

console.log('\n✅ Testing complete');
