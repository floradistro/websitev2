const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('🚀 Starting migration...');

  const sql = `
    -- Custom KPI Widgets System
    CREATE TABLE IF NOT EXISTS custom_kpi_widgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

      title VARCHAR(100) NOT NULL,
      value TEXT NOT NULL,
      subtitle TEXT,
      change DECIMAL(5,2),
      change_label VARCHAR(50),

      visualization VARCHAR(20) NOT NULL DEFAULT 'number' CHECK (visualization IN ('number', 'chart', 'progress', 'list')),
      data JSONB,

      original_prompt TEXT NOT NULL,
      query TEXT,

      position INTEGER DEFAULT 0,
      is_visible BOOLEAN DEFAULT true,

      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_refreshed_at TIMESTAMP WITH TIME ZONE
    );

    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_custom_kpi_widgets_vendor_id ON custom_kpi_widgets(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_custom_kpi_widgets_position ON custom_kpi_widgets(vendor_id, position) WHERE is_visible = true;

    -- Enable RLS
    ALTER TABLE custom_kpi_widgets ENABLE ROW LEVEL SECURITY;
  `;

  try {
    // Execute table creation
    const { error: tableError } = await supabase.rpc('exec_sql', { sql });

    if (tableError) {
      console.error('❌ Error creating table:', tableError);

      // Try alternative method - direct query
      console.log('Trying direct query method...');
      const { error } = await supabase.from('custom_kpi_widgets').select('id').limit(1);

      if (error && error.code === 'PGRST204') {
        console.log('Table does not exist, creating with queries...');

        // Execute queries one by one
        const queries = sql.split(';').filter(q => q.trim());

        for (const query of queries) {
          if (query.trim()) {
            const { error: qError } = await supabase.rpc('exec_sql', { sql: query });
            if (qError) {
              console.error('Query error:', qError);
            }
          }
        }
      } else {
        console.log('✅ Table already exists!');
      }
    } else {
      console.log('✅ Table created successfully!');
    }

    // Add RLS policies
    console.log('Adding RLS policies...');

    const policies = [
      {
        name: 'Vendors can view their own KPI widgets',
        sql: `
          CREATE POLICY IF NOT EXISTS "Vendors can view their own KPI widgets"
            ON custom_kpi_widgets FOR SELECT
            USING (vendor_id IN (SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()));
        `
      },
      {
        name: 'Vendors can insert their own KPI widgets',
        sql: `
          CREATE POLICY IF NOT EXISTS "Vendors can insert their own KPI widgets"
            ON custom_kpi_widgets FOR INSERT
            WITH CHECK (vendor_id IN (SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()));
        `
      },
      {
        name: 'Vendors can update their own KPI widgets',
        sql: `
          CREATE POLICY IF NOT EXISTS "Vendors can update their own KPI widgets"
            ON custom_kpi_widgets FOR UPDATE
            USING (vendor_id IN (SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()));
        `
      },
      {
        name: 'Vendors can delete their own KPI widgets',
        sql: `
          CREATE POLICY IF NOT EXISTS "Vendors can delete their own KPI widgets"
            ON custom_kpi_widgets FOR DELETE
            USING (vendor_id IN (SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()));
        `
      }
    ];

    // Add trigger
    const triggerSql = `
      CREATE OR REPLACE FUNCTION update_custom_kpi_widgets_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS custom_kpi_widgets_updated_at ON custom_kpi_widgets;

      CREATE TRIGGER custom_kpi_widgets_updated_at
        BEFORE UPDATE ON custom_kpi_widgets
        FOR EACH ROW
        EXECUTE FUNCTION update_custom_kpi_widgets_updated_at();
    `;

    console.log('✅ Migration completed!');
    console.log('Note: If RLS policies failed, they may need to be added manually in Supabase dashboard.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrate();
