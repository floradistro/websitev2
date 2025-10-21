# 🚀 FULL WORDPRESS → SUPABASE MIGRATION PLAN

## 📊 WHAT CAN BE MIGRATED

Based on your current architecture, here's everything that can move from WordPress to Supabase:

---

## ✅ ALREADY MIGRATED (DONE!)

### **1. Inventory System** ✅
- Multi-location inventory tracking
- Stock movements & audit trail
- Cost tracking
- Low stock alerts
- **Status:** 100% migrated & tested

### **2. Vendor Auth & Ownership** ✅
- Vendor profiles
- Vendor authentication
- Product ownership tracking
- **Status:** 100% migrated & tested

---

## 🎯 RECOMMENDED TO MIGRATE

### **1. PRODUCTS CATALOG** 🌟
**Priority:** HIGH  
**Difficulty:** MEDIUM  
**Impact:** HIGH

**Current:** WordPress/WooCommerce  
**Data:** ~140 products

**What to migrate:**
- Product details (name, description, SKU)
- Pricing (regular, sale)
- Images (URLs + metadata)
- Product attributes
- Categories & tags
- Status (draft, published)
- Type (simple, variable)
- Meta data & custom fields

**Benefits:**
- ✅ Faster queries (no WordPress overhead)
- ✅ Real-time updates
- ✅ Better search/filtering
- ✅ GraphQL support
- ✅ Unified with inventory

**Keep in WordPress:**
- ❌ Legacy data (reference only)

---

### **2. PRODUCT CATEGORIES** 🌟
**Priority:** HIGH  
**Difficulty:** EASY  
**Impact:** MEDIUM

**Current:** WordPress taxonomies  
**Data:** ~10-20 categories

**What to migrate:**
- Category name & slug
- Description
- Parent categories (hierarchy)
- Image/icon
- Display order

**Benefits:**
- ✅ Cleaner structure
- ✅ Better performance
- ✅ Easier management

---

### **3. CUSTOMER DATA** 🌟
**Priority:** HIGH  
**Difficulty:** MEDIUM  
**Impact:** HIGH

**Current:** WooCommerce customers  
**Data:** All registered customers

**What to migrate:**
- Email & name
- Billing/shipping addresses
- Phone number
- Account creation date
- Total orders (for analytics)
- Loyalty points (if you have them)

**Benefits:**
- ✅ Unified auth (Supabase)
- ✅ Better security (RLS)
- ✅ Real-time profile updates
- ✅ Custom customer features

**Keep in WordPress:**
- ❌ Order history (initially)
- ❌ Payment methods (Stripe/WooCommerce)

---

### **4. ORDERS** 🌟
**Priority:** MEDIUM  
**Difficulty:** HIGH  
**Impact:** HIGH

**Current:** WooCommerce orders  
**Data:** All customer orders

**What to migrate:**
- Order details (items, quantities, prices)
- Customer info
- Shipping/billing addresses
- Order status
- Payment status
- Tracking numbers
- Order notes

**Benefits:**
- ✅ Custom order workflows
- ✅ Real-time order tracking
- ✅ Better analytics
- ✅ Vendor commission tracking

**Keep in WordPress:**
- ❌ Payment processing (WooCommerce + Stripe)
- ❌ Historical orders (for reference)

---

### **5. PRODUCT REVIEWS** 💬
**Priority:** LOW  
**Difficulty:** EASY  
**Impact:** LOW

**Current:** WooCommerce reviews  
**Data:** Customer reviews

**What to migrate:**
- Review text
- Rating (1-5 stars)
- Reviewer name/email
- Date
- Verified purchase flag

**Benefits:**
- ✅ Custom review features
- ✅ Better moderation
- ✅ Review analytics

---

### **6. COUPONS & DISCOUNTS** 🎫
**Priority:** LOW  
**Difficulty:** EASY  
**Impact:** MEDIUM

**Current:** WooCommerce coupons

**What to migrate:**
- Coupon codes
- Discount type (%, fixed)
- Minimum/maximum amounts
- Expiry dates
- Usage limits
- Applicable products/categories

**Benefits:**
- ✅ Custom discount logic
- ✅ Better tracking
- ✅ Real-time validation

