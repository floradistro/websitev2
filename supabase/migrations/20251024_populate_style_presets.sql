-- ============================================================================
-- POPULATE STYLE PRESETS - Pre-made design combinations
-- ============================================================================

-- Minimal Black & White
INSERT INTO public.style_presets (name, description, category, color_palette, typography, spacing_scale, border_radius, effects, applies_to)
VALUES (
  'Minimal Black & White',
  'Clean, modern design with pure black and white',
  'minimal',
  '{
    "primary": "#000000",
    "secondary": "#FFFFFF",
    "accent": "#666666",
    "background": "#000000",
    "text": "#FFFFFF",
    "text_secondary": "#999999"
  }'::jsonb,
  '{
    "font_family": "Inter, system-ui, sans-serif",
    "headline": {"size": 64, "weight": 700, "line_height": 1.1},
    "subheadline": {"size": 20, "weight": 400, "line_height": 1.5},
    "body": {"size": 16, "weight": 400, "line_height": 1.6},
    "button": {"size": 14, "weight": 600, "uppercase": true, "tracking": "0.1em"}
  }'::jsonb,
  '[4, 8, 16, 32, 64, 128]'::jsonb,
  '{"sm": "8px", "md": "16px", "lg": "32px", "full": "9999px"}'::jsonb,
  '{
    "shadows": ["none"],
    "animations": ["fade", "slide"],
    "transitions": "300ms ease",
    "hover_effects": ["opacity-80", "scale-105"]
  }'::jsonb,
  ARRAY['all']
) ON CONFLICT DO NOTHING;

-- Luxury Gold
INSERT INTO public.style_presets (name, description, category, color_palette, typography, spacing_scale, border_radius, effects, applies_to, is_premium)
VALUES (
  'Luxury Gold',
  'Premium feel with gold accents and serif fonts',
  'luxury',
  '{
    "primary": "#000000",
    "secondary": "#D4AF37",
    "accent": "#C9A961",
    "background": "#0A0A0A",
    "text": "#F5F5DC",
    "text_secondary": "#D4AF37"
  }'::jsonb,
  '{
    "font_family": "Playfair Display, Georgia, serif",
    "headline": {"size": 72, "weight": 400, "line_height": 1.0, "letter_spacing": "-0.02em"},
    "subheadline": {"size": 24, "weight": 300, "line_height": 1.4, "font_style": "italic"},
    "body": {"size": 18, "weight": 300, "line_height": 1.7},
    "button": {"size": 12, "weight": 600, "uppercase": true, "tracking": "0.2em"}
  }'::jsonb,
  '[8, 16, 32, 48, 96, 144]'::jsonb,
  '{"sm": "4px", "md": "8px", "lg": "16px", "full": "9999px"}'::jsonb,
  '{
    "shadows": ["glow-gold", "soft"],
    "gradients": ["gold-shimmer", "dark-fade"],
    "animations": ["elegant-fade", "subtle-scale"],
    "transitions": "600ms cubic-bezier(0.4, 0, 0.2, 1)"
  }'::jsonb,
  ARRAY['all'],
  true
) ON CONFLICT DO NOTHING;

-- Bold Neon
INSERT INTO public.style_presets (name, description, category, color_palette, typography, spacing_scale, border_radius, effects, applies_to)
VALUES (
  'Bold Neon',
  'High-energy design with vibrant colors',
  'bold',
  '{
    "primary": "#FF00FF",
    "secondary": "#00FFFF",
    "accent": "#FFFF00",
    "background": "#0A0014",
    "text": "#FFFFFF",
    "text_secondary": "#FF00FF"
  }'::jsonb,
  '{
    "font_family": "Montserrat, sans-serif",
    "headline": {"size": 96, "weight": 900, "line_height": 0.9, "letter_spacing": "-0.03em", "uppercase": true},
    "subheadline": {"size": 24, "weight": 700, "line_height": 1.2},
    "body": {"size": 16, "weight": 500, "line_height": 1.5},
    "button": {"size": 16, "weight": 900, "uppercase": true}
  }'::jsonb,
  '[8, 16, 32, 48, 64, 96]'::jsonb,
  '{"sm": "16px", "md": "24px", "lg": "32px", "full": "9999px"}'::jsonb,
  '{
    "shadows": ["neon-glow", "hard"],
    "gradients": ["rainbow", "cyberpunk"],
    "animations": ["pulse", "glitch", "float"],
    "transitions": "200ms ease-out",
    "filters": ["saturate-150"]
  }'::jsonb,
  ARRAY['all']
) ON CONFLICT DO NOTHING;

-- Organic Earth
INSERT INTO public.style_presets (name, description, category, color_palette, typography, spacing_scale, border_radius, effects, applies_to)
VALUES (
  'Organic Earth',
  'Natural, earthy tones with soft edges',
  'organic',
  '{
    "primary": "#2D5016",
    "secondary": "#8B7355",
    "accent": "#C19A6B",
    "background": "#F5F1E8",
    "text": "#2D2D2D",
    "text_secondary": "#5C5C5C"
  }'::jsonb,
  '{
    "font_family": "Lora, Georgia, serif",
    "headline": {"size": 56, "weight": 500, "line_height": 1.2},
    "subheadline": {"size": 20, "weight": 400, "line_height": 1.6},
    "body": {"size": 17, "weight": 400, "line_height": 1.8},
    "button": {"size": 15, "weight": 500, "letter_spacing": "0.05em"}
  }'::jsonb,
  '[12, 20, 32, 48, 72, 120]'::jsonb,
  '{"sm": "20px", "md": "32px", "lg": "48px", "full": "9999px"}'::jsonb,
  '{
    "shadows": ["soft", "organic"],
    "gradients": ["earth-tone", "sunset"],
    "animations": ["gentle-float", "fade"],
    "transitions": "400ms ease-in-out",
    "textures": ["paper", "fabric"]
  }'::jsonb,
  ARRAY['all']
) ON CONFLICT DO NOTHING;

-- Tech Blue
INSERT INTO public.style_presets (name, description, category, color_palette, typography, spacing_scale, border_radius, effects, applies_to)
VALUES (
  'Tech Blue',
  'Modern, technical aesthetic with blue accents',
  'tech',
  '{
    "primary": "#0066FF",
    "secondary": "#00CCFF",
    "accent": "#0099FF",
    "background": "#000814",
    "text": "#E5E5E5",
    "text_secondary": "#00CCFF"
  }'::jsonb,
  '{
    "font_family": "Inter, -apple-system, sans-serif",
    "headline": {"size": 64, "weight": 700, "line_height": 1.1, "letter_spacing": "-0.02em"},
    "subheadline": {"size": 18, "weight": 400, "line_height": 1.5},
    "body": {"size": 15, "weight": 400, "line_height": 1.6},
    "button": {"size": 14, "weight": 600, "tracking": "0.05em"}
  }'::jsonb,
  '[4, 8, 12, 24, 48, 96]'::jsonb,
  '{"sm": "4px", "md": "8px", "lg": "12px", "full": "9999px"}'::jsonb,
  '{
    "shadows": ["glow-blue", "sharp"],
    "gradients": ["tech-gradient", "holographic"],
    "animations": ["glide", "reveal"],
    "transitions": "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    "effects": ["glassmorphism", "grid-background"]
  }'::jsonb,
  ARRAY['all']
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.style_presets IS 'Now contains 5 starter presets: Minimal, Luxury, Bold, Organic, Tech';

