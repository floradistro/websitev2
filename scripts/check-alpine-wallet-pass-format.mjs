#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';
const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487';

console.log('🔍 Testing different Alpine IQ wallet pass URL formats\n');

// Try different endpoint variations
const endpoints = [
  `/api/v1.1/walletPass/${ALPINE_USER_ID}/${contactId}`,
  `/api/v1/walletPass/${ALPINE_USER_ID}/${contactId}`,
  `/api/v1.1/passes/${ALPINE_USER_ID}/${contactId}`,
  `/api/v1/passes/${ALPINE_USER_ID}/${contactId}`,
  `/passes/${ALPINE_USER_ID}/${contactId}`,
  `/wallet/${ALPINE_USER_ID}/${contactId}`,
  `/api/v1.1/contacts/${contactId}/walletPass`,
  `/api/v1.1/contacts/${ALPINE_USER_ID}/${contactId}/walletPass`
];

for (const endpoint of endpoints) {
  console.log(`\nTesting: ${ALPINE_BASE_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${ALPINE_BASE_URL}${endpoint}`, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY
      }
    });
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log(`  Content-Type: ${contentType}`);
      
      const text = await response.text();
      
      if (contentType?.includes('json')) {
        try {
          const data = JSON.parse(text);
          console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 500));
        } catch (e) {
          console.log(`  Response (text):`, text.substring(0, 200));
        }
      } else {
        console.log(`  Response length: ${text.length} bytes`);
        console.log(`  First 200 chars:`, text.substring(0, 200));
      }
    } else {
      const text = await response.text();
      console.log(`  Error:`, text.substring(0, 200));
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
