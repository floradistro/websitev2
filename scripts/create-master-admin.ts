/**
 * Create Master Admin User
 * Creates the yacht master admin account in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMasterAdmin() {
  console.log('🚢 Creating Yacht Master admin account...\n');

  const email = 'yacht@yachtclub.vip';
  const password = 'floyddeservedit';

  try {
    // 1. Check if auth user already exists
    console.log('1️⃣  Checking for existing auth user...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    let authUserId;
    let existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      console.log('⚠️  Auth user already exists:', existingUser.id);
      authUserId = existingUser.id;
      
      // Update password
      console.log('🔐 Updating password...');
      await supabase.auth.admin.updateUserById(existingUser.id, { password });
      console.log('✅ Password updated');
    } else {
      // Create new auth user
      console.log('➕ Creating new auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: 'jewsdid911',
          display_name: 'Yacht Master',
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from auth creation');

      authUserId = authData.user.id;
      console.log('✅ Auth user created:', authData.user.id);
    }

    // 2. Create or update users table entry
    console.log('\n2️⃣  Creating/updating users table entry...');
    const { data: existingDbUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (existingDbUser) {
      console.log('⚠️  User record already exists, updating...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          email,
          first_name: 'Yacht',
          last_name: 'Master',
          status: 'active',
          login_enabled: true,
          metadata: {
            username: 'jewsdid911',
            display_name: 'Yacht Master',
          },
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', authUserId);

      if (updateError) throw updateError;
      console.log('✅ User record updated');
    } else {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          role: 'admin',
          email,
          first_name: 'Yacht',
          last_name: 'Master',
          status: 'active',
          login_enabled: true,
          metadata: {
            username: 'jewsdid911',
            display_name: 'Yacht Master',
          }
        });

      if (insertError) throw insertError;
      console.log('✅ User record created');
    }

    console.log('\n🎉 Master admin account ready!');
    console.log('\n📋 Credentials:');
    console.log('   Email: yacht@yachtclub.vip');
    console.log('   Password: floyddeservedit');
    console.log('   Role: admin');
    console.log('\n🔗 Login at: https://www.yachtclub.vip/admin/login');

  } catch (error: any) {
    console.error('\n❌ Error creating master admin:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createMasterAdmin();
