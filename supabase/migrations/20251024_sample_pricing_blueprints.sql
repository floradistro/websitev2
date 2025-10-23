-- ============================================================================
-- SAMPLE PRICING BLUEPRINTS - Retail (Grams) vs Wholesale (Pounds)
-- Date: 2025-01-24
-- ============================================================================

-- ============================================================================
-- RETAIL BLUEPRINTS (Gram-based)
-- ============================================================================

-- RETAIL FLOWER (Gram-based)
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type, 
  display_unit,
  context,
  conversion_factor,
  price_breaks,
  is_active,
  is_default
) VALUES (
  'Retail Cannabis Flower (Grams)',
  'retail-flower-grams',
  'Standard gram-based pricing for retail customers',
  'weight',
  'gram',
  'retail',
  1.0,
  '[
    {
      "break_id": "1g",
      "label": "1 gram",
      "qty": 1,
      "unit": "g",
      "display": "1g",
      "display_qty": 1,
      "display_unit": "g",
      "sort_order": 1
    },
    {
      "break_id": "3_5g",
      "label": "Eighth",
      "qty": 3.5,
      "unit": "g",
      "display": "3.5g (⅛ oz)",
      "display_qty": 3.5,
      "display_unit": "g",
      "sort_order": 2
    },
    {
      "break_id": "7g",
      "label": "Quarter",
      "qty": 7,
      "unit": "g",
      "display": "7g (¼ oz)",
      "display_qty": 7,
      "display_unit": "g",
      "sort_order": 3
    },
    {
      "break_id": "14g",
      "label": "Half Ounce",
      "qty": 14,
      "unit": "g",
      "display": "14g (½ oz)",
      "display_qty": 14,
      "display_unit": "g",
      "sort_order": 4
    },
    {
      "break_id": "28g",
      "label": "Ounce",
      "qty": 28,
      "unit": "g",
      "display": "28g (1 oz)",
      "display_qty": 28,
      "display_unit": "g",
      "sort_order": 5
    }
  ]'::jsonb,
  true,
  true
) ON CONFLICT (slug) DO UPDATE SET
  display_unit = EXCLUDED.display_unit,
  context = EXCLUDED.context,
  conversion_factor = EXCLUDED.conversion_factor,
  price_breaks = EXCLUDED.price_breaks;


-- RETAIL CONCENTRATES (Gram-based, smaller quantities)
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type, 
  display_unit,
  context,
  price_breaks,
  is_active
) VALUES (
  'Retail Cannabis Concentrates (Grams)',
  'retail-concentrates-grams',
  'Gram-based pricing for concentrates (dabs, wax, shatter)',
  'weight',
  'gram',
  'retail',
  '[
    {
      "break_id": "0_5g",
      "label": "Half Gram",
      "qty": 0.5,
      "unit": "g",
      "display": "0.5g",
      "display_qty": 0.5,
      "display_unit": "g",
      "sort_order": 1
    },
    {
      "break_id": "1g",
      "label": "1 Gram",
      "qty": 1,
      "unit": "g",
      "display": "1g",
      "display_qty": 1,
      "display_unit": "g",
      "sort_order": 2
    },
    {
      "break_id": "2g",
      "label": "2 Grams",
      "qty": 2,
      "unit": "g",
      "display": "2g",
      "display_qty": 2,
      "display_unit": "g",
      "sort_order": 3
    },
    {
      "break_id": "3_5g",
      "label": "Eighth (3.5g)",
      "qty": 3.5,
      "unit": "g",
      "display": "3.5g (⅛ oz)",
      "display_qty": 3.5,
      "display_unit": "g",
      "sort_order": 4
    },
    {
      "break_id": "7g",
      "label": "Quarter (7g)",
      "qty": 7,
      "unit": "g",
      "display": "7g (¼ oz)",
      "display_qty": 7,
      "display_unit": "g",
      "sort_order": 5
    }
  ]'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  display_unit = EXCLUDED.display_unit,
  context = EXCLUDED.context,
  price_breaks = EXCLUDED.price_breaks;


-- ============================================================================
-- WHOLESALE BLUEPRINTS (Pound-based)
-- Key: qty is ALWAYS in grams, but display shows pounds
-- ============================================================================

-- WHOLESALE FLOWER (Pound-based display, GRAM storage)
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type, 
  display_unit,
  context,
  conversion_factor,
  price_breaks,
  is_active
) VALUES (
  'Wholesale Cannabis Flower (Pounds)',
  'wholesale-flower-pounds',
  'Pound-based pricing for wholesale/distributor customers. Stored in grams, displayed as pounds.',
  'weight',
  'pound',
  'wholesale',
  453.592,
  '[
    {
      "break_id": "quarter_lb",
      "label": "Quarter Pound",
      "qty": 113.4,
      "unit": "g",
      "display": "¼ lb (113g)",
      "display_qty": 0.25,
      "display_unit": "lb",
      "sort_order": 1,
      "note": "Stored as 113.4g in database"
    },
    {
      "break_id": "half_lb",
      "label": "Half Pound",
      "qty": 226.8,
      "unit": "g",
      "display": "½ lb (227g)",
      "display_qty": 0.5,
      "display_unit": "lb",
      "sort_order": 2,
      "note": "Stored as 226.8g in database"
    },
    {
      "break_id": "1_lb",
      "label": "1 Pound",
      "qty": 453.6,
      "unit": "g",
      "display": "1 lb (454g)",
      "display_qty": 1,
      "display_unit": "lb",
      "sort_order": 3,
      "note": "Stored as 453.6g in database"
    },
    {
      "break_id": "5_lb",
      "label": "5 Pounds",
      "qty": 2268,
      "unit": "g",
      "display": "5 lbs",
      "display_qty": 5,
      "display_unit": "lb",
      "sort_order": 4,
      "note": "Stored as 2268g in database"
    },
    {
      "break_id": "10_lb",
      "label": "10 Pounds",
      "qty": 4536,
      "unit": "g",
      "display": "10 lbs",
      "display_qty": 10,
      "display_unit": "lb",
      "sort_order": 5,
      "note": "Stored as 4536g in database"
    }
  ]'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  display_unit = EXCLUDED.display_unit,
  context = EXCLUDED.context,
  conversion_factor = EXCLUDED.conversion_factor,
  price_breaks = EXCLUDED.price_breaks;


