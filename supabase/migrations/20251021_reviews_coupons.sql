-- ============================================================================
-- FLORA DISTRO - REVIEWS & COUPONS (Supabase)
-- Product reviews and advanced coupon system
-- ============================================================================

-- ============================================================================
-- PRODUCT REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE,
  
  -- References
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,
  
  -- Verification
  verified_purchase BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Vendor response
  vendor_response TEXT,
  vendor_id UUID REFERENCES public.vendors(id),
  responded_at TIMESTAMPTZ,
  
  -- Images (optional review images)
  review_images TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_customer_idx ON public.product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS reviews_created_idx ON public.product_reviews(created_at);


-- ============================================================================
-- REVIEW VOTES TABLE
-- Track helpful/not helpful votes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  vote_type TEXT CHECK (vote_type IN ('helpful', 'not_helpful')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_id, customer_id)
);

CREATE INDEX IF NOT EXISTS review_votes_review_idx ON public.review_votes(review_id);


-- ============================================================================
-- COUPONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE,
  
  -- Code
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_cart', 'fixed_product')),
  discount_amount DECIMAL(10,2) NOT NULL,
  
  -- Free shipping
  free_shipping BOOLEAN DEFAULT false,
  
  -- Restrictions - Products
  allowed_products UUID[] DEFAULT '{}',
  excluded_products UUID[] DEFAULT '{}',
  
  -- Restrictions - Categories
  allowed_categories UUID[] DEFAULT '{}',
  excluded_categories UUID[] DEFAULT '{}',
  
  -- Restrictions - Amounts
  minimum_amount DECIMAL(10,2),
  maximum_amount DECIMAL(10,2),
  
  -- Usage limits
  usage_limit INTEGER, -- Total uses allowed
  usage_limit_per_user INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  
  -- Individual use
  individual_use BOOLEAN DEFAULT false, -- Can't be combined with other coupons
  exclude_sale_items BOOLEAN DEFAULT false,
  
  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Email restrictions
  allowed_emails TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS coupons_start_date_idx ON public.coupons(start_date);
CREATE INDEX IF NOT EXISTS coupons_end_date_idx ON public.coupons(end_date);


-- ============================================================================
-- COUPON USAGE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  discount_amount DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coupon_usage_coupon_idx ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS coupon_usage_customer_idx ON public.coupon_usage(customer_id);
CREATE INDEX IF NOT EXISTS coupon_usage_order_idx ON public.coupon_usage(order_id);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Reviews - public can view approved, customers can view own
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.product_reviews;
CREATE POLICY "Public can view approved reviews"
  ON public.product_reviews FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Customers can view own reviews" ON public.product_reviews;
CREATE POLICY "Customers can view own reviews"
  ON public.product_reviews FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can create reviews" ON public.product_reviews;
CREATE POLICY "Customers can create reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to reviews" ON public.product_reviews;
CREATE POLICY "Service role full access to reviews"
  ON public.product_reviews FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Coupons - public can view active
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

DROP POLICY IF EXISTS "Service role full access to coupons" ON public.coupons;
CREATE POLICY "Service role full access to coupons"
  ON public.coupons FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Coupon Usage - customers can view own usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own coupon usage" ON public.coupon_usage;
CREATE POLICY "Customers can view own coupon usage"
  ON public.coupon_usage FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to coupon usage" ON public.coupon_usage;
CREATE POLICY "Service role full access to coupon usage"
  ON public.coupon_usage FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Update product rating when review is approved
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.products
    SET 
      average_rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM public.product_reviews
        WHERE product_id = NEW.product_id AND status = 'approved'
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM public.product_reviews
        WHERE product_id = NEW.product_id AND status = 'approved'
      )
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review_approval
  AFTER INSERT OR UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();


-- Update coupon usage count
CREATE OR REPLACE FUNCTION update_coupon_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1
  WHERE id = NEW.coupon_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_coupon_usage
  AFTER INSERT ON public.coupon_usage
  FOR EACH ROW EXECUTE FUNCTION update_coupon_usage_count();


-- Update review helpful counts
CREATE OR REPLACE FUNCTION update_review_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.product_reviews
  SET 
    helpful_count = (
      SELECT COUNT(*) FROM public.review_votes 
      WHERE review_id = NEW.review_id AND vote_type = 'helpful'
    ),
    not_helpful_count = (
      SELECT COUNT(*) FROM public.review_votes 
      WHERE review_id = NEW.review_id AND vote_type = 'not_helpful'
    )
  WHERE id = NEW.review_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_vote_count();


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.product_reviews TO authenticated, service_role;
GRANT ALL ON public.review_votes TO authenticated, service_role;
GRANT ALL ON public.coupons TO authenticated, service_role;
GRANT ALL ON public.coupon_usage TO authenticated, service_role;

