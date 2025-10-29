-- Custom KPI Widgets System
-- Allows vendors to create and save custom AI-generated KPI widgets

-- Create custom_kpi_widgets table
CREATE TABLE IF NOT EXISTS custom_kpi_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- KPI Configuration
  title VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  subtitle TEXT,
  change DECIMAL(5,2), -- percentage change
  change_label VARCHAR(50),

  -- Visualization
  visualization VARCHAR(20) NOT NULL DEFAULT 'number' CHECK (visualization IN ('number', 'chart', 'progress', 'list')),
  data JSONB, -- for storing visualization data (lists, progress bars, etc.)

  -- AI Generation Context
  original_prompt TEXT NOT NULL, -- user's original prompt
  query TEXT, -- SQL query or data fetching logic

  -- Display Order
  position INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_refreshed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX idx_custom_kpi_widgets_vendor_id ON custom_kpi_widgets(vendor_id);
CREATE INDEX idx_custom_kpi_widgets_position ON custom_kpi_widgets(vendor_id, position) WHERE is_visible = true;

-- Enable RLS
ALTER TABLE custom_kpi_widgets ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER custom_kpi_widgets_updated_at
  BEFORE UPDATE ON custom_kpi_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_kpi_widgets_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_kpi_widgets TO authenticated;
