#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

// Get a real customer email from the 6 that have points
const testEmails = [
  'jessica.brown@email.com',
  'sarah.johnson@email.com',
  'emily.davis@email.com'
];

for (const email of testEmails) {
  console.log(`\n🔍 Testing ${email}\n`);

  // Try different endpoint formats
  const endpoints = [
    `/api/v2/loyalty/lookup/${email}`,
    `/api/v1.1/wallet/${ALPINE_USER_ID}/${email}`,
    `/api/v1.1/contact/${ALPINE_USER_ID}/${email}`,
    `/api/v2/contacts/${email}`,
  ];

  for (const endpoint of endpoints) {
    console.log(`  Testing: ${endpoint}`);

    // Try GET
    try {
      const response = await fetch(`${ALPINE_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'X-APIKEY': ALPINE_API_KEY }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`    ✅ GET worked! Response:`, JSON.stringify(data, null, 2));
        break;
      } else {
        console.log(`    ❌ GET ${response.status}`);
      }
    } catch (e) {
      console.log(`    ❌ GET error: ${e.message}`);
    }
  }
}
