# Vendor Storefront Template System - Compliance-First Design

## Overview

Cannabis vendors need:
1. **Base Compliant Template** - Non-negotiable pages/features for legal compliance
2. **Customization Freedom** - Branding, content, products within compliance
3. **Vendor Dashboard Control** - Manage everything without touching code
4. **Automatic Compliance** - System enforces requirements

---

## Template Structure (Shopify Theme Model)

### Required Pages (Compliance - Cannot Be Removed)

```
app/(storefront)/storefront/
├── page.tsx                    # Home - REQUIRED
├── shop/page.tsx               # Products - REQUIRED
├── products/[slug]/page.tsx    # Product Detail - REQUIRED
├── cart/page.tsx               # Cart - REQUIRED
├── checkout/ (future)          # Checkout - REQUIRED
├── age-verification/           # Age Gate - REQUIRED (21+)
├── lab-results/[id]/          # COA Display - REQUIRED
├── terms/page.tsx              # Terms - REQUIRED (compliance)
├── privacy/page.tsx            # Privacy - REQUIRED (compliance)
├── shipping/page.tsx           # Shipping - REQUIRED (compliance)
├── returns/page.tsx            # Returns - REQUIRED (compliance)
└── compliance/page.tsx         # Cannabis Compliance - REQUIRED
```

### Optional Pages (Vendor Can Enable/Disable)

```
├── about/page.tsx              # About Us - OPTIONAL
├── contact/page.tsx            # Contact - OPTIONAL
├── blog/                       # Blog - OPTIONAL
├── faq/page.tsx                # FAQ - OPTIONAL
├── reviews/page.tsx            # Reviews - OPTIONAL
└── locations/page.tsx          # Store Locations - OPTIONAL
```

---

## Compliance Requirements (Cannabis-Specific)

### 1. Age Verification (21+)
**Where:** Every entry point to vendor site
**How:** Age gate modal on first visit
```typescript
// components/storefront/AgeGate.tsx
- "Are you 21 or older?"
- Cookie: age_verified
- Redirect to exit page if No
- Required by law in all states
```

### 2. Lab Results / COA Display
**Where:** Every product page
**How:** Link to Certificate of Analysis
```typescript
// Product Detail Page
- COA badge/button
- Opens lab results PDF
- Shows: THC%, CBD%, Terpenes, Heavy Metals, Pesticides
- Required for compliance
```

### 3. Legal Disclaimers
**Where:** Footer of every page
```typescript
// components/storefront/ComplianceFooter.tsx
- "Products contain <0.3% Delta-9 THC (Farm Bill compliant)"
- "Must be 21+ to purchase"
- State shipping restrictions
- Medical claims disclaimer
```

### 4. Product Approval Workflow
**Where:** Vendor dashboard → Admin review
```typescript
// Status flow:
draft → pending_review → approved → published

Admin checks:
- Lab results uploaded?
- THC% compliant?
- No medical claims?
- Proper labeling?

ONLY approved products show on storefront
```

### 5. Payment Compliance
**Where:** Checkout flow
```typescript
// Authorize.net (cannabis-approved processor)
- Age verification before checkout
- State restrictions enforced
- Transaction limits
- Reporting for compliance
```

---

## Base Template Configuration

### What's Fixed (Compliance)

```typescript
// config/compliance-requirements.ts

export const COMPLIANCE_REQUIRED = {
  pages: [
    'home',
    'shop', 
    'product-detail',
    'cart',
    'terms',
    'privacy',
    'shipping',
    'returns',
    'compliance',
    'lab-results',
    'age-verification'
  ],
  
  features: {
    ageGate: true,              // Cannot disable
    labResults: true,           // Cannot disable
    complianceFooter: true,     // Cannot disable
    productApprovals: true,     // Cannot disable
    stateRestrictions: true,    // Cannot disable
  },
  
  disclaimers: {
    thcContent: true,
    ageRequirement: true,
    shippingRestrictions: true,
    notMedicalAdvice: true,
  }
};
```

### What's Customizable