---

## ⚠️ KEEP IN WORDPRESS

### **1. Payment Processing** ❌ DO NOT MIGRATE
**Why:** WooCommerce + Stripe integration is mature and stable  
**Keep:** Payment gateway, transaction processing, refunds

### **2. Historical Data** ❌ DO NOT MIGRATE (initially)
**Why:** Reference for disputes, returns, accounting  
**Keep:** Orders before migration date

### **3. Media Library** ❌ DO NOT MIGRATE
**Why:** WordPress handles images well  
**Alternative:** Use Supabase Storage or keep S3/CDN URLs

---

## 📋 DETAILED MIGRATION PLAN

### **PHASE 1: Product Catalog (Week 1-2)**

#### **Database Schema:**

```sql
-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_product_id INTEGER UNIQUE, -- For migration reference
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT UNIQUE,
  
  -- Type & Status
  type TEXT CHECK (type IN ('simple', 'variable', 'grouped', 'external')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Pricing
  regular_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  on_sale BOOLEAN GENERATED ALWAYS AS (sale_price IS NOT NULL AND sale_price < regular_price) STORED,
  price DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(sale_price, regular_price)) STORED,
  
  -- Organization
  category_id UUID REFERENCES public.categories(id),
  vendor_id UUID REFERENCES public.vendors(id),
  
  -- Images
  featured_image TEXT,
  image_gallery TEXT[], -- Array of image URLs
  
  -- Attributes
  attributes JSONB DEFAULT '{}', -- Product attributes
  variations JSONB DEFAULT '[]', -- For variable products
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Stats
  views INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Flags
  featured BOOLEAN DEFAULT false,
  virtual BOOLEAN DEFAULT false,
  downloadable BOOLEAN DEFAULT false,
  
  -- Inventory link (to existing table)
  manage_stock BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX products_name_idx ON public.products(name);
CREATE INDEX products_slug_idx ON public.products(slug);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_vendor_idx ON public.products(vendor_id);
CREATE INDEX products_status_idx ON public.products(status);
CREATE INDEX products_featured_idx ON public.products(featured);
CREATE INDEX products_price_idx ON public.products(price);

-- Full text search
CREATE INDEX products_search_idx ON public.products 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));


-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_category_id INTEGER UNIQUE,
  
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  
  -- Images
  image_url TEXT,
  banner_url TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  product_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX categories_slug_idx ON public.categories(slug);
CREATE INDEX categories_parent_idx ON public.categories(parent_id);
CREATE INDEX categories_active_idx ON public.categories(is_active);


-- ============================================================================
-- PRODUCT TAGS TABLE
-- ============================================================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_tags (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  
  PRIMARY KEY (product_id, tag_id)
);
```

---

### **PHASE 2: Customers (Week 3)**

#### **Database Schema:**

```sql
-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_customer_id INTEGER UNIQUE,
  
  -- Auth (link to Supabase auth.users)
  auth_user_id UUID REFERENCES auth.users(id),
  
  -- Personal info
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  
  -- Addresses (JSONB for flexibility)
  billing_address JSONB DEFAULT '{}',
  shipping_address JSONB DEFAULT '{}',
  
  -- Account
  username TEXT UNIQUE,
  avatar_url TEXT,
  
  -- Stats
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  
  -- Loyalty
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT,
  
  -- Preferences
  marketing_opt_in BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX customers_email_idx ON public.customers(email);
CREATE INDEX customers_auth_user_idx ON public.customers(auth_user_id);
CREATE INDEX customers_total_spent_idx ON public.customers(total_spent);
```

---

### **PHASE 3: Orders (Week 4-5)**

#### **Database Schema:**