-- WHOLESALE CONCENTRATES (Gram-based but bulk quantities)
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type, 
  display_unit,
  context,
  price_breaks,
  is_active
) VALUES (
  'Wholesale Concentrates (Bulk Grams)',
  'wholesale-concentrates-bulk',
  'Bulk gram-based pricing for concentrates. Higher quantities than retail.',
  'weight',
  'gram',
  'wholesale',
  '[
    {
      "break_id": "14g",
      "label": "Half Ounce",
      "qty": 14,
      "unit": "g",
      "display": "14g (½ oz)",
      "display_qty": 14,
      "display_unit": "g",
      "sort_order": 1
    },
    {
      "break_id": "28g",
      "label": "1 Ounce",
      "qty": 28,
      "unit": "g",
      "display": "28g (1 oz)",
      "display_qty": 28,
      "display_unit": "g",
      "sort_order": 2
    },
    {
      "break_id": "112g",
      "label": "Quarter Pound",
      "qty": 112,
      "unit": "g",
      "display": "112g (¼ lb)",
      "display_qty": 112,
      "display_unit": "g",
      "sort_order": 3
    },
    {
      "break_id": "224g",
      "label": "Half Pound",
      "qty": 224,
      "unit": "g",
      "display": "224g (½ lb)",
      "display_qty": 224,
      "display_unit": "g",
      "sort_order": 4
    },
    {
      "break_id": "448g",
      "label": "1 Pound",
      "qty": 448,
      "unit": "g",
      "display": "448g (1 lb)",
      "display_qty": 448,
      "display_unit": "g",
      "sort_order": 5
    }
  ]'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  display_unit = EXCLUDED.display_unit,
  context = EXCLUDED.context,
  price_breaks = EXCLUDED.price_breaks;


-- ============================================================================
-- HYBRID BLUEPRINTS (For vendors who do both retail and wholesale)
-- ============================================================================

-- HYBRID FLOWER (Combines retail grams and wholesale pounds)
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type, 
  display_unit,
  context,
  price_breaks,
  is_active
) VALUES (
  'Hybrid Cannabis Flower (Retail + Wholesale)',
  'hybrid-flower-all-units',
  'Complete pricing structure from grams to pounds for vendors doing both retail and wholesale',
  'weight',
  'gram',
  'both',
  '[
    {"break_id": "1g", "label": "1 gram", "qty": 1, "display": "1g", "sort_order": 1},
    {"break_id": "3_5g", "label": "Eighth", "qty": 3.5, "display": "3.5g (⅛ oz)", "sort_order": 2},
    {"break_id": "7g", "label": "Quarter", "qty": 7, "display": "7g (¼ oz)", "sort_order": 3},
    {"break_id": "14g", "label": "Half Ounce", "qty": 14, "display": "14g (½ oz)", "sort_order": 4},
    {"break_id": "28g", "label": "Ounce", "qty": 28, "display": "28g (1 oz)", "sort_order": 5},
    {"break_id": "quarter_lb", "label": "Quarter Pound", "qty": 113.4, "display": "¼ lb", "display_qty": 0.25, "display_unit": "lb", "sort_order": 6},
    {"break_id": "half_lb", "label": "Half Pound", "qty": 226.8, "display": "½ lb", "display_qty": 0.5, "display_unit": "lb", "sort_order": 7},
    {"break_id": "1_lb", "label": "1 Pound", "qty": 453.6, "display": "1 lb", "display_qty": 1, "display_unit": "lb", "sort_order": 8},
    {"break_id": "5_lb", "label": "5 Pounds", "qty": 2268, "display": "5 lbs", "display_qty": 5, "display_unit": "lb", "sort_order": 9},
    {"break_id": "10_lb", "label": "10 Pounds", "qty": 4536, "display": "10 lbs", "display_qty": 10, "display_unit": "lb", "sort_order": 10}
  ]'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  display_unit = EXCLUDED.display_unit,
  context = EXCLUDED.context,
  price_breaks = EXCLUDED.price_breaks;


-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify blueprints created
SELECT 
  name,
  slug,
  display_unit,
  context,
  jsonb_array_length(price_breaks) as num_tiers,
  is_active
FROM public.pricing_tier_blueprints
WHERE slug IN (
  'retail-flower-grams',
  'retail-concentrates-grams',
  'wholesale-flower-pounds',
  'wholesale-concentrates-bulk',
  'hybrid-flower-all-units'
)
ORDER BY context, name;