```typescript
// config/vendor-customization.ts

export const VENDOR_CUSTOMIZABLE = {
  branding: {
    logo: true,
    colors: {
      primary: true,
      secondary: true,
      accent: true,
    },
    fonts: ['Inter', 'Playfair Display', 'Montserrat', ...],
    tagline: true,
    description: true,
  },
  
  pages: {
    about: { enabled: true, content: 'editable' },
    contact: { enabled: true, content: 'editable' },
    blog: { enabled: false, content: 'editable' },
    faq: { enabled: true, content: 'editable' },
  },
  
  layout: {
    headerStyle: ['minimal', 'full', 'centered'],
    footerLayout: ['3-column', '4-column', 'minimal'],
    productGrid: ['2-col', '3-col', '4-col'],
  },
  
  content: {
    heroSection: 'editable',
    featuredProducts: 'vendor-selects',
    testimonials: 'vendor-adds',
    socialProof: 'vendor-configures',
  }
};
```

---

## Vendor Dashboard Integration

### Dashboard Structure

```
/vendor/
├── dashboard/              # Overview
├── products/               # Product management
├── orders/                 # Order processing
├── inventory/              # Stock management
├── pricing/                # Tier configuration
├── branding/               # Logo, colors, fonts
├── storefront/             # Template configuration ← NEW!
│   ├── pages/              # Enable/disable pages
│   ├── content/            # Edit page content
│   ├── layout/             # Choose layouts
│   ├── theme/              # Advanced theme editor
│   └── preview/            # Live preview
├── domains/                # Custom domain management
├── compliance/             # Lab results, approvals
└── settings/               # General settings
```

### Storefront Configuration Tables

```sql
-- Vendor storefront configuration
CREATE TABLE vendor_storefront_config (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  
  -- Page Configuration
  enabled_pages JSONB DEFAULT '{
    "about": true,
    "contact": true,
    "blog": false,
    "faq": true,
    "locations": true
  }',
  
  -- Content Blocks (editable by vendor)
  content_blocks JSONB DEFAULT '{
    "hero": {
      "title": "Welcome to Our Store",
      "subtitle": "Premium Cannabis Products",
      "cta_text": "Shop Now"
    },
    "about": {
      "story": "Our story...",
      "mission": "Our mission..."
    }
  }',
  
  -- Layout Preferences
  layout_config JSONB DEFAULT '{
    "headerStyle": "full",
    "footerLayout": "4-column",
    "productGrid": "3-col"
  }',
  
  -- Theme/Style
  theme_config JSONB DEFAULT '{
    "headerTransparent": false,
    "stickyHeader": true,
    "showBreadcrumbs": true,
    "productLayout": "sidebar"
  }',
  
  -- Featured Content
  featured_products UUID[] DEFAULT '{}',  -- Product IDs
  testimonials JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Version history for rollbacks
CREATE TABLE vendor_storefront_versions (
  id UUID PRIMARY KEY,
  vendor_id UUID,
  config_snapshot JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Template Development Roadmap

### Phase 1: Complete Required Pages (Compliance)

#### Week 1-2: Core Compliance Pages

**1. Age Verification**
```typescript
// app/(storefront)/storefront/age-verification/page.tsx
- 21+ gate with date picker
- Cookie: age_verified (expires in 24hrs)
- Redirect logic
- State-specific messaging
```

**2. Lab Results Display**
```typescript
// app/(storefront)/storefront/lab-results/[id]/page.tsx
- Fetch from vendor_lab_results table
- Display COA (Certificate of Analysis)
- Show: Cannabinoids, Terpenes, Contaminants, Heavy Metals
- PDF download
- QR code for verification
```

**3. Compliance Page**
```typescript
// app/(storefront)/storefront/compliance/page.tsx
- Farm Bill compliance statement
- THC content disclosure
- State-by-state shipping restrictions
- Age requirements
- Medical disclaimer
- Packaging requirements
```

**4. Terms & Privacy (Legal)**
```typescript
// Use template with vendor-specific details
- Vendor name inserted dynamically
- Compliance language (non-editable)
- Contact info (vendor-specific)
```

#### Week 3: Enhanced Product Pages

**Product Detail Enhancements:**
```typescript
// app/(storefront)/storefront/products/[slug]/page.tsx

