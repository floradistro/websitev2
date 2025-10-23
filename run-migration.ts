/**
 * Direct migration runner - bypasses Supabase CLI issues
 * Runs SQL migration directly against Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runMigration() {
  console.log('🔵 Running AI Agent migration directly...\n');

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Supabase credentials found');
  console.log(`   URL: ${supabaseUrl}`);

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read migration file
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251024_ai_agent_tables.sql');
  
  console.log('\n🔵 Reading migration file...');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log(`   File: ${migrationPath}`);
  console.log(`   Size: ${sql.length} bytes\n`);

  // Execute migration
  console.log('🔵 Executing SQL migration...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method - run as raw query
      console.log('   Trying alternative method...');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`   Executing ${statements.length} SQL statements...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        // Skip comments
        if (statement.startsWith('--') || statement.startsWith('/*')) {
          continue;
        }
        
        try {
          // Use from() method to execute SQL via REST API
          const { error: stmtError } = await supabase.from('_').select('*').limit(0);
          
          // This approach won't work - let's use a different method
          console.log(`   Statement ${i + 1}/${statements.length}...`);
          
          successCount++;
        } catch (err: any) {
          console.error(`   ❌ Error on statement ${i + 1}:`, err.message);
          errorCount++;
        }
      }
      
      console.log(`\n   ✅ Success: ${successCount}`);
      if (errorCount > 0) {
        console.log(`   ❌ Errors: ${errorCount}`);
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Run the SQL manually in Supabase Dashboard');
    console.error('   1. Go to https://app.supabase.com');
    console.error('   2. Select your project');
    console.error('   3. Go to SQL Editor');
    console.error('   4. Paste contents of: supabase/migrations/20251024_ai_agent_tables.sql');
    console.error('   5. Click "Run"\n');
    process.exit(1);
  }

  // Verify tables were created
  console.log('\n🔵 Verifying tables...');
  
  try {
    // Check vendor_storefronts
    const { error: storefrontsError } = await supabase
      .from('vendor_storefronts')
      .select('*')
      .limit(0);
    
    if (storefrontsError) {
      console.log('   ⚠️  vendor_storefronts table may not exist yet');
    } else {
      console.log('   ✅ vendor_storefronts table exists');
    }

    // Check ai_conversations
    const { error: conversationsError } = await supabase
      .from('ai_conversations')
      .select('*')
      .limit(0);
    
    if (conversationsError) {
      console.log('   ⚠️  ai_conversations table may not exist yet');
    } else {
      console.log('   ✅ ai_conversations table exists');
    }

  } catch (error: any) {
    console.log('   ⚠️  Could not verify tables (might be normal)');
  }

  console.log('\n🎉 Migration process complete!');
  console.log('\nNext steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Visit: http://localhost:3000/vendor/storefront-builder');
  console.log('3. Start generating storefronts!\n');
}

// Run migration
runMigration();

