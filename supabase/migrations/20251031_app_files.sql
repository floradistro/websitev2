-- App Files Table - Store code files for instant preview
CREATE TABLE IF NOT EXISTS app_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES vendor_apps(id) ON DELETE CASCADE,
  filepath TEXT NOT NULL, -- e.g., "app/page.tsx", "components/Header.tsx"
  content TEXT NOT NULL,
  content_hash TEXT, -- SHA256 hash to detect changes
  file_type TEXT, -- tsx, ts, css, json, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(app_id, filepath)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_app_files_app_id ON app_files(app_id);
CREATE INDEX IF NOT EXISTS idx_app_files_updated ON app_files(updated_at DESC);

-- RLS Policies
ALTER TABLE app_files ENABLE ROW LEVEL SECURITY;

-- Vendors can read their own app files
CREATE POLICY "Vendors can read own app files"
  ON app_files FOR SELECT
  TO authenticated
  USING (
    app_id IN (
      SELECT id FROM vendor_apps WHERE vendor_id = auth.uid()
    )
  );

-- System can insert/update (we'll use service role for AI agent)
CREATE POLICY "Service role can manage app files"
  ON app_files FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_files_updated_at
  BEFORE UPDATE ON app_files
  FOR EACH ROW
  EXECUTE FUNCTION update_app_files_updated_at();

COMMENT ON TABLE app_files IS 'Stores code files for instant preview. Synced to GitHub in background.';
