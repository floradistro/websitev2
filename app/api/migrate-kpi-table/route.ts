import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST() {
  try {
    // Create the table
    const { error: tableError } = await supabase.rpc("exec_sql", {
      query: `
        -- Create custom_kpi_widgets table
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

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Vendors can view their own KPI widgets" ON custom_kpi_widgets;
        DROP POLICY IF EXISTS "Vendors can insert their own KPI widgets" ON custom_kpi_widgets;
        DROP POLICY IF EXISTS "Vendors can update their own KPI widgets" ON custom_kpi_widgets;
        DROP POLICY IF EXISTS "Vendors can delete their own KPI widgets" ON custom_kpi_widgets;

        -- RLS Policies
        CREATE POLICY "Vendors can view their own KPI widgets"
          ON custom_kpi_widgets
          FOR SELECT
          USING (
            vendor_id IN (
              SELECT vendor_id
              FROM vendor_users
              WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Vendors can insert their own KPI widgets"
          ON custom_kpi_widgets
          FOR INSERT
          WITH CHECK (
            vendor_id IN (
              SELECT vendor_id
              FROM vendor_users
              WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Vendors can update their own KPI widgets"
          ON custom_kpi_widgets
          FOR UPDATE
          USING (
            vendor_id IN (
              SELECT vendor_id
              FROM vendor_users
              WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Vendors can delete their own KPI widgets"
          ON custom_kpi_widgets
          FOR DELETE
          USING (
            vendor_id IN (
              SELECT vendor_id
              FROM vendor_users
              WHERE user_id = auth.uid()
            )
          );

        -- Updated at trigger
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

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON custom_kpi_widgets TO authenticated;
      `,
    });

    if (tableError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Migration error:", tableError);
      }
      return NextResponse.json(
        { success: false, error: tableError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Migration error:", error);
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
