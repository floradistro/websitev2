import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function createTestCustomer() {
  console.log('👤 Creating test customer for Flora Distro...\n');

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      vendor_id: FLORA_VENDOR_ID,
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test.customer@floradistro.test',
      phone: '+1234567890',
      metadata: {
        test_customer: true,
        created_for: 'POS testing'
      }
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating customer:', error);
    return;
  }

  console.log('✅ Test customer created:', {
    id: customer.id,
    name: `${customer.first_name} ${customer.last_name}`,
    email: customer.email,
    phone: customer.phone
  });

  console.log('\n🎉 Ready for POS testing!');
}

createTestCustomer().catch(console.error);
