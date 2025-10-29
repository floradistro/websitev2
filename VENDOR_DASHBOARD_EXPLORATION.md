# Comprehensive Vendor Dashboard System Exploration

## Executive Summary

This is a sophisticated **multi-vendor B2B/B2C cannabis/dispensary platform** built with Next.js, TypeScript, Supabase, and React. The system is designed for retail dispensaries and wholesale distributors with advanced features for POS, inventory management, promotions, analytics, and digital signage.

---

## 1. BUSINESS MODEL & PLATFORM OVERVIEW

### Industry Vertical
- **Cannabis/Dispensary Retail**: Lab results tracking, THC product categories, grams-based pricing tiers
- **Multi-Location Support**: Each vendor can manage multiple store locations
- **Wholesale Distribution**: B2B wholesale customers and purchase order system
- **Omnichannel Sales**: POS (in-store), Online Orders (pickup/delivery), TV Menu displays

### Key Market Players
- Primary vendor: "Flora Distro" (hardcoded in POS: `cd2e1122-d511-4edb-be5d-98ef274b4baf`)
- Charlotte Central location (demo)
- Yacht Club branding (logo references)

### Platform Architecture
```
┌─────────────────────────────────────────────┐
│         Vendor Dashboard (Next.js)           │
├─────────────────────────────────────────────┤
│  ┌─ Apps Grid (Navigation Hub)              │
│  ├─ 8 Core Apps Listed Below                │
│  └─ Permission-Based Access Control         │
├─────────────────────────────────────────────┤
│ Database: Supabase PostgreSQL + Realtime    │
│ Storage: Supabase Storage (Media/Assets)    │
│ Auth: Supabase Auth + AppAuthContext        │
└─────────────────────────────────────────────┘
```

---

## 2. VENDOR DASHBOARD NAVIGATION STRUCTURE

### Main Navigation (10 Core Items)
**File**: `/lib/vendor-navigation.ts`

**Desktop Layout**:
- Fixed header with vendor branding
- Left sidebar (272px) with navigation items
- Main content area with scroll

**Mobile Layout**:
- Top sticky nav bar with hamburger menu
- Collapsible sidebar (280px)
- Bottom safe area support (PWA)

### Navigation Items & Apps

#### CORE OPERATIONS (4 apps)
| App | Route | Purpose |
|-----|-------|---------|
| Dashboard | `/vendor/apps` | Overview & launch pad |
| Products | `/vendor/products` | Catalog management & inventory tracking |
| Orders | `/vendor/orders` | Order queue & fulfillment |
| Point of Sale | `/pos/register` | In-store register transactions |

#### SALES & ANALYTICS (3 apps)
| App | Route | Purpose |
|-----|-------|---------|
| Analytics | `/vendor/analytics` | Performance insights, revenue trends |
| Promotions | `/vendor/promotions` | Sales promotions & discounts |
| Payouts | `/vendor/payouts` | Earnings & payment tracking |

#### INVENTORY & PRICING (3 apps)
| App | Route | Purpose |
|-----|-------|---------|
| Inventory | `/vendor/inventory` | Stock management by location |
| Pricing | `/vendor/pricing` | Multi-tier pricing & cost-plus models |
| Product Fields | `/vendor/product-fields` | Custom product attributes |

#### CONTENT & BRANDING (3 apps)
| App | Route | Purpose |
|-----|-------|---------|
| Media Library | `/vendor/media-library` | Image management with AI enhancement |
| Branding | `/vendor/branding` | Store customization (logo, colors, fonts) |
| Digital Signage | `/vendor/tv-menus` | TV menu displays with AI recommendations |

#### SETTINGS & SECONDARY FEATURES
| Feature | Route | Parent |
|---------|-------|--------|
| Settings | `/vendor/settings` | Account & preferences |
| Locations | `/vendor/locations` | Multi-location management |
| Team/Employees | `/vendor/employees` | User management & RBAC |
| Custom Domains | `/vendor/domains` | Domain configuration |
| Lab Results | `/vendor/lab-results` | Cannabis product testing data |
| Purchase Orders | `/vendor/purchase-orders` | Inbound supplier POs |
| Suppliers | `/vendor/suppliers` | Vendor management |
| Wholesale Customers | `/vendor/wholesale-customers` | B2B customer management |
| Reviews | `/vendor/reviews` | Customer feedback & responses |
| Cost+ Pricing | `/vendor/cost-plus-pricing` | Markup-based pricing |

### AppsGrid Component
**File**: `/components/admin/AppsGrid.tsx`

