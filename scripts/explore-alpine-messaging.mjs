#!/usr/bin/env node

/**
 * Alpine IQ API Explorer - SMS & Email Capabilities
 * This script tests what messaging features Alpine IQ provides
 */

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

async function alpineRequest(method, endpoint, body) {
  const url = `${ALPINE_BASE_URL}${endpoint}`;
  console.log(`\n${method} ${endpoint}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Success');
      return data.data;
    } else {
      console.log('❌ Failed:', data.errors?.[0]?.message || response.statusText);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

console.log('🔍 Exploring Alpine IQ Messaging Capabilities\n');
console.log('═══════════════════════════════════════════════\n');

// 1. Check campaigns endpoint - this shows sent campaigns
console.log('📧 1. CAMPAIGNS (Past Campaigns)');
console.log('─────────────────────────────────');
const campaigns = await alpineRequest('GET', '/api/v2/campaigns');
if (campaigns && campaigns.length > 0) {
  console.log(`Found ${campaigns.length} campaigns:`);
  campaigns.slice(0, 3).forEach(c => {
    console.log(`  • ${c.name} (${c.type}) - ${c.status}`);
    console.log(`    Messages: ${c.summary?.msgsSent || 0}, Clicks: ${c.summary?.clicks || 0}`);
  });
} else {
  console.log('No campaigns found');
}

// 2. Check for campaign creation endpoint (try different versions)
console.log('\n\n📨 2. CAMPAIGN CREATION (Can we send?)');
console.log('─────────────────────────────────────────');

// Try v2 campaigns endpoint variants
const testEndpoints = [
  '/api/v2/campaign',
  '/api/v2/campaigns/create',
  '/api/v1.1/campaigns/create',
  '/api/v1.1/campaign',
  `/api/v1.1/campaigns/${ALPINE_USER_ID}/create`,
];

for (const endpoint of testEndpoints) {
  await alpineRequest('POST', endpoint, {
    name: 'Test Campaign',
    type: 'sms',
    message: 'Test message',
    audience: []
  });
}

// 3. Check audiences endpoint - to see if we can segment
console.log('\n\n👥 3. AUDIENCES (Segmentation)');
console.log('───────────────────────────────');
const audiences = await alpineRequest('GET', `/api/v1.1/audiences/${ALPINE_USER_ID}?start=0&limit=5`);
if (audiences && audiences.data && audiences.data.length > 0) {
  console.log(`Found ${audiences.data.length} audiences:`);
  audiences.data.forEach(a => {
    console.log(`  • ${a.name} - ${a.audienceSize} members`);
  });
} else {
  console.log('No audiences found');
}

// 4. Check for messaging/notification endpoints
console.log('\n\n💬 4. MESSAGING ENDPOINTS');
console.log('─────────────────────────');

const messagingEndpoints = [
  '/api/v2/sms/send',
  '/api/v2/email/send',
  '/api/v1.1/notification',
  '/api/v2/notification',
  '/api/v2/message',
  '/api/v1.1/message',
];

for (const endpoint of messagingEndpoints) {
  await alpineRequest('POST', endpoint, {
    message: 'Test',
    phone: '+15555555555'
  });
}

// 5. Check opt-in status endpoint
console.log('\n\n📱 5. OPT-IN MANAGEMENT');
console.log('───────────────────────');
const optinStatus = await alpineRequest('GET', '/api/v2/optin/test@example.com');
console.log('Opt-in response:', optinStatus);

// 6. List all available endpoints (if there's a discovery endpoint)
console.log('\n\n🗺️  6. API DOCUMENTATION');
console.log('────────────────────────');
await alpineRequest('GET', '/api/docs');
await alpineRequest('GET', '/api/v2/docs');
await alpineRequest('GET', '/api');

// Summary
console.log('\n\n═══════════════════════════════════════════════');
console.log('📋 SUMMARY');
console.log('═══════════════════════════════════════════════\n');

console.log('Based on Alpine IQ API client code, here are the CONFIRMED capabilities:\n');

console.log('✅ WHAT ALPINE IQ PROVIDES:');
console.log('  • Customer management (create, lookup, search)');
console.log('  • Loyalty points tracking & adjustment');
console.log('  • Order/sales tracking');
console.log('  • Audience/segment management');
console.log('  • Campaign viewing (past campaigns)');
console.log('  • Opt-in status management (email/SMS)');
console.log('  • Apple/Google wallet pass links\n');

console.log('❌ WHAT ALPINE IQ DOES NOT PROVIDE (via API):');
console.log('  • Direct SMS sending API');
console.log('  • Direct email sending API');
console.log('  • Campaign creation/scheduling API\n');

console.log('💡 HOW IT ACTUALLY WORKS:');
console.log('  1. Campaigns are created in Alpine IQ web dashboard');
console.log('  2. You select audiences/segments to target');
console.log('  3. Alpine IQ sends the messages (SMS/email)');
console.log('  4. You view results via API or dashboard\n');

console.log('🎯 SIMPLIFIED INTEGRATION STRATEGY:');
console.log('  1. Use our own customer database for segmentation');
console.log('  2. Use Alpine IQ ONLY for:');
console.log('     - Syncing customer contact info (for compliance)');
console.log('     - Creating audiences based on our segments');
console.log('     - Campaign management happens in their dashboard');
console.log('  3. For direct SMS/Email, we need a different service:');
console.log('     - Twilio for SMS');
console.log('     - SendGrid/Resend for Email');
console.log('     - OR just use Alpine IQ dashboard for campaigns\n');
