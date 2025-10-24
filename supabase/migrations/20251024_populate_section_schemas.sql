-- ============================================================================
-- POPULATE SECTION SCHEMAS - Define all section types
-- ============================================================================

-- Hero Section Schema
INSERT INTO public.section_schemas (section_key, name, description, category, fields, variants, preview_image, icon, sort_order)
VALUES (
  'hero',
  'Hero Section',
  'Large banner section with headline, subheadline, and call-to-action buttons',
  'hero',
  '[
    {"id": "headline", "type": "text", "label": "Headline", "placeholder": "Welcome to Your Store", "required": true, "max_length": 100},
    {"id": "subheadline", "type": "text", "label": "Subheadline", "placeholder": "Your tagline goes here", "max_length": 200},
    {"id": "background_type", "type": "select", "label": "Background Type", "options": ["solid", "gradient", "image", "video", "animation"], "default": "solid"},
    {"id": "background_color", "type": "color", "label": "Background Color", "default": "#000000"},
    {"id": "text_color", "type": "color", "label": "Text Color", "default": "#FFFFFF"},
    {"id": "image_url", "type": "image", "label": "Background Image", "depends_on": {"background_type": "image"}},
    {"id": "video_url", "type": "url", "label": "Background Video", "depends_on": {"background_type": "video"}},
    {"id": "cta_buttons", "type": "array", "label": "Call-to-Action Buttons", "max_items": 3, "item_schema": {
      "text": {"type": "text", "label": "Button Text"},
      "link": {"type": "url", "label": "Button Link"},
      "style": {"type": "select", "options": ["primary", "secondary", "ghost"], "default": "primary"}
    }},
    {"id": "height", "type": "select", "label": "Section Height", "options": ["short", "medium", "tall", "full"], "default": "tall"},
    {"id": "text_alignment", "type": "select", "label": "Text Alignment", "options": ["left", "center", "right"], "default": "center"}
  ]'::jsonb,
  '[
    {"id": "minimal", "name": "Minimal", "description": "Clean and simple"},
    {"id": "bold", "name": "Bold & Dramatic", "description": "Large text, high impact"},
    {"id": "split", "name": "Split Layout", "description": "Text on one side, image on other"},
    {"id": "overlay", "name": "Image Overlay", "description": "Text over background image"},
    {"id": "animated", "name": "Animated", "description": "Subtle motion background"}
  ]'::jsonb,
  '/previews/hero.jpg',
  'sparkles',
  1
) ON CONFLICT (section_key) DO UPDATE SET
  fields = EXCLUDED.fields,
  variants = EXCLUDED.variants;

-- Process/Steps Section Schema
INSERT INTO public.section_schemas (section_key, name, description, category, fields, variants, icon, sort_order)
VALUES (
  'process',
  'Process Steps',
  'Show your workflow or process in numbered steps',
  'content',
  '[
    {"id": "headline", "type": "text", "label": "Headline", "default": "How It Works"},
    {"id": "subheadline", "type": "text", "label": "Subheadline"},
    {"id": "steps", "type": "array", "label": "Steps", "min_items": 2, "max_items": 6, "item_schema": {
      "icon": {"type": "icon_picker", "label": "Icon"},
      "title": {"type": "text", "label": "Step Title", "required": true},
      "description": {"type": "textarea", "label": "Step Description"}
    }},
    {"id": "layout", "type": "select", "label": "Layout", "options": ["horizontal", "vertical", "grid"], "default": "horizontal"},
    {"id": "show_numbers", "type": "boolean", "label": "Show Step Numbers", "default": true},
    {"id": "show_connectors", "type": "boolean", "label": "Show Connecting Lines", "default": true}
  ]'::jsonb,
  '[
    {"id": "timeline", "name": "Timeline"},
    {"id": "cards", "name": "Cards"},
    {"id": "circular", "name": "Circular Flow"}
  ]'::jsonb,
  'list',
  2
) ON CONFLICT (section_key) DO UPDATE SET fields = EXCLUDED.fields, variants = EXCLUDED.variants;