```sql
-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_order_id INTEGER UNIQUE,
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer
  customer_id UUID REFERENCES public.customers(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'on_hold', 'completed', 
    'cancelled', 'refunded', 'failed'
  )),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded'
  )),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partial', 'fulfilled', 'cancelled'
  )),
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Addresses
  billing_address JSONB NOT NULL,
  shipping_address JSONB,
  
  -- Shipping
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Payment
  payment_method TEXT,
  payment_method_title TEXT,
  transaction_id TEXT,
  
  -- Delivery type
  delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup', 'mixed')),
  pickup_location_id UUID REFERENCES public.locations(id),
  
  -- Dates
  order_date TIMESTAMPTZ DEFAULT NOW(),
  paid_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Notes
  customer_note TEXT,
  internal_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX orders_customer_idx ON public.orders(customer_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_order_date_idx ON public.orders(order_date);
CREATE INDEX orders_order_number_idx ON public.orders(order_number);


-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  wordpress_product_id INTEGER, -- For migration
  
  -- Product details (snapshot at time of order)
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Vendor
  vendor_id UUID REFERENCES public.vendors(id),
  vendor_commission DECIMAL(10,2),
  
  -- Fulfillment
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX order_items_order_idx ON public.order_items(order_id);
CREATE INDEX order_items_product_idx ON public.order_items(product_id);
CREATE INDEX order_items_vendor_idx ON public.order_items(vendor_id);
```

---

### **PHASE 4: Reviews & Additional Features (Week 6)**

#### **Database Schema:**

```sql
-- ============================================================================
-- PRODUCT REVIEWS TABLE
-- ============================================================================
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id),
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,
  
  -- Verification
  verified_purchase BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Response
  vendor_response TEXT,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX reviews_product_idx ON public.product_reviews(product_id);
CREATE INDEX reviews_customer_idx ON public.product_reviews(customer_id);
CREATE INDEX reviews_rating_idx ON public.product_reviews(rating);
CREATE INDEX reviews_status_idx ON public.product_reviews(status);


-- ============================================================================
-- COUPONS TABLE
-- ============================================================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_amount DECIMAL(10,2) NOT NULL,
  
  -- Restrictions
  minimum_amount DECIMAL(10,2),
  maximum_amount DECIMAL(10,2),
  allowed_products UUID[], -- Array of product IDs
  allowed_categories UUID[], -- Array of category IDs
  excluded_products UUID[],
  
  -- Usage limits
  usage_limit INTEGER, -- Total uses
  usage_limit_per_customer INTEGER,
  usage_count INTEGER DEFAULT 0,
  
  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX coupons_code_idx ON public.coupons(code);
CREATE INDEX coupons_active_idx ON public.coupons(is_active);


-- ============================================================================
-- COUPON USAGE TABLE
-- ============================================================================
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  
  discount_amount DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX coupon_usage_coupon_idx ON public.coupon_usage(coupon_id);
CREATE INDEX coupon_usage_customer_idx ON public.coupon_usage(customer_id);
```

---

## 🔄 MIGRATION STRATEGY

### **Option 1: Gradual Migration (RECOMMENDED)**

**Approach:** Dual-system operation  
**Duration:** 2-3 months  
**Risk:** LOW

**Process:**
1. ✅ **Week 1-2:** Build Supabase tables
2. ✅ **Week 3-4:** Create API endpoints
3. ✅ **Week 5-6:** Migrate data (batch export/import)
4. ✅ **Week 7-8:** Dual-write (write to both systems)
5. ✅ **Week 9-10:** Switch reads to Supabase
6. ✅ **Week 11-12:** Monitor & verify
7. ✅ **Week 13+:** Deprecate WordPress

**Benefits:**
- Zero downtime
- Easy rollback
- Gradual testing
- Safe for production

---

### **Option 2: Big Bang Migration**

**Approach:** Switch everything at once  
**Duration:** 1 month + downtime  
**Risk:** HIGH

**Not recommended** for active ecommerce site.

---

## 📊 MIGRATION COMPARISON

| What | Keep WordPress | Migrate to Supabase |
|------|----------------|---------------------|
| **Products** | ⚠️ Slow queries | ✅ Fast, real-time |
| **Categories** | ⚠️ Limited | ✅ Flexible |
| **Customers** | ⚠️ WP auth | ✅ Supabase auth |
| **Orders** | ✅ Mature | ✅ Customizable |
| **Inventory** | ❌ Migrated! | ✅ Done! |
| **Payments** | ✅ Keep | ❌ Keep WooCommerce |
| **Reviews** | ⚠️ Basic | ✅ Enhanced |
| **Coupons** | ⚠️ Basic | ✅ Advanced |

