-- ============================================================================
-- COST TRACKING & DUAL UNIT SYSTEM (Simplified)
-- Date: 2025-01-24
-- ============================================================================

-- ============================================================================
-- 1. ADD COST TRACKING TO PRODUCTS
-- ============================================================================

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cost_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN cost_price > 0 AND regular_price > 0 
      THEN ((regular_price - cost_price) / regular_price * 100)::DECIMAL(5,2)
      ELSE NULL
    END
  ) STORED;

COMMENT ON COLUMN public.products.cost_price IS '🔒 VENDOR PRIVATE - Cost per unit for margin calculation';
COMMENT ON COLUMN public.products.margin_percentage IS 'Auto-calculated profit margin percentage';

-- Also add to variations
ALTER TABLE public.product_variations 
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN cost_price > 0 AND regular_price > 0 
      THEN ((regular_price - cost_price) / regular_price * 100)::DECIMAL(5,2)
      ELSE NULL
    END
  ) STORED;


-- ============================================================================
-- 2. ADD UNIT FIELDS TO EXISTING PRICING BLUEPRINTS
-- ============================================================================

ALTER TABLE public.pricing_tier_blueprints
  ADD COLUMN IF NOT EXISTS display_unit TEXT DEFAULT 'gram' CHECK (
    display_unit IN ('gram', 'ounce', 'pound', 'kilogram', 'unit')
  ),
  ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'retail' CHECK (
    context IN ('retail', 'wholesale', 'both')
  ),
  ADD COLUMN IF NOT EXISTS conversion_factor DECIMAL(10,4) DEFAULT 1.0;

COMMENT ON COLUMN public.pricing_tier_blueprints.display_unit IS 'How to display quantities: gram, ounce, pound, etc.';
COMMENT ON COLUMN public.pricing_tier_blueprints.context IS 'Where this blueprint applies: retail, wholesale, or both';


-- ============================================================================
-- 3. ADD VENDOR UNIT PREFERENCES
-- ============================================================================

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS retail_display_unit TEXT DEFAULT 'gram' CHECK (
    retail_display_unit IN ('gram', 'ounce', 'pound', 'kilogram')
  ),
  ADD COLUMN IF NOT EXISTS wholesale_display_unit TEXT DEFAULT 'pound' CHECK (
    wholesale_display_unit IN ('gram', 'ounce', 'pound', 'kilogram')
  ),
  ADD COLUMN IF NOT EXISTS track_cost_of_goods BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.vendors.retail_display_unit IS 'Preferred unit for retail pricing display';
COMMENT ON COLUMN public.vendors.wholesale_display_unit IS 'Preferred unit for wholesale pricing display';
COMMENT ON COLUMN public.vendors.track_cost_of_goods IS 'Enable cost tracking and margin calculations';


-- ============================================================================
-- 4. ADD QUANTITY TRACKING TO ORDER_ITEMS
-- Critical for accurate inventory deduction
-- ============================================================================

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS quantity_grams DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS quantity_display TEXT;

COMMENT ON COLUMN public.order_items.quantity_grams IS 'Actual quantity in grams (for inventory tracking)';
COMMENT ON COLUMN public.order_items.quantity_display IS 'Display label shown to customer (e.g., "1 lb", "3.5g")';

CREATE INDEX IF NOT EXISTS order_items_quantity_grams_idx ON public.order_items(quantity_grams) WHERE quantity_grams IS NOT NULL;


-- ============================================================================
-- 5. UNIT CONVERSION FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.convert_weight_to_display(
  quantity_grams DECIMAL,
  display_unit TEXT
) RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE display_unit
    WHEN 'gram' THEN quantity_grams
    WHEN 'ounce' THEN quantity_grams / 28.3495
    WHEN 'pound' THEN quantity_grams / 453.592
    WHEN 'kilogram' THEN quantity_grams / 1000
    ELSE quantity_grams
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.convert_weight_to_display IS 'Convert gram-stored quantity to display unit';


-- ============================================================================
-- 6. VENDOR PROFIT MARGIN VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.vendor_profit_margins AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku,
  p.vendor_id,
  v.store_name as vendor_name,
  p.cost_price,
  p.regular_price,
  p.sale_price,
  p.price as current_price,
  p.margin_percentage,
  CASE 
    WHEN p.cost_price > 0 THEN (p.price - p.cost_price)
    ELSE NULL
  END as profit_per_unit,
  p.stock_quantity,
  CASE 
    WHEN p.cost_price > 0 AND p.stock_quantity > 0 
    THEN (p.price - p.cost_price) * p.stock_quantity
    ELSE NULL
  END as potential_profit,
  CASE 
    WHEN p.cost_price > 0 THEN p.cost_price * p.stock_quantity
    ELSE NULL
  END as inventory_cost_value,
  c.name as product_category,
  p.status,
  p.updated_at
FROM public.products p
LEFT JOIN public.vendors v ON v.id = p.vendor_id
LEFT JOIN public.categories c ON c.id = p.primary_category_id
WHERE p.cost_price IS NOT NULL
  AND p.cost_price > 0;

COMMENT ON VIEW public.vendor_profit_margins IS 'Vendor-only view of profit margins and inventory value';


-- ============================================================================
-- 7. COST CHANGE AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_cost_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  old_cost_price DECIMAL(10,2),
  new_cost_price DECIMAL(10,2),
  
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cost_history_product_idx ON public.product_cost_history(product_id);
CREATE INDEX IF NOT EXISTS cost_history_vendor_idx ON public.product_cost_history(vendor_id);
CREATE INDEX IF NOT EXISTS cost_history_date_idx ON public.product_cost_history(changed_at);

COMMENT ON TABLE public.product_cost_history IS 'Audit log of product cost changes for vendor accounting';


-- ============================================================================
-- 8. TRIGGER TO LOG COST CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_product_cost_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.cost_price IS DISTINCT FROM NEW.cost_price) THEN
    INSERT INTO public.product_cost_history (
      product_id,
      vendor_id,
      old_cost_price,
      new_cost_price
    ) VALUES (
      NEW.id,
      NEW.vendor_id,
      OLD.cost_price,
      NEW.cost_price
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS product_cost_change_trigger ON public.products;

CREATE TRIGGER product_cost_change_trigger
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_product_cost_change();


-- ============================================================================
-- SUMMARY
-- ============================================================================

-- ✅ Cost tracking added to products & variations
-- ✅ Automatic margin calculation
-- ✅ Dual unit fields added to blueprints
-- ✅ Vendor unit preferences
-- ✅ Order items track grams + display
-- ✅ Unit conversion function
-- ✅ Profit margin view
-- ✅ Cost change audit logging