-- Featured Products Section Schema
INSERT INTO public.section_schemas (section_key, name, description, category, fields, variants, icon, sort_order)
VALUES (
  'featured_products',
  'Featured Products',
  'Showcase selected products from your catalog',
  'conversion',
  '[
    {"id": "headline", "type": "text", "label": "Headline", "default": "Featured Products"},
    {"id": "products_count", "type": "number", "label": "Number of Products", "min": 1, "max": 24, "default": 12},
    {"id": "product_selection", "type": "select", "label": "Selection Method", "options": ["automatic", "manual", "category"], "default": "automatic"},
    {"id": "selected_products", "type": "product_picker", "label": "Select Products", "depends_on": {"product_selection": "manual"}},
    {"id": "category_filter", "type": "category_picker", "label": "Category", "depends_on": {"product_selection": "category"}},
    {"id": "layout", "type": "select", "label": "Layout", "options": ["grid", "carousel", "masonry", "list"], "default": "grid"},
    {"id": "columns", "type": "number", "label": "Columns", "min": 2, "max": 6, "default": 4, "depends_on": {"layout": "grid"}},
    {"id": "show_filters", "type": "boolean", "label": "Show Filters", "default": false},
    {"id": "show_sort", "type": "boolean", "label": "Show Sort Options", "default": false}
  ]'::jsonb,
  '[
    {"id": "grid", "name": "Grid"},
    {"id": "carousel", "name": "Scrolling Carousel"},
    {"id": "featured_large", "name": "Featured + Grid (first item large)"}
  ]'::jsonb,
  'shopping-bag',
  3
) ON CONFLICT (section_key) DO UPDATE SET fields = EXCLUDED.fields, variants = EXCLUDED.variants;

-- Reviews/Testimonials Section Schema  
INSERT INTO public.section_schemas (section_key, name, description, category, fields, variants, icon, sort_order)
VALUES (
  'reviews',
  'Customer Reviews',
  'Display customer testimonials and reviews',
  'social-proof',
  '[
    {"id": "headline", "type": "text", "label": "Headline", "default": "What Our Customers Say"},
    {"id": "source", "type": "select", "label": "Review Source", "options": ["database", "manual"], "default": "database"},
    {"id": "manual_reviews", "type": "array", "label": "Manual Reviews", "depends_on": {"source": "manual"}, "item_schema": {
      "name": {"type": "text", "label": "Customer Name"},
      "rating": {"type": "number", "label": "Rating", "min": 1, "max": 5},
      "quote": {"type": "textarea", "label": "Review Text"},
      "image": {"type": "image", "label": "Customer Photo (optional)"}
    }},
    {"id": "max_display", "type": "number", "label": "Number to Show", "min": 3, "max": 12, "default": 6},
    {"id": "layout", "type": "select", "label": "Layout", "options": ["grid", "carousel", "masonry"], "default": "grid"},
    {"id": "show_rating_stars", "type": "boolean", "label": "Show Star Ratings", "default": true},
    {"id": "show_verified_badge", "type": "boolean", "label": "Show Verified Purchase Badge", "default": true},
    {"id": "show_customer_photos", "type": "boolean", "label": "Show Customer Photos", "default": false}
  ]'::jsonb,
  '[
    {"id": "cards", "name": "Cards"},
    {"id": "quotes", "name": "Large Quotes"},
    {"id": "compact", "name": "Compact List"}
  ]'::jsonb,
  'star',
  4
) ON CONFLICT (section_key) DO UPDATE SET fields = EXCLUDED.fields, variants = EXCLUDED.variants;

