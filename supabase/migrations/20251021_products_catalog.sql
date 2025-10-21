-- ============================================================================
-- FLORA DISTRO - PRODUCTS CATALOG (Supabase)
-- Complete product system with all WooCommerce features
-- No data loss - full feature parity
-- ============================================================================

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE, -- For reference during migration
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Images
  image_url TEXT,
  banner_url TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  -- Counts (updated by trigger)
  product_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories(slug);
CREATE INDEX IF NOT EXISTS categories_parent_idx ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_active_idx ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS categories_featured_idx ON public.categories(featured);
CREATE INDEX IF NOT EXISTS categories_order_idx ON public.categories(display_order);


-- ============================================================================
-- PRODUCTS TABLE
-- Complete product data with all WooCommerce fields
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE, -- For reference during migration
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT,
  
  -- Type & Status
  type TEXT DEFAULT 'simple' CHECK (type IN ('simple', 'variable', 'grouped', 'external')),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  
  -- Pricing
  regular_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  on_sale BOOLEAN GENERATED ALWAYS AS (
    sale_price IS NOT NULL 
    AND sale_price > 0 
    AND sale_price < regular_price
  ) STORED,
  price DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN sale_price IS NOT NULL AND sale_price > 0 AND sale_price < regular_price 
      THEN sale_price 
      ELSE regular_price 
    END
  ) STORED,
  
  -- Categories & Organization
  primary_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Images
  featured_image TEXT,
  image_gallery TEXT[] DEFAULT '{}', -- Array of image URLs
  
  -- Attributes (from WooCommerce)
  attributes JSONB DEFAULT '{}', -- e.g., {"color": ["red", "blue"], "size": ["S", "M", "L"]}
  default_attributes JSONB DEFAULT '{}', -- Default selections
  
  -- Blueprint fields (Flora Distro custom fields)
  blueprint_fields JSONB DEFAULT '[]', -- Custom product fields
  
  -- Variations (for variable products)
  has_variations BOOLEAN DEFAULT false,
  variation_ids UUID[] DEFAULT '{}', -- Links to product_variations table
  
  -- Stock management flags
  manage_stock BOOLEAN DEFAULT true,
  stock_quantity DECIMAL(10,2), -- Can be null if managed via inventory table
  stock_status TEXT DEFAULT 'instock' CHECK (stock_status IN ('instock', 'outofstock', 'onbackorder')),
  backorders_allowed BOOLEAN DEFAULT false,
  low_stock_amount DECIMAL(10,2),
  
  -- Shipping
  weight DECIMAL(10,4),
  length DECIMAL(10,4),
  width DECIMAL(10,4),
  height DECIMAL(10,4),
  shipping_class TEXT,
  
  -- Tax
  tax_status TEXT DEFAULT 'taxable' CHECK (tax_status IN ('taxable', 'shipping', 'none')),
  tax_class TEXT,
  
  -- Product flags
  featured BOOLEAN DEFAULT false,
  virtual BOOLEAN DEFAULT false,
  downloadable BOOLEAN DEFAULT false,
  sold_individually BOOLEAN DEFAULT false,
  
  -- External product (if type = 'external')
  external_url TEXT,
  button_text TEXT,
  
  -- Reviews
  reviews_allowed BOOLEAN DEFAULT true,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- WooCommerce meta data
  meta_data JSONB DEFAULT '{}', -- All additional WooCommerce meta
  
  -- Dates
  date_created TIMESTAMPTZ DEFAULT NOW(),
  date_modified TIMESTAMPTZ DEFAULT NOW(),
  date_on_sale_from TIMESTAMPTZ,
  date_on_sale_to TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS products_name_idx ON public.products(name);
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(primary_category_id);
CREATE INDEX IF NOT EXISTS products_vendor_idx ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS products_type_idx ON public.products(type);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(featured);
CREATE INDEX IF NOT EXISTS products_price_idx ON public.products(price);
CREATE INDEX IF NOT EXISTS products_on_sale_idx ON public.products(on_sale);
CREATE INDEX IF NOT EXISTS products_stock_status_idx ON public.products(stock_status);

-- Full text search on name + description
CREATE INDEX IF NOT EXISTS products_search_idx ON public.products 
  USING gin(to_tsvector('english', 
    name || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(short_description, '') || ' ' ||
    COALESCE(sku, '')
  ));


-- ============================================================================
-- PRODUCT CATEGORIES (Many-to-Many)
-- Products can be in multiple categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS product_categories_product_idx ON public.product_categories(product_id);
CREATE INDEX IF NOT EXISTS product_categories_category_idx ON public.product_categories(category_id);


