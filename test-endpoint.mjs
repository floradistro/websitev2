import { config } from 'dotenv';
config({ path: '.env.local' });

async function testEndpoint() {
  // Get auth token first
  const authResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: 'fahad@floradistro.com',
      password: 'FahadKhan123!!',
    }),
  });

  const authData = await authResponse.json();
  if (!authData.access_token) {
    console.log('Auth failed:', authData);
    return;
  }

  console.log('✅ Authenticated');

  // Call test endpoint
  const testResponse = await fetch('https://whaletools.dev/api/pos/payment-processors/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.access_token}`,
    },
    body: JSON.stringify({
      processorId: '8acc43df-9ef1-4dce-b53b-bea6a2544977', // uno processor
      amount: 1.00,
    }),
  });

  const testData = await testResponse.json();
  console.log('\n📡 Test Response:');
  console.log('Status:', testResponse.status);
  console.log('Data:', JSON.stringify(testData, null, 2));
}

testEndpoint().catch(console.error);