-- Locations Section Schema
INSERT INTO public.section_schemas (section_key, name, description, category, fields, variants, icon, sort_order)
VALUES (
  'locations',
  'Locations',
  'Display your physical store locations',
  'content',
  '[
    {"id": "headline", "type": "text", "label": "Headline", "default": "Our Locations"},
    {"id": "subheadline", "type": "text", "label": "Subheadline"},
    {"id": "show_from_database", "type": "boolean", "label": "Pull from Database", "default": true},
    {"id": "manual_locations", "type": "array", "label": "Manual Locations", "depends_on": {"show_from_database": false}, "item_schema": {
      "name": {"type": "text", "label": "Location Name"},
      "address": {"type": "textarea", "label": "Address"},
      "phone": {"type": "tel", "label": "Phone"},
      "hours": {"type": "textarea", "label": "Business Hours"}
    }},
    {"id": "layout", "type": "select", "label": "Layout", "options": ["grid", "list", "map"], "default": "grid"},
    {"id": "show_map", "type": "boolean", "label": "Show Map", "default": false},
    {"id": "show_directions_button", "type": "boolean", "label": "Show Directions Button", "default": true}
  ]'::jsonb,
  '[
    {"id": "cards", "name": "Cards with Logo"},
    {"id": "minimal", "name": "Minimal List"},
    {"id": "map_view", "name": "Interactive Map"}
  ]'::jsonb,
  'map-pin',
  5
) ON CONFLICT (section_key) DO UPDATE SET fields = EXCLUDED.fields, variants = EXCLUDED.variants;

-- Footer Section Schema
INSERT INTO public.section_schemas (section_key, name, description, category, fields, variants, icon, sort_order)
VALUES (
  'footer',
  'Footer',
  'Site footer with links and legal information',
  'global',
  '[
    {"id": "footer_links", "type": "array", "label": "Footer Links", "max_items": 20, "item_schema": {
      "title": {"type": "text", "label": "Link Text"},
      "url": {"type": "url", "label": "URL"},
      "group": {"type": "text", "label": "Group (optional)"}
    }},
    {"id": "show_social", "type": "boolean", "label": "Show Social Links", "default": true},
    {"id": "show_newsletter", "type": "boolean", "label": "Show Newsletter Signup", "default": false},
    {"id": "custom_footer_text", "type": "textarea", "label": "Custom Text"},
    {"id": "compliance_text", "type": "textarea", "label": "Compliance/Legal Text"},
    {"id": "show_powered_by", "type": "boolean", "label": "Show Powered By", "default": false},
    {"id": "columns", "type": "number", "label": "Number of Columns", "min": 1, "max": 6, "default": 4}
  ]'::jsonb,
  '[
    {"id": "minimal", "name": "Minimal"},
    {"id": "full", "name": "Full Width"},
    {"id": "centered", "name": "Centered"}
  ]'::jsonb,
  'layout',
  99
) ON CONFLICT (section_key) DO UPDATE SET fields = EXCLUDED.fields, variants = EXCLUDED.variants;

-- Add more schemas for other sections...
INSERT INTO public.section_schemas (section_key, name, description, category, fields, variants, icon, sort_order)
VALUES 
  (
    'stats',
    'Statistics',
    'Display key numbers and metrics',
    'social-proof',
    '[
      {"id": "headline", "type": "text", "label": "Headline (optional)"},
      {"id": "stats", "type": "array", "label": "Stats", "min_items": 2, "max_items": 6, "item_schema": {
        "number": {"type": "text", "label": "Number", "placeholder": "1000+"},
        "label": {"type": "text", "label": "Label", "placeholder": "Customers"}
      }},
      {"id": "layout", "type": "select", "label": "Layout", "options": ["horizontal", "grid"], "default": "horizontal"}
    ]'::jsonb,
    '[{"id": "minimal", "name": "Minimal"}, {"id": "bold", "name": "Bold Numbers"}]'::jsonb,
    'bar-chart',
    6
  ),
  (
    'cta',
    'Call-to-Action',
    'Prominent call-to-action section',
    'conversion',
    '[
      {"id": "headline", "type": "text", "label": "Headline", "required": true},
      {"id": "description", "type": "textarea", "label": "Description"},
      {"id": "button_text", "type": "text", "label": "Button Text", "default": "Shop Now"},
      {"id": "button_link", "type": "url", "label": "Button Link", "default": "/shop"},
      {"id": "style", "type": "select", "label": "Style", "options": ["centered", "split", "full_width"], "default": "centered"}
    ]'::jsonb,
    '[{"id": "bold", "name": "Bold"}, {"id": "subtle", "name": "Subtle"}]'::jsonb,
    'zap',
    7
  )
ON CONFLICT (section_key) DO UPDATE SET 
  fields = EXCLUDED.fields,
  variants = EXCLUDED.variants;

