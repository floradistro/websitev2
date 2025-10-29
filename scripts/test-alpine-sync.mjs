#!/usr/bin/env node

import { createAlpineIQClient } from '../lib/marketing/alpineiq-client.js';

const config = {
  api_key: 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw',
  user_id: '3999',
};

async function test() {
  console.log('🔧 Testing Alpine IQ Client...\n');

  const client = createAlpineIQClient(config);

  // Test connection
  console.log('1️⃣ Testing connection...');
  const connected = await client.testConnection();
  console.log(`   ${connected ? '✅' : '❌'} Connection: ${connected ? 'SUCCESS' : 'FAILED'}\n`);

  if (!connected) {
    console.error('Cannot proceed - connection failed');
    process.exit(1);
  }

  // Get loyalty config
  console.log('2️⃣ Getting loyalty config...');
  try {
    const loyaltyConfig = await client.getLoyaltyConfig();
    console.log('   ✅ Loyalty Program:', loyaltyConfig.name);
    console.log('   📊 Tiers:', loyaltyConfig.tiers?.length || 0);
    console.log('');
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // Get audiences
  console.log('3️⃣ Getting audiences...');
  try {
    const audiences = await client.getAudiences({ limit: 100 });
    console.log(`   ✅ Found ${audiences.length} audiences`);

    // Find loyalty audience
    const loyaltyAudience = audiences.find(a =>
      a.name === 'Signed Up' || a.traits?.some(t => t.type === 'loyaltyMember' && t.value === true)
    );

    if (loyaltyAudience) {
      console.log(`   🎯 Loyalty Audience: "${loyaltyAudience.name}"`);
      console.log(`   👥 Members: ${loyaltyAudience.audienceSize}`);
      console.log(`   📧 Email Opt-In: ${loyaltyAudience.optInEmailSize}`);
      console.log(`   📱 SMS Opt-In: ${loyaltyAudience.optInPhoneSize}`);
    } else {
      console.log('   ⚠️  No loyalty audience found!');
      console.log('   Available audiences:');
      audiences.slice(0, 5).forEach(a => {
        console.log(`      - ${a.name} (${a.audienceSize} members)`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // Get loyalty members
  console.log('4️⃣ Getting loyalty members (limit 5)...');
  try {
    const members = await client.getLoyaltyMembers({ limit: 5 });
    console.log(`   ✅ Retrieved ${members.length} members`);

    if (members.length > 0) {
      console.log('\n   Sample Members:');
      members.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.email}`);
        console.log(`      Points: ${m.points} | Tier: ${m.tier} (Level ${m.tierLevel})`);
        console.log(`      Lifetime Points: ${m.lifetimePoints}`);
      });
    } else {
      console.log('   ⚠️  No members returned');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

test().catch(console.error);
