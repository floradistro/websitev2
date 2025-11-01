import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCharlotteAuth() {
  try {
    console.log('Creating auth user for Charlotte Cental...');

    // Create user with Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'charlottecental@floradistro.com',
      password: 'Nations123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Charlotte',
        last_name: 'Cental'
      }
    });

    if (error) {
      console.error('Error creating auth user:', error);
      process.exit(1);
    }

    console.log('✅ Auth user created:', data.user.id);
    console.log('Email:', data.user.email);

    // Update the users table to link auth_user_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_user_id: data.user.id })
      .eq('email', 'charlottecental@floradistro.com');

    if (updateError) {
      console.error('Error linking auth user:', updateError);
      process.exit(1);
    }

    console.log('✅ Linked auth_user_id to employee record');
    console.log('\nLogin credentials:');
    console.log('Email: charlottecental@floradistro.com');
    console.log('Password: Nations123!');

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createCharlotteAuth();