The app launcher includes all 8 primary apps (POS, Orders, Digital Menus, Inventory, Products, Analytics, Customers, Marketing). The **Marketing app** placeholder is defined but points to `/vendor/marketing` which **DOES NOT EXIST YET**.

```typescript
{
  key: 'marketing',
  name: 'Marketing',
  description: 'Create campaigns, promotions, and marketing materials',
  icon: Megaphone,
  route: '/vendor/marketing',  // ← PLACEHOLDER - NOT IMPLEMENTED
  category: 'marketing',
  gradient: 'from-fuchsia-500/20 to-purple-500/20'
}
```

---

## 3. BACKEND API ARCHITECTURE

### API Routes Structure
**Path**: `/app/api/vendor/*`

#### Authentication & Sessions
- `GET/POST /api/vendor/auth/login` - Vendor login
- `POST /api/vendor/auth/refresh` - Token refresh

#### Core Operations
- `GET/POST/PATCH /api/vendor/products` - Product management
- `GET/POST /api/vendor/inventory/*` - Stock tracking
  - `/create` - Add inventory
  - `/adjust` - Adjust quantities
  - `/transfer` - Transfer between locations
  - `/grouped` - Inventory by location
  - `/low-stock` - Low stock alerts
- `GET/POST /api/vendor/orders` - Order management
- `GET /api/vendor/analytics/*` - Analytics data
  - `/overview` - Dashboard metrics
  - `/products` - Product performance
  - `/sales-trend` - Revenue trends

#### Promotions System
**File**: `/app/api/vendor/promotions/route.ts`
- `GET` - List all vendor promotions
- `POST` - Create promotion
- `PATCH` - Update promotion
- `DELETE` - Delete promotion

#### Pricing
- `GET/POST /api/vendor/pricing-config/*` - Pricing blueprint management
- `GET/POST /api/vendor/product-pricing` - Product-specific pricing
- `GET/POST /api/vendor/cost-plus-pricing` - Cost-plus markup calculation
- `GET /api/vendor/category-pricing` - Category pricing rules

#### Media & Assets
- `GET/POST /api/vendor/media/*` - Media operations
  - `/route` - Upload/list media
  - `/enhance` - AI image enhancement
  - `/remove-bg` - Background removal
  - `/upscale` - Image upscaling
  - `/generate` - AI image generation
  - `/reimagine` - Redesign images
  - `/search-inspiration` - Find design inspiration
  - `/bulk-enhance` - Batch processing
  - `/add-background` - Background addition

#### TV Menu System
- `GET/POST /api/vendor/tv-menus/*` - Digital signage
  - `/route` - CRUD operations
  - `/[id]/route` - Individual menu
  - `/update` - Update menu
  - `/delete` - Delete menu

#### Storefront & Content
- `GET/POST /api/vendor/content/*` - Storefront content
  - `/route` - Manage pages
  - `/initialize` - Setup templates
  - `/sections` - Page sections
  - `/components` - Custom components
  - `/reorder` - Reorder elements
- `GET/POST /api/vendor/storefront/*` - Storefront operations
  - `/route` - Storefront config
  - `/preview` - Live preview

#### Administrative
- `GET/POST /api/vendor/locations` - Location management
- `GET/POST /api/vendor/employees` - Staff management
- `GET/POST /api/vendor/domains/*` - Custom domain setup
- `GET/POST /api/vendor/reviews` - Review management
- `GET/POST /api/vendor/suppliers` - Supplier data
- `GET/POST /api/vendor/wholesale-customers` - B2B customers
- `GET/POST /api/vendor/purchase-orders/*` - PO management
- `GET /api/vendor/dashboard` - Dashboard data

### API Authentication Pattern
- Uses `AppAuthProvider` context with Supabase auth
- Service role API calls for backend operations
- `x-vendor-id` header for vendor context
- RLS (Row Level Security) policies enforce vendor isolation

---

## 4. EXISTING MARKETING-RELATED FEATURES

### 4.1 PROMOTIONS SYSTEM ✓ PRODUCTION-READY
**Files**: 
- Page: `/app/vendor/promotions/page.tsx`
- API: `/app/api/vendor/promotions/route.ts`
- DB Schema: `/supabase/migrations/20251028_promotions_system.sql`

**Capabilities**:
- **Promotion Types**: Product, Category, Tier (bulk discounts), Global
- **Discount Types**: Percentage or Fixed Amount
- **Scheduling**: Date range, days of week, time of day windows
- **Display**: Custom badge text/color, show original price option
- **Priority System**: Conflicts resolved by priority
- **Real-time Updates**: Supabase real-time subscriptions
- **Active/Inactive Toggle**: Schedule validation in UI

