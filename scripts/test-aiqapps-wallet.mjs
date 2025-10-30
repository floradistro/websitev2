#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487';

console.log('🔍 Testing aiqapps.com wallet pass endpoints\n');

const baseUrls = [
  'https://3999.aiqapps.com',
  'https://wallet.alpineiq.com'
];

const paths = [
  `/w/walletPass/${contactId}`,
  `/w/wallet/${contactId}`,
  `/w/pass/${contactId}`,
  `/w/passes/${contactId}`,
  `/walletPass/${contactId}`,
  `/wallet/${contactId}`,
  `/pass/${contactId}`,
  `/passes/${contactId}`,
  `/w/passes/apple/${contactId}`,
  `/w/passes/google/${contactId}`,
  `/passes/apple/${contactId}`,
  `/passes/google/${contactId}`
];

for (const baseUrl of baseUrls) {
  for (const path of paths) {
    try {
      const url = `${baseUrl}${path}`;
      const response = await fetch(url, {
        headers: {
          'X-APIKEY': ALPINE_API_KEY
        },
        redirect: 'manual'
      });
      
      if (response.ok || response.status === 302 || response.status === 301) {
        console.log(`\n✅ ${url}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        
        const location = response.headers.get('location');
        if (location) {
          console.log(`   Redirect: ${location}`);
        }
        
        if (contentType?.includes('pkpass') || contentType?.includes('wallet')) {
          console.log('   🎉 FOUND WALLET PASS FILE!');
        }
      }
    } catch (error) {
      // Skip
    }
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
