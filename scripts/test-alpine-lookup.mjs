#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

async function testLookup(identifier) {
  console.log(`\n🔍 Testing lookup for: ${identifier}\n`);

  const url = `${ALPINE_BASE_URL}/api/v2/loyalty/lookup/${identifier}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Raw response:', text);

    try {
      const data = JSON.parse(text);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\n❌ Response is not valid JSON');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test with a few different identifiers
await testLookup('jessica.brown@email.com');
await testLookup('5033621111'); // phone number format
await testLookup('test@test.com');