**Database Schema**:
```sql
CREATE TABLE promotions (
  id UUID PRIMARY KEY,
  vendor_id UUID,
  name VARCHAR(255),
  description TEXT,
  promotion_type VARCHAR(50) -- 'product','category','tier','global'
  discount_type VARCHAR(20) -- 'percentage','fixed_amount'
  discount_value DECIMAL(10,2),
  target_product_ids UUID[],
  target_categories TEXT[],
  target_tier_rules JSONB,
  
  -- Scheduling
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  days_of_week INTEGER[], -- [0=Sun...6=Sat]
  time_of_day_start TIME,
  time_of_day_end TIME,
  
  -- Display
  badge_text VARCHAR(50),
  badge_color VARCHAR(20),
  show_original_price BOOLEAN,
  priority INTEGER,
  is_active BOOLEAN
)
```

**Integration Points**:
- POS cart calculations use `calculatePrice()` with promotions
- TV menus display promotion badges
- Storefront shows discount information
- Real-time updates across all channels

### 4.2 REVIEWS SYSTEM ✓ FUNCTIONAL
**File**: `/app/vendor/reviews/page.tsx`

**Features**:
- Display customer reviews by product
- Star ratings (1-5)
- Vendor responses to reviews
- Filter by rating
- Search reviews
- Verified purchase indicator

### 4.3 BRANDING SYSTEM ✓ CUSTOMIZATION ENGINE
**File**: `/app/vendor/branding/page.tsx`

**Features**:
- Logo upload
- Banner/hero image
- Color customization (primary, secondary, accent, background, text)
- Font selection (10+ Google Fonts)
- Social media links (Instagram, Facebook, website)
- Tagline & about text
- Store description

### 4.4 DIGITAL SIGNAGE (TV MENUS) ✓ VISUAL MARKETING
**Files**:
- Page: `/app/vendor/tv-menus/page.tsx`
- DB Schema: `/supabase/migrations/20251027_tv_menu_system.sql`
- Themes: `/lib/themes.ts`
- AI Integration: DisplayConfigWizard component

**Features**:
- Multiple location support
- Device pairing (online/offline tracking)
- Menu creation with category filters
- Pre-built themes (midnight-elegance, etc.)
- Display modes (dense grid, carousel)
- AI-powered recommendations for optimal layouts
- Real-time inventory integration
- Promotion badge display

### 4.5 ANALYTICS ✓ SALES INSIGHTS
**File**: `/app/vendor/analytics/page.tsx`

**Metrics Tracked**:
- Revenue (total, trend %, daily breakdown)
- Profit margin (average, by product)
- Inventory turnover rate
- Average order value
- Top performing products (by margin, revenue, units)
- Cost analysis (COGS, gross profit)
- Inventory health (stock value, low stock count)
- Time range filters (7d, 30d, 90d, 1y)

**Visualizations**:
- Area chart (revenue trend)
- Product performance table
- Cost analysis breakdown
- Inventory metrics

### 4.6 MEDIA LIBRARY ✓ ASSET MANAGEMENT
**Files**:
- Page: `/app/vendor/media-library/page.tsx` (Client)
- API: `/app/api/vendor/media/*`
- DB: `/supabase/migrations/20251029_vendor_media_library.sql`

**AI-Powered Features**:
- Image enhancement
- Background removal
- Image upscaling
- AI image generation
- Image reimagining (redesign)
- Inspiration search
- Bulk enhancement
- Batch processing

**Storage**: Supabase Storage with public CDN URLs

---

## 5. POINT OF SALE SYSTEM

### POS Architecture
**Files**:
- Page: `/app/pos/register/page.tsx`
- Components: `/components/component-registry/pos/*`
- Layout: `/app/pos/layout.tsx`
- Sessions API: `/app/api/pos/sessions/*`

### POS Features
1. **Product Selection**
   - SKU-based quick entry
   - Grid product browser
   - Search functionality

2. **Cart Management**
   - Add/remove items
   - Quantity adjustment
   - Real-time promotion calculations
   - Promotion badges & pricing display

3. **Pricing Calculations**
   - Automatic promotion application
   - Multiple discount types supported
   - Original price display option
   - Line item totals

4. **Payment Processing**
   - Payment method selection
   - Transaction recording
   - Session management

5. **Real-time Updates**
   - Supabase subscriptions for promotion changes
   - Automatic cart recalculation
   - Live inventory integration

