#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487';

console.log('🔍 Testing Alpine IQ direct pass download URLs (bypass login)\n');

// Test campaign-style URLs and public pass URLs
const testUrls = [
  // Public pass URLs
  `https://lab.alpineiq.com/p/${ALPINE_USER_ID}/${contactId}`,
  `https://3999.aiqapps.com/p/${contactId}`,
  
  // Campaign URLs
  `https://lab.alpineiq.com/l/${ALPINE_USER_ID}/${contactId}`,
  `https://3999.aiqapps.com/l/${contactId}`,
  
  // Download URLs
  `https://lab.alpineiq.com/d/${ALPINE_USER_ID}/${contactId}`,
  `https://3999.aiqapps.com/d/${contactId}`,
  
  // Token URLs
  `https://lab.alpineiq.com/t/${ALPINE_USER_ID}/${contactId}`,
  
  // Mobile app deep link style
  `https://lab.alpineiq.com/app/wallet/${ALPINE_USER_ID}/${contactId}`,
  `https://3999.aiqapps.com/app/wallet/${contactId}`,
  
  // API download endpoints with authentication
  `https://lab.alpineiq.com/api/v1.1/public/walletPass/${ALPINE_USER_ID}/${contactId}`,
  `https://lab.alpineiq.com/api/v1/public/walletPass/${ALPINE_USER_ID}/${contactId}`,
];

for (const url of testUrls) {
  try {
    const response = await fetch(url, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
      },
      redirect: 'manual'
    });
    
    const contentType = response.headers.get('content-type');
    const location = response.headers.get('location');
    
    if (response.status === 200 && !contentType?.includes('text/html')) {
      console.log(`✅ FOUND: ${url}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${contentType}`);
      
      if (contentType?.includes('pkpass') || contentType?.includes('vnd.apple')) {
        console.log('   🎉 THIS IS A DIRECT PKPASS FILE!\n');
      }
    } else if (response.status === 302 || response.status === 301) {
      console.log(`🔗 REDIRECT: ${url}`);
      console.log(`   → ${location}\n`);
    }
  } catch (error) {
    // Skip
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nIf no direct URLs found, we need to either:');
console.log('1. Contact Alpine IQ support for direct pass URLs');
console.log('2. Generate our own wallet passes (requires Apple Developer account)\n');
