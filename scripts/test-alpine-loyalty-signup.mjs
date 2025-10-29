#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

console.log('🧪 Testing Alpine IQ Loyalty Signup Endpoint\n');

// Test 1: Sign up new loyalty member
console.log('1️⃣ Testing: POST /api/v2/loyalty (Sign up new member)');
try {
  const response = await fetch(`${ALPINE_BASE_URL}/api/v2/loyalty`, {
    method: 'POST',
    headers: {
      'x-apikey': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: ALPINE_USER_ID,
      email: 'testcustomer@example.com',
      mobilePhone: '5551234567',
      firstName: 'Test',
      lastName: 'Customer',
      address: '123 Test St',
      favoriteStore: 'Main Location',
      loyalty: true
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

// Test 2: Check customer wallet
console.log('\n2️⃣ Testing: POST /api/v2/wallet (Get customer rewards)');
try {
  const response = await fetch(`${ALPINE_BASE_URL}/api/v2/wallet`, {
    method: 'POST',
    headers: {
      'x-apikey': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: ALPINE_USER_ID,
      email: 'testcustomer@example.com',
      phone: '5551234567'
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
