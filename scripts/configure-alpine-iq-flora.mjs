import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

async function configureAlpineIQ() {
  console.log('🔧 Configuring Alpine IQ for Flora Distro...\n');

  // Get Flora Distro vendor
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', 'flora-distro')
    .single();

  if (vendorError || !vendor) {
    console.error('❌ Flora Distro vendor not found');
    return;
  }

  console.log('✅ Found vendor:', vendor.store_name);
  console.log('   ID:', vendor.id);
  console.log('   Current marketing provider:', vendor.marketing_provider || 'none');
  console.log('');

  // Configure Alpine IQ
  const alpineConfig = {
    api_key: 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw',
    user_id: '2016', // Flora Distro's Alpine IQ User ID
    agency_id: null
  };

  const { data: updated, error: updateError } = await supabase
    .from('vendors')
    .update({
      marketing_provider: 'alpineiq',
      marketing_config: alpineConfig
    })
    .eq('id', vendor.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating vendor:', updateError);
    return;
  }

  console.log('✅ Alpine IQ configured successfully!');
  console.log('');
  console.log('📋 Configuration:');
  console.log('   Provider: alpineiq');
  console.log('   User ID: 2016');
  console.log('   API Key: U_SKZShK...Pmq8BFtOiWFEMRPmB6Iqw (hidden)');
  console.log('');
  console.log('🎉 Flora Distro is now ready for POS sales sync with Alpine IQ!');
}

configureAlpineIQ().catch(console.error);
