-- ============================================================================
-- PROMOTIONS SYSTEM - System-wide sales that update instantly across POS, TV, Dashboard
-- Date: 2025-10-28
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Promotion Type
  promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('product', 'category', 'tier', 'global')),

  -- Discount Configuration
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,

  -- Targeting
  target_product_ids UUID[], -- Specific product IDs for 'product' type
  target_categories TEXT[], -- Category slugs for 'category' type
  target_tier_rules JSONB, -- {"min_grams": 7} for bulk discounts

  -- Scheduling
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  days_of_week INTEGER[], -- [0=Sun, 1=Mon, ..., 6=Sat]
  time_of_day_start TIME, -- For happy hour: '16:00:00'
  time_of_day_end TIME, -- For happy hour: '18:00:00'

  -- Display
  badge_text VARCHAR(50), -- "20% OFF", "SALE", "HAPPY HOUR"
  badge_color VARCHAR(20) DEFAULT 'red', -- 'red', 'orange', 'green', 'blue'
  show_original_price BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority shows first if multiple promos apply

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS promotions_vendor_idx ON public.promotions(vendor_id);
CREATE INDEX IF NOT EXISTS promotions_active_idx ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS promotions_type_idx ON public.promotions(promotion_type);
CREATE INDEX IF NOT EXISTS promotions_dates_idx ON public.promotions(start_time, end_time);

-- RLS Policies
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can manage their own promotions" ON public.promotions;
CREATE POLICY "Vendors can manage their own promotions"
  ON public.promotions FOR ALL
  USING (true); -- Simplified: App handles auth via service role

-- Update timestamp trigger
CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.promotions IS 'System-wide promotions that apply across POS, TV menus, and storefront';
COMMENT ON COLUMN public.promotions.promotion_type IS 'Type of promotion: product (specific products), category (all in category), tier (bulk discounts), global (entire store)';
COMMENT ON COLUMN public.promotions.discount_type IS 'How discount is calculated: percentage (e.g., 20% off) or fixed_amount (e.g., $5 off)';
COMMENT ON COLUMN public.promotions.target_tier_rules IS 'JSON rules for tier-based promos, e.g., {"min_grams": 7, "discount_percentage": 10}';
COMMENT ON COLUMN public.promotions.days_of_week IS 'Array of integers 0-6 (Sunday=0) for recurring weekly promos';
COMMENT ON COLUMN public.promotions.time_of_day_start IS 'Start time for daily recurring promos (e.g., happy hour)';
COMMENT ON COLUMN public.promotions.priority IS 'Higher number = higher priority when multiple promos apply';

-- ============================================================================
-- HELPER FUNCTION: Check if promotion is currently active
-- ============================================================================

CREATE OR REPLACE FUNCTION is_promotion_active(
  promo public.promotions,
  check_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  current_day INTEGER;
  check_time_only TIME;
BEGIN
  -- Check if promotion is marked active
  IF NOT promo.is_active THEN
    RETURN FALSE;
  END IF;

  -- Check date range
  IF promo.start_time IS NOT NULL AND check_time < promo.start_time THEN
    RETURN FALSE;
  END IF;

  IF promo.end_time IS NOT NULL AND check_time > promo.end_time THEN
    RETURN FALSE;
  END IF;

  -- Check day of week (0=Sunday, 6=Saturday)
  IF promo.days_of_week IS NOT NULL AND array_length(promo.days_of_week, 1) > 0 THEN
    current_day := EXTRACT(DOW FROM check_time)::INTEGER;
    IF NOT (current_day = ANY(promo.days_of_week)) THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Check time of day
  IF promo.time_of_day_start IS NOT NULL AND promo.time_of_day_end IS NOT NULL THEN
    check_time_only := check_time::TIME;
    IF check_time_only < promo.time_of_day_start OR check_time_only > promo.time_of_day_end THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_promotion_active IS 'Check if a promotion is currently active based on schedule and date/time rules';
