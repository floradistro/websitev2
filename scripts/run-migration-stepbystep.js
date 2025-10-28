const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

async function runMigration() {
  console.log('🚀 Running RBAC Migration Step by Step...\n');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const steps = [
    {
      name: 'Add role column to users',
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('vendor_admin', 'manager', 'employee'));`
    },
    {
      name: 'Add role indexes',
      sql: `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role); CREATE INDEX IF NOT EXISTS idx_users_vendor_role ON users(vendor_id, role);`
    },
    {
      name: 'Add user fields',
      sql: `ALTER TABLE users
        ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE,
        ADD COLUMN IF NOT EXISTS hire_date DATE,
        ADD COLUMN IF NOT EXISTS department VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS pin_code VARCHAR(6);`
    },
    {
      name: 'Create vendor_apps table',
      sql: `CREATE TABLE IF NOT EXISTS vendor_apps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_key VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        route VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`
    },
    {
      name: 'Insert default apps',
      sql: `INSERT INTO vendor_apps (app_key, display_name, description, icon, route, category, sort_order) VALUES
        ('pos', 'Point of Sale', 'Process sales, manage transactions, and handle customer orders', 'ShoppingCart', '/pos/register', 'operations', 1),
        ('orders', 'Order Queue', 'Manage pickup and shipping orders, fulfill customer requests', 'Package', '/pos/orders', 'operations', 2),
        ('tv_menus', 'Digital Menus', 'Create and manage TV menu displays for your locations', 'Monitor', '/vendor/tv-menus', 'marketing', 3),
        ('inventory', 'Inventory', 'Track stock levels, manage products, and view inventory reports', 'PackageSearch', '/vendor/inventory', 'operations', 4),
        ('products', 'Products', 'Manage your product catalog, pricing, and product information', 'Tag', '/vendor/products', 'management', 5),
        ('analytics', 'Analytics', 'View sales reports, performance metrics, and business insights', 'BarChart3', '/vendor/dashboard', 'management', 6),
        ('customers', 'Customers', 'Manage customer relationships and view customer data', 'Users', '/vendor/customers', 'sales', 7),
        ('marketing', 'Marketing', 'Create campaigns, promotions, and marketing materials', 'Megaphone', '/vendor/marketing', 'marketing', 8)
      ON CONFLICT (app_key) DO NOTHING;`
    },
    {
      name: 'Create user_app_permissions table',
      sql: `CREATE TABLE IF NOT EXISTS user_app_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        app_key VARCHAR(50) NOT NULL REFERENCES vendor_apps(app_key) ON DELETE CASCADE,
        can_access BOOLEAN DEFAULT true,
        granted_by UUID REFERENCES users(id),
        granted_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, app_key)
      );`
    },
    {
      name: 'Create employee_locations table',
      sql: `CREATE TABLE IF NOT EXISTS employee_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        can_access BOOLEAN DEFAULT true,
        assigned_by UUID REFERENCES users(id),
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, location_id)
      );`
    },
    {
      name: 'Create user_activity_log table',
      sql: `CREATE TABLE IF NOT EXISTS user_activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        app_key VARCHAR(50) REFERENCES vendor_apps(app_key),
        location_id UUID REFERENCES locations(id),
        metadata JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`
    }
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n[${i + 1}/${steps.length}] ${step.name}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: step.sql });

      if (error) {
        console.log('  ⚠️  Error:', error.message);
        console.log('  ℹ️  Attempting direct query...');

        // Try via FROM clause (workaround)
        const { error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0);

        console.log('  ⚠️  May need manual execution for this step');
      } else {
        console.log('  ✅ Success');
      }
    } catch (err) {
      console.log('  ⚠️  Exception:', err.message);
    }
  }

  console.log('\n\n✨ Migration steps completed!');
  console.log('\n💡 If any steps failed, run the full migration manually:');
  console.log('   https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql');
  console.log('\n📋 File: supabase/migrations/20251027_rbac_system.sql\n');
}

runMigration();