Add:
- Lab results section (COA link)
- Terpene profile visualization
- Effects wheel/chart
- Dosage calculator
- Compliance badges (Farm Bill, Lab Tested, etc.)
- Shipping restrictions for this product
- Related products (same vendor)
```

**Product Listing Enhancements:**
```typescript
// app/(storefront)/storefront/shop/page.tsx

Add:
- Advanced filters (strain type, effects, price range)
- Sort options (price, name, THC%, newest)
- Category navigation
- Search functionality
- Stock filters ("In Stock Only")
```

#### Week 4: Cart & Checkout Compliance

**Cart Page:**
```typescript
// app/(storefront)/storefront/cart/page.tsx

Add:
- Age verification check before checkout
- State shipping validation
- Quantity limits (per state regulations)
- Compliance warnings
```

**Checkout Flow (Future):**
```typescript
// Multi-step compliance-aware checkout
1. Age verification
2. Shipping address validation (state restrictions)
3. Payment (Authorize.net)
4. Order confirmation with compliance info
```

---

### Phase 2: Vendor Customization Dashboard

#### Storefront Builder

```typescript
// app/vendor/storefront/page.tsx

Sections:
┌────────────────────────────────────────┐
│  VENDOR STOREFRONT CONFIGURATION        │
├────────────────────────────────────────┤
│                                         │
│  📄 Pages                               │
│  ☑ About Us                             │
│  ☑ Contact                              │
│  ☐ Blog (coming soon)                   │
│  ☑ FAQ                                  │
│  ☑ Store Locations                      │
│                                         │
│  🎨 Theme                                │
│  Header Style: [Full ▼]                │
│  Product Grid: [3 Columns ▼]          │
│  Footer Layout: [4 Column ▼]          │
│                                         │
│  ✏️ Content Blocks                      │
│  Hero Title: [                    ]     │
│  Hero Subtitle: [                 ]     │
│  CTA Button: [                    ]     │
│                                         │
│  ⭐ Featured Products                   │
│  [Product Selector - drag to reorder]  │
│                                         │
│  [Preview Storefront] [Save Changes]   │
│                                         │
└────────────────────────────────────────┘
```

**Implementation:**
```typescript
// app/vendor/storefront/page.tsx
- Form to edit vendor_storefront_config
- Real-time preview in iframe
- Save to database
- Changes reflected immediately on storefront
```

#### Content Management

```typescript
// app/vendor/storefront/content/about/page.tsx

Rich Text Editor:
- Edit "About Us" story
- Upload team photos
- Add mission statement
- Link social media

Saves to:
vendor_storefront_config.content_blocks.about
```

---

### Phase 3: Template Variants (Future)

**Multiple Template Options:**

```typescript
// Vendor chooses template style
templates: [
  'modern-minimal',    // Current (clean, minimalist)
  'luxury',            // High-end, elegant
  'bold',              // Vibrant, eye-catching
  'natural',           // Earthy, organic
  'tech',              // Futuristic, sleek
]

// Database:
vendor_storefront_config.template = 'modern-minimal'

// Render:
const TemplateComponent = templates[config.template];
return <TemplateComponent vendor={vendor} />
```

---

## Development Priority (Cannabis Compliance)

### Immediate (This Sprint)

#### 1. Age Verification System
**Priority: CRITICAL (Legal Requirement)**

```bash
# Create age gate component
components/storefront/AgeGate.tsx

# Features:
- Date picker (DOB entry)
- Cookie storage (24hr)
- Session tracking
- State-specific messaging
- Redirect to exit page if under 21
```

**Database:**
```sql
CREATE TABLE age_verifications (
  id UUID PRIMARY KEY,
  session_id TEXT,
  verified_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT
);
```

#### 2. Lab Results Integration
**Priority: CRITICAL (Compliance)**

```bash
# Lab results management
app/vendor/lab-results/

# Display component
components/storefront/LabResultsBadge.tsx

