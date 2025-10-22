import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function checkUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('first_name', '%pardeep%');

  console.log('Pardeep user(s):', JSON.stringify(data, null, 2));
  
  if (error) {
    console.error('Error:', error);
  }
}

checkUser();

