-- Register SmartShopControls component in database

INSERT INTO component_templates (
  component_key,
  name,
  description,
  category,
  sub_category,
  required_fields,
  optional_fields,
  field_schema,
  data_sources,
  fetches_real_data,
  variants,
  default_variant,
  props_schema,
  default_layout,
  responsive_breakpoints,
  child_components,
  slot_definitions,
  is_public,
  is_deprecated,
  version,
  tags
) VALUES (
  'smart_shop_controls',
  'Smart Shop Controls',
  'Category tabs, sort dropdown, and product count for shop pages. Based on Yacht Club marketplace design.',
  'smart',
  'ecommerce',
  '[]'::jsonb,
  '["productCount", "showSort", "showCategories"]'::jsonb,
  '{
    "productCount": {"type": "number", "description": "Total number of products"},
    "showSort": {"type": "boolean", "default": true, "description": "Show sort dropdown"},
    "showCategories": {"type": "boolean", "default": true, "description": "Show category tabs"}
  }'::jsonb,
  '["products", "categories"]'::jsonb,
  true,
  '["default"]'::jsonb,
  'default',
  '{
    "productCount": "number",
    "showSort": "boolean",
    "showCategories": "boolean",
    "onCategoryChange": "function",
    "onSortChange": "function"
  }'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  true,
  false,
  '1.0.0',
  '["shop", "ecommerce", "filters", "navigation"]'::jsonb
)
ON CONFLICT (component_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

SELECT 'SmartShopControls registered' as status;