# Database:
CREATE TABLE vendor_lab_results (
  id UUID PRIMARY KEY,
  vendor_id UUID,
  product_id UUID,
  lab_name TEXT,
  test_date DATE,
  results JSONB,  -- cannabinoids, terpenes, contaminants
  coa_pdf_url TEXT,
  qr_code_url TEXT,
  status TEXT
);
```

#### 3. Compliance Disclaimers
**Priority: CRITICAL (Legal)**

```typescript
// components/storefront/ComplianceFooter.tsx

Required text on EVERY page:
- "Products contain <0.3% Delta-9 THC per the 2018 Farm Bill"
- "Must be 21+ to purchase"
- "Not for use by pregnant or nursing women"  
- "Keep out of reach of children"
- "Not intended to diagnose, treat, cure, or prevent any disease"
- State shipping restrictions list
```

#### 4. State Shipping Restrictions
**Priority: HIGH (Compliance)**

```sql
CREATE TABLE state_restrictions (
  state_code CHAR(2) PRIMARY KEY,
  allowed BOOLEAN DEFAULT false,
  thc_limit DECIMAL,  -- Some states have different limits
  restrictions JSONB,
  notes TEXT
);

-- Checkout validates:
SELECT allowed FROM state_restrictions WHERE state_code = $1
```

### Next Sprint

#### 5. Content Management System
```typescript
// app/vendor/storefront/content/

Editable Sections:
- Hero section (title, subtitle, CTA)
- About Us story
- Featured products selection
- Testimonials
- FAQs
- Contact information
- Business hours
```

#### 6. Theme Customization
```typescript
// app/vendor/storefront/theme/

Options:
- Header style (full, minimal, centered)
- Product card layout (compact, detailed, image-focus)
- Color scheme (beyond primary/accent)
- Typography scale
- Spacing/padding
- Border radius
- Shadow styles
```

#### 7. Advanced Features
```typescript
// Progressive enhancement
- Blog system
- Email newsletter signup
- Loyalty program integration
- Reviews & ratings
- Live chat
- Store locator
```

---

## Vendor Setup Process (Onboarding)

### Current Flow:
```
1. Vendor registers → creates account
2. Admin approves vendor → status='active'
3. Vendor dashboard unlocked
4. Vendor adds products
5. Products pending approval
6. Admin reviews products
7. Products approved → published
8. Vendor configures pricing tiers
9. Vendor uploads logo, sets colors
10. Storefront LIVE at vendor-slug.yachtclub.com
```

### Enhanced Flow (With Template System):

```
1. Vendor registers
    ↓
2. Admin approves vendor
    ↓
3. Vendor Dashboard Onboarding Wizard:
    
    Step 1: Store Information
    ────────────────────────
    • Store name
    • Tagline
    • Description
    • Business type
    
    Step 2: Branding
    ────────────────
    • Upload logo
    • Choose colors (primary, accent)
    • Select font
    • Upload banner image
    
    Step 3: First Products
    ──────────────────────
    • Add 3-5 products
    • Upload images
    • Add descriptions
    • Set pricing
    
    Step 4: Compliance Setup
    ────────────────────────
    • Upload business license
    • Upload lab results for products
    • Confirm age verification
    • Accept compliance terms
    
    Step 5: Storefront Content
    ──────────────────────────
    • Edit "About Us" story
    • Add contact information
    • Set business hours
    • Add social media links
    
    Step 6: Payment Setup
    ─────────────────────
    • Connect bank account
    • Set payout schedule
    
    Step 7: Preview & Launch
    ────────────────────────
    • Preview storefront
    • Choose subdomain (vendor-name.yachtclub.com)
    • Launch!
    
    Step 8: Custom Domain (Optional)
    ─────────────────────────────────
    • Add custom domain
    • DNS verification
    • SSL provisioning
    • Go live!
