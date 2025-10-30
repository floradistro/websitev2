#!/usr/bin/env node

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const contactId = 'b582ae88-5777-437a-8ceb-ae1c064d0487'; // fahad@cwscommercial.com

console.log('🎫 Creating Wallet Pass Campaign for Flora Distribution\n');

// Try to create a wallet pass campaign
const campaignPayload = {
  name: 'Wallet Pass - Test Campaign',
  description: 'Test wallet pass distribution for Flora Distro',
  type: 'wallet_pass', // or 'walletpass'
  audience: {
    contacts: [contactId]
  },
  channels: ['wallet_pass'],
  status: 'active'
};

console.log('Payload:', JSON.stringify(campaignPayload, null, 2));
console.log('\nSending request to Alpine IQ...\n');

try {
  // Try v1.1 campaigns endpoint
  const response = await fetch(`${ALPINE_BASE_URL}/api/v1.1/campaigns/${ALPINE_USER_ID}`, {
    method: 'POST',
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(campaignPayload)
  });

  console.log(`Response Status: ${response.status} ${response.statusText}`);

  const responseText = await response.text();
  console.log('Response:', responseText);

  if (response.ok) {
    const data = JSON.parse(responseText);
    console.log('\n✅ Campaign created successfully!');
    console.log('Campaign ID:', data.id || data.campaignId);
  } else {
    console.log('\n❌ Failed to create campaign');
    console.log('\nTrying alternate endpoint...');

    // Try v1 endpoint
    const response2 = await fetch(`${ALPINE_BASE_URL}/api/v1/campaigns/${ALPINE_USER_ID}`, {
      method: 'POST',
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campaignPayload)
    });

    console.log(`\nAlternate Response: ${response2.status} ${response2.statusText}`);
    const responseText2 = await response2.text();
    console.log('Response:', responseText2);
  }

} catch (error) {
  console.error('\n❌ Error:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Manual Steps:');
console.log('If API creation failed, create manually in Alpine IQ:');
console.log('1. Go to: https://lab.alpineiq.com');
console.log('2. Marketing → Campaigns → Create Campaign');
console.log('3. Select "Wallet Pass" as channel');
console.log('4. Select audience or specific contacts');
console.log('5. Publish the campaign');
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
