import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying vendor_domains migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251021_vendor_custom_domains.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n📋 Applying migration manually via SQL...\n');
      
      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const result = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (result.error) {
          console.log(`⚠️ Warning: ${result.error.message}`);
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Verifying table creation...');
    
    // Verify table exists
    const { data: tables, error: tableError } = await supabase
      .from('vendor_domains')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table verification failed:', tableError);
      console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
      console.log('\n' + migrationSQL);
    } else {
      console.log('✅ vendor_domains table is ready!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📝 Please apply the migration manually:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run: supabase/migrations/20251021_vendor_custom_domains.sql');
  }
}

applyMigration();

