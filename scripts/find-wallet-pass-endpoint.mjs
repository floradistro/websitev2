#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';
const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487';

console.log('🔍 Testing Alpine IQ wallet pass file endpoints\n');

// Try different endpoint variations for actual pass files
const endpoints = [
  `/api/v1/${ALPINE_USER_ID}/contacts/${contactId}/walletPass`,
  `/api/v1/contacts/${contactId}/walletPass`,
  `/api/v1/${ALPINE_USER_ID}/walletPass/apple/${contactId}`,
  `/api/v1/${ALPINE_USER_ID}/walletPass/google/${contactId}`,
  `/api/v1/walletPass/apple/${ALPINE_USER_ID}/${contactId}`,
  `/api/v1/walletPass/google/${ALPINE_USER_ID}/${contactId}`,
  `/api/v1/${ALPINE_USER_ID}/passes/${contactId}/apple`,
  `/api/v1/${ALPINE_USER_ID}/passes/${contactId}/google`,
  `/walletPass/${ALPINE_USER_ID}/${contactId}/apple`,
  `/walletPass/${ALPINE_USER_ID}/${contactId}/google`,
  `/${ALPINE_USER_ID}/walletPass/${contactId}`,
  `/passes/apple/${ALPINE_USER_ID}/${contactId}`,
  `/passes/google/${ALPINE_USER_ID}/${contactId}`
];

for (const endpoint of endpoints) {
  try {
    const response = await fetch(`${ALPINE_BASE_URL}${endpoint}`, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY
      }
    });
    
    const contentType = response.headers.get('content-type');
    
    if (response.ok || response.status === 302 || response.status === 301) {
      console.log(`\n✅ ${endpoint}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${contentType}`);
      
      // Check for redirects
      const location = response.headers.get('location');
      if (location) {
        console.log(`   Redirect to: ${location}`);
      }
      
      if (contentType?.includes('application/vnd.apple.pkpass') || 
          contentType?.includes('application/vnd.google.wallet') ||
          contentType?.includes('application/octet-stream')) {
        console.log('   🎉 FOUND WALLET PASS FILE!');
      }
    }
  } catch (error) {
    // Skip errors
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
