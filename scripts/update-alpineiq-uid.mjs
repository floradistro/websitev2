import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function updateAlpineIQConfig() {
  console.log('🔧 Updating Alpine IQ configuration for Flora Distro...');
  
  const alpineConfig = {
    api_key: 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw',
    user_id: '3999', // Correct UID from Alpine IQ
    agency_id: null
  };

  const { data, error } = await supabase
    .from('vendors')
    .update({
      marketing_provider: 'alpineiq',
      marketing_config: alpineConfig
    })
    .eq('id', FLORA_VENDOR_ID)
    .select();

  if (error) {
    console.error('❌ Error updating Alpine IQ config:', error);
    return;
  }

  console.log('✅ Alpine IQ configuration updated successfully!');
  console.log('   UID: 3999');
  console.log('   API Key: U_SKZ...Iqw');
  console.log('');
  console.log('Updated vendor record:', data[0]);
}

updateAlpineIQConfig().catch(console.error);
