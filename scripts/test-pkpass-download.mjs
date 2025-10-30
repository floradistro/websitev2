#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487';

console.log('🔍 Testing for direct .pkpass file download endpoints\n');

const endpoints = [
  // Direct file download patterns
  `/api/v1.1/walletPass/${ALPINE_USER_ID}/${contactId}/download`,
  `/api/v1.1/walletPass/${ALPINE_USER_ID}/${contactId}.pkpass`,
  `/api/v1/walletPass/${ALPINE_USER_ID}/${contactId}/download`,
  `/api/v1/walletPass/${ALPINE_USER_ID}/${contactId}.pkpass`,
  
  // Pass file endpoints
  `/api/v1.1/passes/${ALPINE_USER_ID}/${contactId}/download`,
  `/api/v1.1/passes/${ALPINE_USER_ID}/${contactId}.pkpass`,
  `/api/v1/passes/${ALPINE_USER_ID}/${contactId}/file`,
  
  // Contact-specific endpoints
  `/api/v1.1/contacts/${contactId}/walletPass/download`,
  `/api/v1.1/contacts/${contactId}/pass.pkpass`,
  `/api/v1/${ALPINE_USER_ID}/contacts/${contactId}/walletPass/download`,
  
  // Alternative formats
  `/passes/${ALPINE_USER_ID}/${contactId}/download`,
  `/passes/${ALPINE_USER_ID}/${contactId}.pkpass`,
  `/walletPass/${ALPINE_USER_ID}/${contactId}/download.pkpass`,
];

for (const endpoint of endpoints) {
  try {
    const url = `https://lab.alpineiq.com${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'Accept': 'application/vnd.apple.pkpass, application/octet-stream, */*'
      }
    });
    
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    if (response.ok) {
      console.log(`✅ ${endpoint}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${contentType}`);
      
      if (contentDisposition) {
        console.log(`   Content-Disposition: ${contentDisposition}`);
      }
      
      // Check if it's a pkpass file
      if (contentType?.includes('pkpass') || 
          contentType?.includes('vnd.apple') ||
          contentType?.includes('octet-stream') ||
          contentDisposition?.includes('pkpass')) {
        console.log('   🎉 FOUND PKPASS FILE DOWNLOAD!\n');
        
        // Test the download
        const buffer = await response.arrayBuffer();
        console.log(`   File size: ${buffer.byteLength} bytes\n`);
      } else {
        console.log('');
      }
    }
  } catch (error) {
    // Skip errors
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