### POS Data Flow
```
Product Grid → Add to Cart → Calculate Price (with Promotions)
                                      ↓
                              Apply Best Discount
                                      ↓
                              Display Breakdown
                                      ↓
                            Payment Processing → Order Creation
```

---

## 6. DATABASE SCHEMA OVERVIEW

### Core Tables (65 migrations, 12,632 SQL lines total)

#### Vendors & Multi-Tenancy
- `vendors` - Store information, contact details
- `users` - Vendor staff accounts
- `employees` - Team members with roles
- `locations` - Multi-store support
- `roles` & `permissions` - RBAC system

#### Products & Inventory
- `products` - Product catalog (with WooCommerce IDs)
- `inventory` - Stock by location
- `product_categories` - Hierarchical categories
- `product_custom_fields` - Flexible product attributes
- `product_fields` - Field definitions
- `product_reviews` - Customer feedback
- `coas` (Certificate of Analysis) - Lab testing data

#### Orders & Transactions
- `orders` - Complete order data with payment & fulfillment
- `order_items` - Line items with pricing snapshots
- `customers` - Customer data & purchase history
- `pos_sessions` - POS register sessions
- `pos_registers` - Physical register devices
- `cash_movements` - Cash tracking

#### Pricing & Promotions
- `promotions` - Sales promotions (main system)
- `pricing_blueprints` - Tiered pricing templates
- `pricing_configs` - Per-product pricing
- `pricing_tiers` - Grams-based tiers (cannabis)
- `cost_plus_pricing` - Markup-based pricing

#### Content & Branding
- `vendor_content` - Storefront pages
- `vendor_content_sections` - Page sections
- `vendor_content_components` - Custom components
- `vendor_style` - Brand colors & fonts
- `vendor_custom_domains` - Domain mapping
- `tv_menus` - Digital menu displays
- `tv_devices` - Connected TV devices
- `tv_menu_themes` - Display themes

#### Wholesale & Distribution
- `wholesale_customers` - B2B buyers
- `wholesale_pricing_tiers` - Bulk discounts
- `purchase_orders` - Inbound POs
- `suppliers` - Vendor management

#### Media & Files
- `vendor_media` - Digital assets
- `vendor_media_collections` - Organized folders

#### AI Integration
- `ai_layout_recommendations` - Display optimization

#### Performance
- Views for analytics queries
- Indexes on critical columns

---

## 7. TECHNOLOGY STACK

### Frontend
- **Next.js 14** - React framework with server components
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations (cards, modals)
- **Recharts** - Data visualization (analytics)
- **Lucide React** - Icon library
- **Axios** - HTTP client

### Backend
- **Supabase** - PostgreSQL database + real-time
- **Next.js API Routes** - Backend endpoints
- **Service Role Auth** - Admin API access

### Design System
- **Global theme colors** - Luxe black & white palette
- **Component library** - Reusable UI widgets
- **Responsive design** - Mobile-first approach
- **Glassmorphism effects** - frosted glass aesthetics

### Real-time Features
- Supabase PostgreSQL Change Data Capture (CDC)
- WebSocket subscriptions for promotions, orders, inventory
- Automatic state synchronization

### Analytics
- Page view tracking in analytics
- Revenue & profit metrics
- Product performance scoring
- Inventory health monitoring

---

## 8. EXISTING GAPS FOR MARKETING APP

### What's Missing (Opportunities for New Marketing App)

1. **Email Marketing**
   - No email campaign builder
   - No newsletter system
   - No customer segmentation for emails

2. **Customer Loyalty Programs**
   - No loyalty points system
   - No tiered membership levels
   - No reward redemption

3. **Referral System**
   - No referral tracking
   - No referral rewards
   - No viral loop mechanics

4. **SMS/Push Notifications**
   - No SMS campaigns
   - No push notification system
   - No geolocation-based notifications

5. **Social Media Integration**
   - No Instagram/Facebook API integration
   - No social media scheduling
   - No social proof widgets

6. **Content Calendar**
   - No marketing calendar
   - No content planning
   - No campaign scheduling

7. **Customer Insights**
   - No customer segmentation
   - No behavioral tracking
   - No predictive analytics

8. **Lead Generation**
   - No landing pages
   - No lead capture forms
   - No lead scoring

9. **Performance Attribution**
   - No UTM tracking
   - No campaign ROI analysis
   - No conversion tracking

10. **Influencer/Affiliate Management**
    - No affiliate program
    - No influencer tracking
    - No commission management

---

## 9. DESIGN PATTERNS & BEST PRACTICES

