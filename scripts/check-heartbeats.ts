import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkHeartbeats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: devices } = await supabase
    .from('tv_devices')
    .select('tv_number, device_name, connection_status, last_heartbeat_at')
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .order('tv_number');

  console.log('\n📺 TV Devices Heartbeat Status:\n');
  const now = new Date();

  devices?.forEach(device => {
    const lastHeartbeat = device.last_heartbeat_at ? new Date(device.last_heartbeat_at) : null;
    const secondsAgo = lastHeartbeat ? Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000) : null;

    console.log(`TV ${device.tv_number} (${device.device_name}):`);
    console.log(`  DB Status: ${device.connection_status}`);
    console.log(`  Last Heartbeat: ${device.last_heartbeat_at}`);
    console.log(`  Time Since: ${secondsAgo !== null ? `${secondsAgo} seconds ago` : 'never'}`);
    console.log(`  Actual Status: ${secondsAgo !== null && secondsAgo < 60 ? 'ONLINE ✅' : 'OFFLINE ❌'}`);
    console.log('');
  });
}

checkHeartbeats();
