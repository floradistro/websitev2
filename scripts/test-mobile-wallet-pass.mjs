#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487';

console.log('🔍 Testing wallet pass URLs with mobile User-Agent headers\n');

const userAgents = {
  'iPhone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Android': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
};

const baseUrls = [
  'https://lab.alpineiq.com',
  'https://3999.aiqapps.com',
  'https://wallet.alpineiq.com'
];

const paths = [
  `/wallet/${ALPINE_USER_ID}/${contactId}`,
  `/passes/${ALPINE_USER_ID}/${contactId}`,
  `/w/passes/${contactId}`,
  `/w/wallet/${contactId}`
];

for (const [device, userAgent] of Object.entries(userAgents)) {
  console.log(`\n━━━ Testing with ${device} User-Agent ━━━\n`);
  
  for (const baseUrl of baseUrls) {
    for (const path of paths) {
      const url = `${baseUrl}${path}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'X-APIKEY': ALPINE_API_KEY,
            'User-Agent': userAgent
          },
          redirect: 'manual'
        });
        
        const contentType = response.headers.get('content-type');
        const location = response.headers.get('location');
        
        // Check for wallet pass file types or redirects
        if (contentType?.includes('pkpass') || 
            contentType?.includes('vnd.apple') ||
            contentType?.includes('vnd.google') ||
            contentType?.includes('octet-stream') ||
            location?.includes('pkpass') ||
            location?.includes('wallet')) {
          
          console.log(`✅ ${url}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Content-Type: ${contentType}`);
          if (location) console.log(`   Redirect: ${location}`);
          console.log('   🎉 POTENTIAL WALLET PASS!\n');
        }
      } catch (error) {
        // Skip
      }
    }
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