```

**Database Tracking:**
```sql
CREATE TABLE vendor_onboarding (
  vendor_id UUID PRIMARY KEY,
  current_step INT DEFAULT 1,
  completed_steps JSONB DEFAULT '[]',
  onboarding_started_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  storefront_launched BOOLEAN DEFAULT false
);
```

---

## Template Component Architecture

### Shared Template Components (All Vendors Use)

```typescript
components/storefront/
├── template/
│   ├── StorefrontLayout.tsx       # Base layout structure
│   ├── PageHeader.tsx              # Page-level headers
│   ├── ProductGrid.tsx              # Product display grid
│   ├── ProductCard.tsx              # Individual product (uses main)
│   ├── HeroSection.tsx              # Configurable hero
│   ├── FeaturedProducts.tsx         # Vendor-selected products
│   ├── ContentBlock.tsx             # Reusable content blocks
│   ├── TestimonialCarousel.tsx      # Customer reviews
│   ├── Newsletter.tsx               # Email signup
│   └── ComplianceFooter.tsx         # Required disclaimers
│
├── StorefrontHeader.tsx             # Main header (uses branding)
├── StorefrontFooter.tsx             # Main footer (uses branding)
├── AgeGate.tsx                      # Age verification modal
├── LabResultsBadge.tsx              # COA display
└── ProductApprovalBadge.tsx         # Admin-approved indicator
```

### How Components Use Vendor Data

```typescript
// components/storefront/template/HeroSection.tsx

export function HeroSection({ vendor, config }: Props) {
  // Vendor data from database
  const {
    logo_url,
    brand_colors,
    store_tagline,
  } = vendor;
  
  // Configuration from vendor_storefront_config
  const {
    heroTitle,
    heroSubtitle,
    ctaText,
  } = config.content_blocks.hero;
  
  // Render with vendor-specific data
  return (
    <section style={{ backgroundColor: brand_colors.primary }}>
      <h1>{heroTitle || store_tagline}</h1>
      <p>{heroSubtitle}</p>
      <button>{ctaText || 'Shop Now'}</button>
    </section>
  );
}
```

---

## How to Polish the Template

### Week 1: Compliance Foundation

**Day 1-2: Age Verification**
```bash
✓ Create AgeGate component
✓ Add cookie management
✓ Create exit page
✓ Test on all entry points
```

**Day 3-4: Lab Results System**
```bash
✓ Create lab_results table
✓ Build upload interface (vendor dashboard)
✓ Create COA display page
✓ Add LabResultsBadge to product cards
✓ PDF viewer component
```

**Day 5: Compliance Footer**
```bash
✓ Create ComplianceFooter component
✓ Add to StorefrontFooter
✓ Pull state restrictions from database
✓ Dynamic disclaimer text
```

### Week 2: Page Completion

**Missing Pages to Build:**

1. **About Page** (Editable by Vendor)
```typescript
// app/(storefront)/storefront/about/page.tsx
- Fetch vendor story from database
- Render with template
- Allow rich text (vendor edits in dashboard)
```

2. **Contact Page** (Vendor-Configured)
```typescript
// app/(storefront)/storefront/contact/page.tsx
- Contact form
- Vendor's email/phone from database
- Business hours
- Location map (if physical store)
```

3. **FAQ Page** (Vendor-Managed)
```typescript
// app/(storefront)/storefront/faq/page.tsx
- Vendor adds FAQs in dashboard
- Categorized sections
- Searchable
```

4. **Locations Page** (If Vendor Has Physical Stores)
```typescript
// app/(storefront)/storefront/locations/page.tsx
- Map integration
- Store hours
- Directions
- In-store pickup info
```

5. **Terms/Privacy/Shipping/Returns**
```typescript
// Legal pages with compliance templates
- Base compliance text (non-editable)
- Vendor-specific sections (editable)
- Automatic vendor name insertion
```

### Week 3: Enhanced Product Experience

**Product Detail Page:**
```bash
✓ Terpene profile chart
✓ Effects visualization
✓ Strain lineage display
✓ Related products carousel
✓ Reviews section
✓ Share buttons
✓ Print/save functionality
```

**Shop Page:**
```bash
✓ Advanced filters
✓ Search bar
✓ Category navigation
✓ Price range slider
✓ Sort options
✓ Pagination
✓ View toggle (grid/list)
```

### Week 4: Vendor Dashboard - Storefront Manager

**Build: `/vendor/storefront/`**

```typescript
// app/vendor/storefront/page.tsx