### Frontend Patterns
- **Custom Hooks**: `useAppAuth()`, `useVendorData()`, `useVendorDashboard()`, `useAutoHideHeader()`
- **Context API**: AppAuthContext for auth state & vendor data
- **Real-time Subscriptions**: Supabase channel patterns
- **Dynamic Imports**: Recharts lazy-loaded for performance
- **Client Components**: "use client" directive for interactive pages
- **Mobile Optimization**: Safe area insets, responsive grids

### API Patterns
- RESTful routes with standardized responses
- Service role for backend admin operations
- Vendor ID isolation for multi-tenancy
- Error handling with meaningful messages
- Async/await with try-catch blocks

### Database Patterns
- UUID primary keys
- JSONB for flexible data (metadata, config)
- Indexes on frequently queried columns
- RLS (Row Level Security) for data isolation
- Trigger functions for `updated_at` timestamps
- Denormalization for analytics performance

### UI/UX Patterns
- Dark theme (black background, white text)
- Luxury aesthetics (subtle glows, gradients)
- Minimal animations (no motion sickness triggers)
- Clear visual hierarchy
- Responsive mobile-first design
- Consistent spacing (8px grid)
- Focus states for accessibility

---

## 10. SUMMARY INSIGHTS

### Platform Strengths
1. **Sophisticated Multi-Tenant Architecture** - True vendor isolation with RBAC
2. **Real-time Capabilities** - Supabase CDC for instant updates across channels
3. **Integrated Promotions System** - Deeply integrated across POS, TV, storefront
4. **Flexible Pricing** - Supports multiple pricing models (fixed, cost-plus, tiered)
5. **Omnichannel Ready** - POS, online, TV menu displays all synchronized
6. **AI Integration** - Image enhancement, layout optimization, inspiration search
7. **Comprehensive Analytics** - Revenue, margin, inventory, product performance
8. **Mobile-First Design** - PWA-ready with safe area support

### Current Limitations
- No email marketing
- No SMS/push notifications
- Limited social media integration
- No loyalty program
- No advanced customer segmentation
- No content calendar for campaigns
- No referral system
- No affiliate management

### Ideal Marketing App Features
Should complement existing system by adding:
- **Campaign Management** - Email, SMS, social, in-app
- **Customer Intelligence** - Segmentation, behavioral analytics, RFM scoring
- **Loyalty Programs** - Points, rewards, tiered benefits
- **Content Calendar** - Plan marketing across channels
- **Attribution & ROI** - Track campaign performance
- **Customer Engagement** - Personalized messaging, automation
- **Social Integration** - Instagram, Facebook, TikTok sync
- **Review Management** - Aggregate, respond, showcase

---

## File Structure Reference

### Key Vendor Pages
```
/app/vendor/
├── dashboard/page.tsx         (Mega dashboard with overview)
├── apps/page.tsx              (Apps launch grid)
├── products/page.tsx          (Product catalog)
├── products/[id]/edit/        (Product editor)
├── products/new/              (New product)
├── inventory/page.tsx         (Stock management)
├── orders/page.tsx            (Order queue)
├── analytics/page.tsx         (Performance metrics)
├── promotions/page.tsx        (Promotion manager) ✓ MARKETING
├── pricing/page.tsx           (Pricing config)
├── branding/page.tsx          (Store customization) ✓ MARKETING
├── media-library/page.tsx     (Asset management) ✓ MARKETING
├── tv-menus/page.tsx          (Digital signage) ✓ MARKETING
├── reviews/page.tsx           (Customer feedback) ✓ MARKETING
├── settings/page.tsx          (Account settings)
├── payouts/page.tsx           (Earnings)
├── locations/page.tsx         (Multi-location)
├── employees/page.tsx         (Team management)
└── layout.tsx                 (Main layout wrapper)
```

### Key API Routes
```
/app/api/vendor/
├── auth/                      (Authentication)
├── products/                  (Product CRUD)
├── inventory/                 (Stock management)
├── analytics/                 (Performance data)
├── promotions/route.ts        (Promotions CRUD) ✓ MARKETING
├── media/                     (Asset operations) ✓ MARKETING
├── tv-menus/                  (Digital signage) ✓ MARKETING
├── reviews/                   (Review management) ✓ MARKETING
├── pricing-config/            (Pricing setup)
├── content/                   (Storefront pages)
├── branding/                  (Brand configuration)
├── domains/                   (Custom domains)
├── locations/                 (Location management)
├── employees/                 (Staff management)
└── ...                        (60+ total endpoints)
```