-- ============================================================================
-- PRODUCT VARIATIONS TABLE
-- For variable products (different sizes, colors, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE,
  
  parent_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Variation attributes (e.g., {"color": "red", "size": "M"})
  attributes JSONB NOT NULL,
  
  -- Pricing
  regular_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  price DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN sale_price IS NOT NULL AND sale_price > 0 AND sale_price < regular_price 
      THEN sale_price 
      ELSE regular_price 
    END
  ) STORED,
  
  -- SKU
  sku TEXT,
  
  -- Stock
  manage_stock BOOLEAN DEFAULT true,
  stock_quantity DECIMAL(10,2),
  stock_status TEXT DEFAULT 'instock',
  backorders_allowed BOOLEAN DEFAULT false,
  
  -- Images
  image TEXT,
  
  -- Shipping
  weight DECIMAL(10,4),
  length DECIMAL(10,4),
  width DECIMAL(10,4),
  height DECIMAL(10,4),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  meta_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS variations_parent_idx ON public.product_variations(parent_product_id);
CREATE INDEX IF NOT EXISTS variations_sku_idx ON public.product_variations(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS variations_active_idx ON public.product_variations(is_active);


-- ============================================================================
-- PRODUCT TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  product_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tags_slug_idx ON public.product_tags(slug);


-- ============================================================================
-- PRODUCT TAG RELATIONSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_tag_relationships (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.product_tags(id) ON DELETE CASCADE,
  
  PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX IF NOT EXISTS product_tags_product_idx ON public.product_tag_relationships(product_id);
CREATE INDEX IF NOT EXISTS product_tags_tag_idx ON public.product_tag_relationships(tag_id);


-- ============================================================================
-- PRODUCT ATTRIBUTES TABLE (for variable products)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'select', -- select, color, text, etc.
  
  -- Display
  order_by TEXT DEFAULT 'menu_order',
  has_archives BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- PRODUCT ATTRIBUTE TERMS (values for attributes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_attribute_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  attribute_id UUID REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- For color attributes
  color_hex TEXT,
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(attribute_id, slug)
);

CREATE INDEX IF NOT EXISTS attribute_terms_attribute_idx ON public.product_attribute_terms(attribute_id);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Categories - public can view active, service role can manage
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access to categories" ON public.categories;
CREATE POLICY "Service role full access to categories"
  ON public.categories FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Products - public can view published, vendors can view their own
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
  ON public.products FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Vendors can view own products" ON public.products;
CREATE POLICY "Vendors can view own products"
  ON public.products FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Service role full access to products" ON public.products;
CREATE POLICY "Service role full access to products"
  ON public.products FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Product Variations - follow parent product rules
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active variations of published products" ON public.product_variations;
CREATE POLICY "Public can view active variations of published products"
  ON public.product_variations FOR SELECT
  USING (
    is_active = true 
    AND parent_product_id IN (SELECT id FROM public.products WHERE status = 'published')
  );

DROP POLICY IF EXISTS "Service role full access to variations" ON public.product_variations;
CREATE POLICY "Service role full access to variations"
  ON public.product_variations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Tags - public can view
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view tags" ON public.product_tags;
CREATE POLICY "Public can view tags"
  ON public.product_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role full access to tags" ON public.product_tags;
CREATE POLICY "Service role full access to tags"
  ON public.product_tags FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER variations_updated_at BEFORE UPDATE ON public.product_variations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Update category product count
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old category count
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
    UPDATE public.categories 
    SET product_count = (
      SELECT COUNT(*) FROM public.product_categories 
      WHERE category_id = OLD.category_id
    )
    WHERE id = OLD.category_id;
  END IF;
  
  -- Update new category count
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
    UPDATE public.categories 
    SET product_count = (
      SELECT COUNT(*) FROM public.product_categories 
      WHERE category_id = NEW.category_id
    )
    WHERE id = NEW.category_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();


-- Update tag product count
CREATE OR REPLACE FUNCTION update_tag_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.product_tags 
    SET product_count = product_count - 1
    WHERE id = OLD.tag_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE public.product_tags 
    SET product_count = product_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_counts
  AFTER INSERT OR DELETE ON public.product_tag_relationships
  FOR EACH ROW EXECUTE FUNCTION update_tag_product_count();


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.categories TO authenticated, service_role;
GRANT ALL ON public.products TO authenticated, service_role;
GRANT ALL ON public.product_categories TO authenticated, service_role;
GRANT ALL ON public.product_variations TO authenticated, service_role;
GRANT ALL ON public.product_tags TO authenticated, service_role;
GRANT ALL ON public.product_tag_relationships TO authenticated, service_role;
GRANT ALL ON public.product_attributes TO authenticated, service_role;
GRANT ALL ON public.product_attribute_terms TO authenticated, service_role;

