-- AI Generation Studio: Prompt Templates
-- Migration: 20251110_prompt_templates.sql

-- Create prompt_templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('product', 'marketing', 'social', 'brand', 'menu')),
  style VARCHAR(50) CHECK (style IN ('cartoon', 'realistic', 'minimalist', 'luxury', 'retro', 'neon', 'hand_drawn', '3d_render', 'photographic')),
  parameters JSONB DEFAULT '{"size": "1024x1024", "quality": "standard"}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prompt_templates_vendor ON prompt_templates(vendor_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_style ON prompt_templates(style);
CREATE INDEX idx_prompt_templates_public ON prompt_templates(is_public) WHERE is_public = true;

-- RLS Policies
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Vendors can see their own templates + public templates
CREATE POLICY "Vendors can view own and public templates"
  ON prompt_templates FOR SELECT
  USING (
    vendor_id = auth.uid() OR
    is_public = true OR
    vendor_id IN (
      SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
    )
  );

-- Vendors can create their own templates
CREATE POLICY "Vendors can create templates"
  ON prompt_templates FOR INSERT
  WITH CHECK (
    vendor_id = auth.uid() OR
    vendor_id IN (
      SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
    )
  );

-- Vendors can update their own templates
CREATE POLICY "Vendors can update own templates"
  ON prompt_templates FOR UPDATE
  USING (
    vendor_id = auth.uid() OR
    vendor_id IN (
      SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
    )
  );

-- Vendors can delete their own templates
CREATE POLICY "Vendors can delete own templates"
  ON prompt_templates FOR DELETE
  USING (
    vendor_id = auth.uid() OR
    vendor_id IN (
      SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompt_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER prompt_template_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_template_updated_at();

-- Insert public templates (WhaleTools curated)
INSERT INTO prompt_templates (vendor_id, name, description, prompt_text, category, style, is_public, parameters) VALUES
(
  NULL, -- Public template (no vendor)
  'Product Photo - Cannabis Flower',
  'Professional studio product photography for cannabis flower',
  '{product_name} cannabis flower, professional studio photography, white background, macro detail showing trichomes, vibrant colors, 8K resolution, product photography lighting',
  'product',
  'photographic',
  true,
  '{"size": "1024x1024", "quality": "hd", "style": "natural"}'::jsonb
),
(
  NULL,
  'Cartoon Style - Fun & Playful',
  'Vibrant cartoon style perfect for vape products and edibles',
  '{product_name}, vibrant cartoon style, bold outlines, playful colors, fun aesthetic, Pixar-style 3D rendering, colorful background',
  'product',
  'cartoon',
  true,
  '{"size": "1024x1024", "quality": "standard", "style": "vivid"}'::jsonb
),
(
  NULL,
  'Minimalist Clean Design',
  'Clean, modern minimalist product shots',
  '{product_name}, clean minimalist design, simple shapes, white background, soft shadows, modern aesthetic, professional product photography',
  'product',
  'minimalist',
  true,
  '{"size": "1024x1024", "quality": "hd", "style": "natural"}'::jsonb
),
(
  NULL,
  'Luxury Premium Style',
  'High-end luxury aesthetic for premium products',
  '{product_name}, premium luxury aesthetic, gold accents, elegant composition, sophisticated lighting, high-end product photography, magazine quality',
  'product',
  'luxury',
  true,
  '{"size": "1024x1024", "quality": "hd", "style": "natural"}'::jsonb
),
(
  NULL,
  'Retro 80s Vibe',
  'Nostalgic 80s aesthetic with neon colors',
  '{product_name}, vintage 80s style, neon colors, retro aesthetic, synthwave vibes, gradient background, nostalgic feel',
  'product',
  'retro',
  true,
  '{"size": "1024x1024", "quality": "standard", "style": "vivid"}'::jsonb
),
(
  NULL,
  'Neon Cyberpunk',
  'Futuristic cyberpunk style with neon lights',
  '{product_name}, neon lights, cyberpunk aesthetic, futuristic, purple and blue neon glow, dark background, sci-fi vibe',
  'product',
  'neon',
  true,
  '{"size": "1024x1024", "quality": "standard", "style": "vivid"}'::jsonb
),
(
  NULL,
  'Hand-Drawn Illustration',
  'Artistic hand-drawn watercolor style',
  '{product_name}, hand-drawn illustration, watercolor style, artistic, soft colors, organic feel, painted aesthetic',
  'product',
  'hand_drawn',
  true,
  '{"size": "1024x1024", "quality": "standard", "style": "vivid"}'::jsonb
),
(
  NULL,
  '3D Rendered Product',
  'High-quality 3D render with realistic materials',
  '{product_name}, 3D rendered, octane render, photorealistic materials, perfect lighting, detailed textures, CGI product visualization',
  'product',
  '3d_render',
  true,
  '{"size": "1024x1024", "quality": "hd", "style": "natural"}'::jsonb
),
(
  NULL,
  'Social Media Post',
  'Eye-catching social media graphics',
  '{product_name}, Instagram-style post, vibrant colors, trendy aesthetic, social media ready, eye-catching composition, modern design',
  'social',
  'realistic',
  true,
  '{"size": "1024x1024", "quality": "standard", "style": "vivid"}'::jsonb
),
(
  NULL,
  'Brand Logo/Icon',
  'Clean brand identity elements',
  '{product_name} logo, modern brand identity, clean design, professional, versatile, scalable, iconic symbol',
  'brand',
  'minimalist',
  true,
  '{"size": "1024x1024", "quality": "hd", "style": "natural"}'::jsonb
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Prompt templates table created successfully with 10 public templates';
END $$;
