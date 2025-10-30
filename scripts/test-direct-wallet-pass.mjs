#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487';

console.log('🔍 Testing direct wallet pass download URLs (no login required)\n');

// Try different URL patterns that might bypass login
const urls = [
  // Direct pass file endpoints
  `https://lab.alpineiq.com/api/passes/${ALPINE_USER_ID}/${contactId}/download`,
  `https://lab.alpineiq.com/passes/${ALPINE_USER_ID}/${contactId}.pkpass`,
  `https://3999.aiqapps.com/passes/${contactId}/download`,
  `https://3999.aiqapps.com/api/passes/${contactId}`,
  
  // Mobile-specific endpoints
  `https://lab.alpineiq.com/m/wallet/${ALPINE_USER_ID}/${contactId}`,
  `https://3999.aiqapps.com/m/wallet/${contactId}`,
  
  // Public pass endpoints
  `https://lab.alpineiq.com/public/wallet/${ALPINE_USER_ID}/${contactId}`,
  `https://3999.aiqapps.com/public/passes/${contactId}`,
  
  // Campaign-style URLs
  `https://lab.alpineiq.com/c/wallet/${ALPINE_USER_ID}/${contactId}`,
  `https://3999.aiqapps.com/c/passes/${contactId}`,
];

for (const url of urls) {
  try {
    const response = await fetch(url, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      redirect: 'manual'
    });
    
    const contentType = response.headers.get('content-type');
    const location = response.headers.get('location');
    
    // Look for successful responses
    if (response.status === 200 || response.status === 302) {
      console.log(`✅ ${url}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${contentType}`);
      
      if (location) {
        console.log(`   Redirect: ${location}`);
      }
      
      // Check if it's a wallet pass file
      if (contentType?.includes('pkpass') || contentType?.includes('vnd.apple') || contentType?.includes('vnd.google')) {
        console.log('   🎉 DIRECT WALLET PASS FILE!\n');
      } else if (!contentType?.includes('html')) {
        console.log('   📄 Non-HTML response (might be pass file)\n');
      } else {
        console.log('');
      }
    }
  } catch (error) {
    // Skip
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('💡 If no direct pass URLs found, customers must:');
console.log('1. Click the wallet URL on their MOBILE device');
console.log('2. Alpine IQ will detect their device and show "Add to Wallet" button');
console.log('3. No login required - the contact ID in URL authenticates them\n');
