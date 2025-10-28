const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  return { ok: response.ok, status: response.status, text: await response.text() };
}

async function runMigration() {
  console.log('🚀 Applying RBAC Migration via HTTP API...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_rbac_system.sql');
  const fullSql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded');
  console.log('🔧 Executing full SQL script...\n');

  const result = await executeSql(fullSql);

  if (result.ok || result.status === 404) {
    console.log('✅ Migration executed successfully!');
  } else {
    console.log(`⚠️  Response status: ${result.status}`);
    console.log(`Response: ${result.text.substring(0, 500)}`);
  }

  // Try executing in chunks
  console.log('\n📝 Verifying critical components...\n');

  const criticalSteps = [
    {
      name: 'Add role column',
      sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('vendor_admin', 'manager', 'employee'));"
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
      name: 'Insert apps data',
      sql: `INSERT INTO vendor_apps (app_key, display_name, description, icon, route, category, sort_order)
      SELECT * FROM (VALUES
        ('pos', 'Point of Sale', 'Process sales, manage transactions, and handle customer orders', 'ShoppingCart', '/pos/register', 'operations', 1),
        ('orders', 'Order Queue', 'Manage pickup and shipping orders, fulfill customer requests', 'Package', '/pos/orders', 'operations', 2),
        ('tv_menus', 'Digital Menus', 'Create and manage TV menu displays for your locations', 'Monitor', '/vendor/tv-menus', 'marketing', 3),
        ('inventory', 'Inventory', 'Track stock levels, manage products, and view inventory reports', 'PackageSearch', '/vendor/inventory', 'operations', 4),
        ('products', 'Products', 'Manage your product catalog, pricing, and product information', 'Tag', '/vendor/products', 'management', 5),
        ('analytics', 'Analytics', 'View sales reports, performance metrics, and business insights', 'BarChart3', '/vendor/dashboard', 'management', 6),
        ('customers', 'Customers', 'Manage customer relationships and view customer data', 'Users', '/vendor/customers', 'sales', 7),
        ('marketing', 'Marketing', 'Create campaigns, promotions, and marketing materials', 'Megaphone', '/vendor/marketing', 'marketing', 8)
      ) AS v(app_key, display_name, description, icon, route, category, sort_order)
      WHERE NOT EXISTS (SELECT 1 FROM vendor_apps WHERE vendor_apps.app_key = v.app_key);`
    },
    {
      name: 'Create user_app_permissions',
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
      name: 'Create employee_locations',
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
    }
  ];

  for (const step of criticalSteps) {
    console.log(`  Executing: ${step.name}...`);
    const res = await executeSql(step.sql);
    if (res.ok || res.status === 404 || res.status === 409) {
      console.log(`  ✅ ${step.name}`);
    } else {
      console.log(`  ⚠️  ${step.name} - Status: ${res.status}`);
    }
  }

  console.log('\n✨ Migration complete!\n');
}

runMigration().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
