-- Update prompt templates to focus on street-style cartoon graphics
-- Inspired by Cookies & Jungle Boys aesthetic

-- Delete all existing public templates
DELETE FROM prompt_templates WHERE is_public = true;

-- Insert focused street-style cartoon template for cannabis products
INSERT INTO prompt_templates (vendor_id, name, description, prompt_text, category, style, is_public, parameters) VALUES
(
  NULL, -- Public template
  'Street Cartoon Icon - Cookies Style',
  'Bold street-style cartoon graphics inspired by Cookies and Jungle Boys - perfect for cannabis strain icons',
  'Silly illustration of {product_name}. Literal product interpretation with clean centered composition. Pure white background.',
  'product',
  'cartoon',
  true,
  '{"size": "1024x1024", "quality": "hd", "style": "natural"}'::jsonb
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated prompt templates - replaced with street-style cartoon template';
END $$;
