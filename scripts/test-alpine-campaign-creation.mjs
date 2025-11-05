#!/usr/bin/env node

/**
 * Deep dive into Alpine IQ campaign creation
 * Testing every possible way to create/trigger campaigns
 */

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

async function alpineRequest(method, endpoint, body) {
  const url = `${ALPINE_BASE_URL}${endpoint}`;
  console.log(`\n${method} ${url}`);

  if (body) {
    console.log('Body:', JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.log('Raw response:', text.substring(0, 200));
      return null;
    }

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    return { status: response.status, data, success: response.ok };
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

console.log('🔍 DEEP DIVE: Alpine IQ Campaign Creation\n');
console.log('═══════════════════════════════════════════════\n');

// 1. Try to create SMS campaign with full payload
console.log('📱 TEST 1: Create SMS Campaign (v2)');
console.log('─────────────────────────────────────');
await alpineRequest('POST', '/api/v2/campaign', {
  campaignName: 'Test SMS Campaign',
  campaignType: 'TEXT',
  message: 'Hello from API test',
  audienceId: null,
  scheduleDate: null,
  userId: ALPINE_USER_ID
});

// 2. Try v1.1 campaign creation
console.log('\n\n📱 TEST 2: Create SMS Campaign (v1.1)');
console.log('─────────────────────────────────────');
await alpineRequest('POST', `/api/v1.1/campaign/${ALPINE_USER_ID}`, {
  name: 'Test SMS Campaign v1.1',
  type: 'TEXT',
  message: 'Hello from API test',
  audience: []
});

// 3. Try notification endpoint with proper format
console.log('\n\n🔔 TEST 3: Send Notification');
console.log('─────────────────────────────────────');
await alpineRequest('POST', `/api/v2/notification`, {
  userId: ALPINE_USER_ID,
  contactId: 'test',
  message: 'Test notification',
  type: 'sms'
});

// 4. Try direct message endpoint
console.log('\n\n💬 TEST 4: Direct Message');
console.log('─────────────────────────────────────');
await alpineRequest('POST', `/api/v2/message`, {
  userId: ALPINE_USER_ID,
  phone: '+15555555555',
  message: 'Test direct message',
  type: 'sms'
});

// 5. Check if we can get campaign templates
console.log('\n\n📋 TEST 5: Get Campaign Templates');
console.log('─────────────────────────────────────');
await alpineRequest('GET', `/api/v2/campaign/templates`);
await alpineRequest('GET', `/api/v1.1/campaign/templates/${ALPINE_USER_ID}`);

// 6. Try to trigger/send an existing campaign
console.log('\n\n🚀 TEST 6: Trigger Existing Campaign');
console.log('─────────────────────────────────────');

// First get campaigns
const campaigns = await alpineRequest('GET', '/api/v2/campaigns');
if (campaigns?.data && campaigns.data.length > 0) {
  const campaignId = campaigns.data[0].id;
  console.log(`Found campaign ID: ${campaignId}`);

  // Try to trigger it
  await alpineRequest('POST', `/api/v2/campaign/${campaignId}/send`, {});
  await alpineRequest('POST', `/api/v2/campaign/${campaignId}/trigger`, {});
  await alpineRequest('PUT', `/api/v2/campaign/${campaignId}/send`, {});
  await alpineRequest('POST', `/api/v1.1/campaign/${ALPINE_USER_ID}/${campaignId}/send`, {});
}

// 7. Try audience-based message sending
console.log('\n\n👥 TEST 7: Send to Audience');
console.log('─────────────────────────────────────');
await alpineRequest('POST', `/api/v2/audience/message`, {
  userId: ALPINE_USER_ID,
  audienceId: 'all',
  message: 'Test to audience',
  type: 'sms'
});

// 8. Check for broadcast endpoint
console.log('\n\n📢 TEST 8: Broadcast Message');
console.log('─────────────────────────────────────');
await alpineRequest('POST', `/api/v2/broadcast`, {
  userId: ALPINE_USER_ID,
  message: 'Broadcast test',
  type: 'sms'
});

// 9. Try SMS-specific endpoint
console.log('\n\n📲 TEST 9: SMS Send Endpoint');
console.log('─────────────────────────────────────');
await alpineRequest('POST', `/api/v2/sms`, {
  userId: ALPINE_USER_ID,
  to: '+15555555555',
  message: 'Direct SMS test'
});

// 10. Check what endpoints exist by trying common patterns
console.log('\n\n🔎 TEST 10: Endpoint Discovery');
console.log('─────────────────────────────────────');

const testEndpoints = [
  '/api/v2/messaging/send',
  '/api/v2/communications/send',
  `/api/v2/users/${ALPINE_USER_ID}/campaigns/create`,
  `/api/v2/users/${ALPINE_USER_ID}/send`,
  '/api/v2/outbound/sms',
  '/api/v2/outbound/email',
];

for (const endpoint of testEndpoints) {
  await alpineRequest('POST', endpoint, {
    message: 'test',
    type: 'sms'
  });
}

console.log('\n\n═══════════════════════════════════════════════');
console.log('📊 ANALYSIS');
console.log('═══════════════════════════════════════════════\n');

console.log('If ALL tests failed, it confirms:');
console.log('❌ Alpine IQ has NO API for programmatic message sending\n');

console.log('This means your ONLY options are:\n');

console.log('Option 1: Use Alpine IQ Dashboard Only');
console.log('  - Log into their web dashboard');
console.log('  - Create campaigns manually');
console.log('  - Select audiences');
console.log('  - Schedule/send from UI');
console.log('  - NOT programmable\n');

console.log('Option 2: Replace Alpine IQ Entirely');
console.log('  - Use Twilio for SMS ($0.0079/msg)');
console.log('  - Use Resend for Email ($20/mo for 50k)');
console.log('  - Full API control');
console.log('  - Custom segmentation');
console.log('  - Programmatic sending\n');

console.log('Option 3: Hybrid (What I Recommend)');
console.log('  - Keep Alpine IQ for compliance tracking');
console.log('  - Keep Alpine IQ for manual campaigns (dashboard)');
console.log('  - Add Twilio/Resend for programmatic needs');
console.log('  - Best of both worlds\n');
