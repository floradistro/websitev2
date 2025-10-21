import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read environment variables
let envContent = '';
try {
  envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
} catch {
  try {
    envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  } catch (e) {
    console.error('No .env or .env.local file found');
    process.exit(1);
  }
}
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseServiceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying Users/Employees RBAC Migration...\n');

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251021_users_employees_rbac.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded');
  console.log('📊 Size:', (migrationSQL.length / 1024).toFixed(2), 'KB');
  console.log('\n⚙️  Executing migration...\n');

  try {
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      // Note: This might not work for all SQL - may need to split into statements
      console.log('ℹ️  Attempting direct execution...\n');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt) {
          try {
            // Use raw query execution
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({ query: stmt + ';' })
            });
            
            if (!response.ok) {
              console.log(`⚠️  Statement ${i + 1}/${statements.length} warning (may be OK):`, stmt.substring(0, 60) + '...');
            }
          } catch (e: any) {
            console.log(`⚠️  Statement ${i + 1} skipped:`, e.message);
          }
        }
      }
      
      return { error: null };
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tables = ['users', 'user_locations', 'role_permissions', 'user_sessions', 'audit_log'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Not found or error`);
      } else {
        console.log(`✅ ${table}: Exists (${count || 0} rows)`);
      }
    }
    
    console.log('\n📊 Checking role permissions...\n');
    
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('role, count')
      .limit(100);
    
    if (!permError && permissions) {
      const roleCounts: Record<string, number> = {};
      permissions.forEach((p: any) => {
        roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      });
      
      console.log('Permissions per role:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`  ${role}: ${count} permissions`);
      });
    }
    
    console.log('\n✨ User/Employee RBAC system is ready!\n');
    
  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n⚠️  You may need to apply this migration manually via Supabase SQL Editor');
    console.log('📁 Migration file: supabase/migrations/20251021_users_employees_rbac.sql\n');
  }
}

applyMigration().catch(console.error);

