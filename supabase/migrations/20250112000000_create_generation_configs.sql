-- Create generation_configs table for saving AI generation session configurations
CREATE TABLE IF NOT EXISTS generation_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Original settings
  template_id UUID,
  base_prompt TEXT,
  art_style TEXT,
  format TEXT,
  include_text TEXT,

  -- References (JSONB array)
  -- Structure: [{ mediaFileId, fileUrl, weight, thumbnailUrl }]
  reference_images JSONB DEFAULT '[]'::jsonb,

  -- Session learnings
  approved_style_description TEXT,
  rejected_style_description TEXT,
  final_prompt TEXT,

  -- Metadata
  iterations_count INT DEFAULT 1,
  success_rate FLOAT DEFAULT 0,
  total_generated INT DEFAULT 0,
  total_cost FLOAT DEFAULT 0,

  -- Organization
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Social
  is_public BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  times_used INT DEFAULT 0,

  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_configs_vendor ON generation_configs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_generation_configs_categories ON generation_configs USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_generation_configs_last_used ON generation_configs(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_generation_configs_name ON generation_configs(name);
CREATE INDEX IF NOT EXISTS idx_generation_configs_is_public ON generation_configs(is_public) WHERE is_public = true;

-- RLS Policies
ALTER TABLE generation_configs ENABLE ROW LEVEL SECURITY;

-- Vendors can only access their own configs (or public ones)
CREATE POLICY "Vendors can view own and public configs" ON generation_configs
  FOR SELECT
  USING (
    vendor_id = auth.uid()::uuid
    OR is_public = true
  );

-- Vendors can create their own configs
CREATE POLICY "Vendors can create own configs" ON generation_configs
  FOR INSERT
  WITH CHECK (vendor_id = auth.uid()::uuid);

-- Vendors can update their own configs
CREATE POLICY "Vendors can update own configs" ON generation_configs
  FOR UPDATE
  USING (vendor_id = auth.uid()::uuid);

-- Vendors can delete their own configs
CREATE POLICY "Vendors can delete own configs" ON generation_configs
  FOR DELETE
  USING (vendor_id = auth.uid()::uuid);