Tabs:
┌──────────────────────────────────────┐
│ [Pages] [Content] [Theme] [Preview]  │
├──────────────────────────────────────┤
│                                       │
│  PAGES TAB:                           │
│  ☑ About Us                           │
│  ☑ Contact                            │
│  ☐ Blog (Pro feature)                 │
│  ☑ FAQ                                │
│  ☑ Locations                          │
│                                       │
│  [Save Changes]                       │
└──────────────────────────────────────┘
```

```typescript
// app/vendor/storefront/content/page.tsx

Editable Blocks:
┌──────────────────────────────────────┐
│  HERO SECTION                         │
│  Title: [Welcome to Flora Distro]    │
│  Subtitle: [The biggest distributor] │
│  CTA Text: [Shop Now]                │
│                                       │
│  ABOUT SECTION                        │
│  [Rich Text Editor]                   │
│  Our story...                         │
│                                       │
│  FEATURED PRODUCTS                    │
│  [Drag to reorder]                    │
│  1. Pure Sherb                        │
│  2. Tiger Runtz                       │
│  3. Unicorn Cherry                    │
│                                       │
│  [Save & Preview]                     │
└──────────────────────────────────────┘
```

---

## Compliance Automation

### Product Approval Workflow

```typescript
// System enforces compliance automatically

Product Status Flow:
draft → pending_review → approved/rejected → published

Admin Review Checklist:
☐ Lab results uploaded?
☐ COA shows compliant THC%?
☐ Product images appropriate?
☐ No medical claims in description?
☐ Proper strain classification?
☐ Packaging info complete?

Auto-Checks (Before Admin Review):
✓ lab_result_id present?
✓ THC% < 0.3% Delta-9?
✓ Images uploaded?
✓ Required fields filled?

Only after ALL checks pass → shows on storefront
```

### Automated Compliance Enforcement

```typescript
// config/compliance-rules.ts

export const COMPLIANCE_RULES = {
  product: {
    requiredFields: [
      'name',
      'description',
      'price',
      'lab_result_id',    // MUST have lab test
      'category',
      'strain_type',
    ],
    
    prohibitedWords: [
      'cure',
      'treat',
      'diagnose',
      'medical',
      'prescription',
      // ... FDA restricted terms
    ],
    
    thcLimits: {
      delta9: 0.3,  // Federal limit
      total: null,  // State-specific
    },
  },
  
  shipping: {
    restrictedStates: [
      'ID', 'IA', 'KS', // etc.
    ],
    
    ageRequirement: 21,
  },
  
  display: {
    requiredDisclaim ers: [
      'age_warning',
      'thc_content',
      'farm_bill',
      'not_medical',
    ],
  },
};

// Enforced at:
// 1. Product creation (vendor dashboard)
// 2. Admin approval
// 3. Checkout
// 4. Display (automatic badges)
```

---

## Template Polish Checklist

### Design/UX
```
☐ Responsive design (mobile-first)
☐ Loading states
☐ Empty states
☐ Error states
☐ Accessibility (WCAG AA)
☐ SEO optimization
☐ Performance optimization
☐ Image optimization
```

### Content
```
☐ Hero section (vendor-editable)
☐ About Us page (rich text editor)
☐ Contact page (form + info)
☐ FAQ system (vendor-manageable)
☐ Testimonials (vendor-adds)
☐ Blog (optional)
```

### Commerce
```
☑ Product grid with pricing tiers
☑ Product detail with fields
☑ Cart functionality
☐ Wishlist
☐ Quick view
☐ Product comparison
☐ Size guide
☐ Dosage calculator
```

### Compliance
```
☐ Age gate (21+)
☐ Lab results display
☐ COA download
☐ Compliance disclaimers
☐ State restrictions
☐ Shipping calculator with restrictions
☐ Product approval badges
```

### Vendor Control
```
☐ Page enable/disable
☐ Content block editor
☐ Featured products selector
☐ Theme configuration
☐ Layout options
☐ Preview mode
☐ Version history
```

---

## Implementation Plan

### Sprint 1: Compliance (2 weeks)
```
Priority 1: Age Verification
Priority 2: Lab Results
Priority 3: Compliance Footer
Priority 4: State Restrictions
Priority 5: Legal Pages
```

### Sprint 2: Core Pages (2 weeks)
```
Priority 1: Enhanced Product Detail
Priority 2: Enhanced Shop Page
Priority 3: About Page
Priority 4: Contact Page
Priority 5: FAQ Page
```

### Sprint 3: Vendor Dashboard (2 weeks)
```
Priority 1: Storefront Configuration UI
Priority 2: Content Editor
Priority 3: Theme Options
Priority 4: Preview Mode
Priority 5: Help Documentation
```

### Sprint 4: Advanced Features (2 weeks)
```
Priority 1: Reviews System
Priority 2: Blog (optional)
Priority 3: Newsletter
Priority 4: Live Chat
Priority 5: Analytics Dashboard
```

---

## Starting Point: Polish Current Template

### Immediate Actions (This Week):

#### 1. Audit Current Pages
```bash
cd app/(storefront)/storefront/