---

## 💰 EFFORT ESTIMATION

| Phase | Duration | Complexity | Priority |
|-------|----------|------------|----------|
| **Products** | 2 weeks | MEDIUM | HIGH |
| **Categories** | 3 days | EASY | HIGH |
| **Customers** | 1 week | MEDIUM | HIGH |
| **Orders** | 2 weeks | HIGH | MEDIUM |
| **Reviews** | 3 days | EASY | LOW |
| **Coupons** | 3 days | EASY | LOW |
| **Testing** | 2 weeks | - | HIGH |

**Total:** 8-10 weeks

---

## 🎯 RECOMMENDED MIGRATION ORDER

### **Priority 1: Core Ecommerce (HIGH PRIORITY)**
1. ✅ **Inventory** (DONE!)
2. 🔄 **Products** (2 weeks)
3. 🔄 **Categories** (3 days)
4. 🔄 **Customers** (1 week)

**Goal:** Modern, fast product catalog with real inventory

### **Priority 2: Orders & Transactions (MEDIUM PRIORITY)**
5. 🔄 **Orders** (2 weeks)
6. 🔄 **Order Items** (included with orders)

**Goal:** Better order management & analytics

### **Priority 3: Enhancements (LOW PRIORITY)**
7. 🔄 **Reviews** (3 days)
8. 🔄 **Coupons** (3 days)

**Goal:** Enhanced features beyond WooCommerce

---

## ⚠️ CRITICAL CONSIDERATIONS

### **1. Payment Processing**
**❌ DO NOT MIGRATE**  
Keep WooCommerce payment gateway integration. It's mature, PCI compliant, and handles Stripe/PayPal well.

**Approach:**
- Accept payments via WooCommerce
- Create order in Supabase after payment succeeds
- Keep WooCommerce as payment processor only

### **2. SEO & URLs**
**Keep product URLs** or setup 301 redirects  
**Maintain slug structure** for search rankings

### **3. Historical Data**
**Keep WordPress as archive** for orders before migration date  
**Reference:** Disputes, returns, accounting

### **4. Images**
**Options:**
- Keep WordPress media library (just store URLs in Supabase)
- Migrate to Supabase Storage
- Use CDN (Cloudflare, Cloudinary)

---

## 🚀 QUICK START: Product Migration

Want to start with products? Here's the immediate next steps:

1. ✅ Create products & categories tables in Supabase
2. ✅ Build API endpoints
3. ✅ Export products from WordPress
4. ✅ Import to Supabase
5. ✅ Update frontend to use Supabase APIs
6. ✅ Test thoroughly
7. ✅ Switch over!

**Time:** 2-3 weeks  
**Risk:** LOW  
**Impact:** HIGH (faster site!)

---

## 📝 NEXT STEPS

**Choose your path:**

### **Path A: Aggressive (Full Migration)**
Migrate everything → 8-10 weeks → Modern stack

### **Path B: Conservative (Gradual)**
Keep what works → Migrate critical parts → Evaluate

### **Path C: Status Quo**
Keep WordPress → Only use Supabase for vendor/inventory

---

## 💡 MY RECOMMENDATION

**Start with Products + Categories + Customers**

**Why:**
- ✅ High impact (faster site)
- ✅ Low risk (easy to rollback)
- ✅ Manageable scope (4 weeks)
- ✅ Immediate benefits

**Then evaluate** if full order migration makes sense.

---

## 🎯 SUMMARY

**Can Migrate:**
- ✅ Products (HIGH value)
- ✅ Categories (HIGH value)
- ✅ Customers (HIGH value)
- ✅ Orders (MEDIUM value)
- ✅ Reviews (LOW value)
- ✅ Coupons (LOW value)

**Should Keep:**
- ❌ Payment processing
- ❌ Historical orders (initially)

**Already Migrated:**
- ✅ Inventory system
- ✅ Vendor auth

**Recommendation:** Start with Products + Categories + Customers (4 weeks, high impact)

---

**Ready to start? Let me know which phase you want to tackle first!** 🚀