Existing:
✓ page.tsx (home)
✓ shop/page.tsx
✓ products/[slug]/page.tsx
✓ cart/page.tsx
✓ about/page.tsx
✓ contact/page.tsx

Missing (Compliance):
✗ age-verification/
✗ lab-results/[id]/
✗ compliance/
✗ terms/ (need vendor-specific)
✗ privacy/ (need vendor-specific)
```

#### 2. Create Compliance Components
```bash
# Priority order:
1. components/storefront/AgeGate.tsx
2. components/storefront/ComplianceFooter.tsx
3. components/storefront/LabResultsBadge.tsx
4. app/(storefront)/storefront/lab-results/[id]/page.tsx
5. app/(storefront)/storefront/compliance/page.tsx
```

#### 3. Database Schema
```sql
-- Run these migrations:
1. vendor_lab_results table
2. vendor_storefront_config table
3. age_verifications table
4. state_restrictions table (seed with data)
5. Add indexes for performance
```

#### 4. Vendor Dashboard - Storefront Tab
```bash
# Create:
app/vendor/storefront/
├── page.tsx              # Main config
├── content/
│   ├── hero/page.tsx     # Edit hero
│   ├── about/page.tsx    # Edit about
│   └── faq/page.tsx      # Manage FAQs
├── theme/page.tsx        # Theme options
└── preview/page.tsx      # Live preview
```

---

## Why This Approach Works

### 1. Compliance-First
- All vendors MUST have required pages
- Automatic compliance checks
- Admin approval workflow
- Impossible to go live non-compliant

### 2. Vendor Freedom (Within Limits)
- Customize branding fully
- Edit content freely
- Choose layouts/themes
- But compliance features locked

### 3. Scalable
- Template works for ALL vendors
- Add vendor = populate database
- No custom code per vendor
- Shopify proved this scales to millions

### 4. Maintainable
- Single template codebase
- Update once, all vendors benefit
- Fix bug once, fixed everywhere
- Add feature once, available to all

---

## Next Steps

### Start Here:

1. **Create Age Verification Component** (TODAY)
   ```bash
   components/storefront/AgeGate.tsx
   ```

2. **Create Compliance Footer** (TODAY)
   ```bash
   components/storefront/ComplianceFooter.tsx
   ```

3. **Create Lab Results Table** (TODAY)
   ```sql
   migrations/vendor_lab_results.sql
   ```

4. **Build Lab Results Display Page** (TOMORROW)
   ```bash
   app/(storefront)/storefront/lab-results/[id]/page.tsx
   ```

5. **Create Vendor Storefront Config UI** (THIS WEEK)
   ```bash
   app/vendor/storefront/page.tsx
   ```

### Questions to Answer:

1. Which pages are absolutely required for cannabis compliance in your target states?
2. What lab result data needs to be displayed?
3. What customization freedom do vendors get vs locked compliance?
4. Do vendors need approval for content changes or just products?

---

**You have the infrastructure. Now we build the compliant, customizable template system on top of it!** 🚀

