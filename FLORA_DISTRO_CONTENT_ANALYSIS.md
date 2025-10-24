# Flora Distro Content Analysis - Complete Template Documentation

## 📄 All Pages Analyzed

### Pages Present:
1. ✅ Home (`/storefront`)
2. ✅ Shop (`/storefront/shop`)
3. ✅ About (`/storefront/about`)
4. ✅ Contact (`/storefront/contact`)
5. ✅ Product Detail (dynamic)
6. ✅ FAQ (`/storefront/faq`)
7. ✅ Lab Results (`/storefront/lab-results`)
8. ✅ Shipping (`/storefront/shipping`)
9. ✅ Returns (`/storefront/returns`)
10. ✅ Privacy (`/storefront/privacy`)
11. ✅ Terms (`/storefront/terms`)
12. ✅ Cookies (`/storefront/cookies`)

---

## 🏠 HOME PAGE - Complete Section Breakdown

### Section 1: HERO (Above Fold)
**Content Fields:**
- `hero_headline`: "Fresh. Fast. Fire."
- `hero_subheadline`: "Same day shipping before 2PM. Regional delivery hits next day."
- `hero_cta_primary_text`: "Shop now"
- `hero_cta_primary_link`: "/shop"
- `hero_cta_secondary_text`: "Our story"
- `hero_cta_secondary_link`: "/about"
- `hero_background_animation`: Custom wave/flower animation

**Template Variation:**
- Minimalist: Simple text, minimal animation
- Luxury: Parallax, serif fonts, elegant
- Bold: Large text, vibrant colors
- Organic: Natural imagery, soft transitions

---

### Section 2: PROCESS TIMELINE (How It Works)
**Content Fields:**
- `process_headline`: "Order before 2PM. Delivered same day."
- `process_subheadline`: "Farm to your door."

**Process Steps (Array):**
```json
[
  {
    "icon": "leaf",
    "title": "Cultivated",
    "description": "Small-batch grows. Sustainable practices. Every plant receives individual attention."
  },
  {
    "icon": "flask",
    "title": "Tested",
    "description": "Third-party lab testing. Complete transparency. No compromises on safety."
  },
  {
    "icon": "package",
    "title": "Packed",
    "description": "Sealed for freshness. Discreet packaging. Your privacy matters."
  },
  {
    "icon": "truck",
    "title": "Delivered",
    "description": "Fast shipping. Same-day before 2PM. Regional next-day delivery."
  }
]
```

**Template Variation:**
- Minimalist: Horizontal icons + text
- Luxury: Vertical timeline with animations
- Bold: Large icons, vibrant highlights
- Organic: Natural flow diagram

---

### Section 3: LOCATIONS (Store Finder)
**Content Fields:**
- `locations_headline`: "Visit us in person"
- `locations_subheadline`: "5 locations across North Carolina"

**Locations (from database - not hardcoded):**
- Pulled from `vendor_locations` table
- Each location shows:
  - Name
  - Address
  - Phone
  - Hours
  - Services (Pickup/Delivery badges)
  - "Get directions" link

**Template Variation:**
- Minimalist: Grid layout, minimal cards
- Luxury: Large cards with photos
- Bold: Map view + cards
- Organic: Circular location markers

---

### Section 4: FEATURED PRODUCTS
**Content Fields:**
- `featured_products_headline`: "Featured"
- `featured_products_count`: 12 (or custom)
- `featured_products_cta`: "View all"

**Products (from database - not hardcoded):**
- Pulled from `products` table WHERE vendor_id
- Shows:
  - Product image
  - Product name
  - Stock status
  - Effects, Lineage, Nose, Type, Terpenes (from blueprint fields)
  - Pricing tiers

**Template Variation:**
- Minimalist: Clean grid, 3-4 columns
- Luxury: Large product images, masonry layout
- Bold: Colorful overlays, dynamic grid
- Organic: Rounded cards, natural spacing

---

### Section 5: REVIEWS/TESTIMONIALS
**Content Fields:**
- `reviews_headline`: "Reviews"
- `reviews_count`: "6 reviews" (dynamic from database)

**Reviews (from database):**
- Pulled from `reviews` table WHERE vendor_id
- Each review shows:
  - Star rating (5 stars)
  - Quote/review text
  - Customer name
  - Product purchased
  - Verified purchase badge

**Sample Reviews:**
```json
[
  {
    "rating": 5,
    "quote": "Clean, consistent, reliable. Everything I look for in a cannabis brand. Great product selection and helpful staff.",
    "customer_name": "David K.",
    "product": "Grease Monkey"
  },
  {
    "rating": 5,
    "quote": "Great selection, friendly staff. Not sure why others complain about the price as it is not any higher than the competition. Everything I have purchased here has been excellent!",
    "customer_name": "Sarah M.",
    "product": "GlueLatto"
  }
]
```

**Template Variation:**
- Minimalist: Simple cards, grid layout
- Luxury: Elegant quote blocks with serif fonts
- Bold: Large testimonials, colorful accents
- Organic: Soft cards, natural styling

---

### Section 6: ABOUT/BRAND STORY (Bottom)
**Content Fields:**
- `about_headline`: "Farm fresh. Hand selected. Never stale."
- `about_paragraphs`: Array of paragraphs
  - "We source nationwide from the best cultivators. Every strain hand-selected and curated."
  - "Direct from farm. No distributors. No compromise on quality."
  - "Five locations. Order online. Pick up same day."
- `about_cta_text`: "Learn more"
- `about_cta_link`: "/about"

**Template Variation:**
- Minimalist: Simple text block, centered
- Luxury: Split layout with image
- Bold: Large text, vibrant background
- Organic: Natural imagery, soft text

---

### Section 7: SHIPPING/DELIVERY BADGES
**Content Fields:**
```json
[
  {
    "icon": "truck",
    "title": "Same-day ship",
    "description": "Before 2PM. Ships today."
  },
  {
    "icon": "package",
    "title": "Pickup ready",
    "description": "Order online. Grab today."
  }
]
```

---

## 📖 ABOUT PAGE - Complete Content

### Section 1: PAGE HERO
**Content Fields:**
- `about_page_image`: Vendor logo/brand image
- `about_page_headline`: "We're the biggest"
- `about_page_subheadline`: "Because we deliver the freshest product. Period."

---

### Section 2: BRAND STORY
**Content Fields:**
- `about_story_intro`: "Sourced nationwide. Headquartered in Charlotte, NC."
- `about_story_paragraphs`: Array of paragraphs
  - "We built Flora Distro on one principle: if it's not the freshest, we don't carry it."
  - "While others warehouse product for months, we move inventory in days. Direct relationships with the best growers across the country. Small-batch drops. Never stale."
  - "Same-day shipping before 2PM. Next-day regional delivery. This isn't just logistics—it's our commitment to peak freshness."

---

### Section 3: DIFFERENTIATORS (Why Us)
**Content Fields:**
- `differentiators_headline`: "The difference"

**Differentiators Array:**
```json
[
  {
    "title": "Fastest turnover",
    "description": "Product moves in days. What you buy was harvested recently."
  },
  {
    "title": "Nationwide sourcing",
    "description": "Direct relationships with top cultivators. Hand-selected strains only."
  },
  {
    "title": "Lab tested",
    "description": "Third-party testing on everything. Full transparency."
  },
  {
    "title": "Charlotte HQ",
    "description": "Five retail locations. Ship nationwide (where legal)."
  }
]
```

---

### Section 4: STATS/ACHIEVEMENTS
**Content Fields:**
```json
[
  {
    "number": "0", // or "5"
    "label": "Retail Locations"
  },
  {
    "number": "<48",
    "label": "Hour Delivery"
  },
  {
    "number": "0%", // or "100%"
    "label": "Lab Tested"
  },
  {
    "number": "NC",
    "label": "Headquarters"
  }
]
```

---

### Section 5: BOTTOM CTA
**Content Fields:**
- `about_cta_headline`: "Freshness isn't a feature. It's the standard."
- `about_cta_description`: "Experience the difference."
- `about_cta_button_text`: "Shop Now"
- `about_cta_button_link`: "/shop"

---

## 🛍️ SHOP PAGE - Content Elements

### Section 1: FILTERS/CATEGORIES
**Content (Database-Driven):**
- Categories from vendor's products
- Price filters (from pricing tiers)
- Strain type filters (Indica, Sativa, Hybrid)
- Effects filters
- Terpene filters

---

### Section 2: PRODUCT GRID
**Content (Database-Driven):**
- All products from vendor
- Each shows:
  - Image
  - Name
  - Stock status
  - Blueprint fields (Effects, Lineage, Nose, Type, Terpenes)
  - Pricing tiers
  - Add to cart/wishlist

---

## 📞 CONTACT PAGE - Content Elements

**Content Fields:**
- `contact_headline`: Custom or "Get in Touch"
- `contact_subheadline`: Custom description
- `contact_email`: vendor.contact_email
- `contact_phone`: vendor.phone
- `contact_hours`: "Open Daily 9AM - 9PM" (custom)
- `contact_locations`: From database
- `contact_form_enabled`: boolean
- `contact_social_links`: From vendor.social_links

---

## ❓ FAQ PAGE - Content Elements

**Content Fields:**
- `faq_headline`: "Frequently Asked Questions"
- `faq_items`: Array of Q&A

**Default FAQs (Cannabis-Specific):**
```json
[
  {
    "question": "Is this legal?",
    "answer": "Yes! All products contain less than 0.3% Delta-9 THC and comply with the 2018 Farm Bill."
  },
  {
    "question": "How do I know the quality?",
    "answer": "Every product is third-party lab tested. COAs are available for all products."
  },
  {
    "question": "What's your shipping policy?",
    "answer": "Orders before 2PM ship same day. Regional delivery arrives next day."
  },
  {
    "question": "Can I return products?",
    "answer": "Unopened products can be returned within 30 days."
  },
  {
    "question": "Do you ship to my state?",
    "answer": "We ship to most states. See shipping page for restrictions."
  }
]
```

---

## 🧪 LAB RESULTS PAGE

**Content Fields:**
- `lab_results_headline`: "Lab Testing & Compliance"
- `lab_results_description`: "Every product third-party tested"
- `lab_results_coa_enabled`: boolean (show COAs)

---

## 🚚 SHIPPING PAGE

**Content Fields:**
- `shipping_headline`: "Shipping & Delivery"
- `shipping_methods`: Array
- `shipping_restrictions`: Text
- `shipping_policy`: Custom text

---

## 🔁 RETURNS PAGE

**Content Fields:**
- `returns_headline`: "Returns & Refunds"
- `returns_policy`: Custom text
- `returns_timeframe`: "30 days"
- `returns_conditions`: Array of conditions

---

## 📜 LEGAL PAGES (Privacy, Terms, Cookies)

**Content Fields:**
- Generated from templates
- Company name inserted dynamically
- Contact info inserted dynamically
- Can be customized per vendor

---

## 🎯 FOOTER (Global)

### Section 1: NAVIGATION
**Content (Hardcoded Navigation + Database):**
- Company links (About, Contact)
- Shop links (All Products, Categories)
- Support links (Shipping, Returns, FAQ, Lab Results)
- Legal links (Privacy, Terms, Cookies)

### Section 2: COMPLIANCE
**Content Fields:**
- `compliance_text`: "All products contain less than 0.3% hemp-derived Delta-9 THC in compliance with the 2018 Farm Bill."
- `restricted_states`: "Products are not available for shipment to: Arkansas, Hawaii, Idaho, Kansas, Louisiana, Oklahoma, Oregon, Rhode Island, Utah, Vermont."

### Section 3: COPYRIGHT
**Content Fields:**
- `copyright_text`: "© 2025 {vendor.store_name}. All rights reserved."
- `powered_by_visible`: boolean
- `powered_by_text`: "Powered by Yacht Club"

---

## 📊 CONTENT SCHEMA SUMMARY

### Total Content Sections: 15+

**Homepage Sections (7):**
1. Hero
2. Process Timeline (How It Works)
3. Locations
4. Featured Products
5. Reviews
6. About/Story
7. Shipping Badges

**Page-Specific Content:**
8. About Page Story
9. About Page Differentiators
10. About Page Stats
11. Contact Page Info
12. FAQ Items
13. Lab Results Content
14. Shipping Policy
15. Returns Policy

**Global Elements:**
- Header (logo, navigation)
- Footer (navigation, compliance, copyright)
- Compliance disclaimers
- Trust badges

---

## 🗄️ DATABASE SCHEMA DESIGN

### Table: `vendor_storefront_sections`

```sql
CREATE TABLE vendor_storefront_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL, -- 'home', 'about', 'contact', 'faq', etc.
  section_key TEXT NOT NULL, -- 'hero', 'process', 'locations', etc.
  section_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  content_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, page_type, section_key)
);

CREATE INDEX idx_vendor_sections ON vendor_storefront_sections(vendor_id, page_type);
```

### Example Content Data (JSONB):

**Hero Section:**
```json
{
  "headline": "Fresh. Fast. Fire.",
  "subheadline": "Same day shipping before 2PM. Regional delivery hits next day.",
  "cta_primary": {
    "text": "Shop now",
    "link": "/shop"
  },
  "cta_secondary": {
    "text": "Our story",
    "link": "/about"
  },
  "background_type": "animation" // or "image", "video"
}
```

**Process Timeline Section:**
```json
{
  "headline": "Order before 2PM. Delivered same day.",
  "subheadline": "Farm to your door.",
  "steps": [
    {
      "icon": "leaf",
      "title": "Cultivated",
      "description": "Small-batch grows. Sustainable practices."
    },
    {
      "icon": "flask",
      "title": "Tested",
      "description": "Third-party lab testing. Complete transparency."
    },
    {
      "icon": "package",
      "title": "Packed",
      "description": "Sealed for freshness. Discreet packaging."
    },
    {
      "icon": "truck",
      "title": "Delivered",
      "description": "Fast shipping. Same-day before 2PM."
    }
  ]
}
```

**About Story Section:**
```json
{
  "headline": "We're the biggest",
  "subheadline": "Because we deliver the freshest product. Period.",
  "intro": "Sourced nationwide. Headquartered in Charlotte, NC.",
  "paragraphs": [
    "We built Flora Distro on one principle: if it's not the freshest, we don't carry it.",
    "While others warehouse product for months, we move inventory in days. Direct relationships with the best growers across the country. Small-batch drops. Never stale.",
    "Same-day shipping before 2PM. Next-day regional delivery. This isn't just logistics—it's our commitment to peak freshness."
  ]
}
```

**Differentiators Section:**
```json
{
  "headline": "The difference",
  "items": [
    {
      "title": "Fastest turnover",
      "description": "Product moves in days. What you buy was harvested recently."
    },
    {
      "title": "Nationwide sourcing",
      "description": "Direct relationships with top cultivators. Hand-selected strains only."
    },
    {
      "title": "Lab tested",
      "description": "Third-party testing on everything. Full transparency."
    },
    {
      "title": "Charlotte HQ",
      "description": "Five retail locations. Ship nationwide (where legal)."
    }
  ]
}
```

**Stats Section:**
```json
{
  "stats": [
    { "number": "5", "label": "Retail Locations" },
    { "number": "<48", "label": "Hour Delivery" },
    { "number": "100%", "label": "Lab Tested" },
    { "number": "NC", "label": "Headquarters" }
  ]
}
```

**Reviews Section:**
```json
{
  "headline": "Reviews",
  "show_count": true,
  "max_display": 6,
  "layout": "carousel" // or "grid"
}
// Actual reviews from database
```

**FAQ Section:**
```json
{
  "headline": "Frequently Asked Questions",
  "items": [
    {
      "question": "Is this legal?",
      "answer": "Yes! All products contain less than 0.3% Delta-9 THC..."
    },
    {
      "question": "How do I know the quality?",
      "answer": "Every product is third-party lab tested..."
    }
  ]
}
```

---

## 🎨 HOW REBRANDING WORKS

### Scenario: "Canna Boyz" uses Flora Distro content

**Step 1: Copy Default Content Structure**
```sql
INSERT INTO vendor_storefront_sections (vendor_id, page_type, section_key, content_data)
SELECT 
  'cannaboyz-vendor-id',
  page_type,
  section_key,
  content_data
FROM vendor_storefront_sections
WHERE vendor_id = 'flora-distro-id'; -- Copy Flora Distro's structure
```

**Step 2: AI Reword for Brand**
```
Hero headline: "Fresh. Fast. Fire."
  ↓ AI rewrites for "Canna Boyz"
  ↓
"West Coast Vibes. Straight Fire."

About headline: "We're the biggest"
  ↓ AI rewrites
  ↓
"We're the realest"

Process steps: Keep same structure, rephrase descriptions
```

**Step 3: Vendor Edits**
- Change specific text
- Upload their images
- Adjust stats to match their business

**Step 4: Template Selection**
- Flora Distro uses "Minimalist"
- Canna Boyz selects "Bold"
- Same content, different visual presentation!

---

## 🔧 CONTENT MANAGEMENT UI DESIGN

### Dashboard: `/vendor/content-manager`

**Tabs:**
1. Home Page
2. About Page
3. Contact Page
4. FAQ
5. Legal Pages
6. Global Settings

**For Each Section:**
```
┌─────────────────────────────────────┐
│ Hero Section                    [✓] │ <- Toggle enabled/disabled
├─────────────────────────────────────┤
│ Headline                            │
│ [Fresh. Fast. Fire._________]       │
│                                     │
│ Subheadline                         │
│ [Same day shipping before 2PM...] │
│                                     │
│ Primary Button                      │
│ Text: [Shop now____]                │
│ Link: [/shop_______]                │
│                                     │
│ Secondary Button                    │
│ Text: [Our story___]                │
│ Link: [/about______]                │
│                                     │
│ [Preview Changes] [Save] [AI Reword]│
└─────────────────────────────────────┘
```

**AI Reword Button:**
- Analyzes vendor.store_name, vendor.store_description
- Maintains structure, changes wording
- Shows preview before applying
- Vendor can edit AI output

---

## 🚀 IMPLEMENTATION STRATEGY

### Phase 1: Database & Migration
1. Create `vendor_storefront_sections` table
2. Extract Flora Distro's content from current components
3. Insert into database as "default" template content
4. Link to Flora Distro vendor

### Phase 2: Content Consumer Components
1. Create generic section renderers
2. Each reads from database instead of hardcoded
3. Template-agnostic (works with any template)
4. Props: sectionData (from JSONB)

### Phase 3: Update Templates
1. Replace hardcoded content with content consumers
2. Templates only define HOW content renders
3. Content comes from database

### Phase 4: Content Editor UI
1. Build dashboard pages
2. Form builder for each section type
3. Save to database
4. Preview mode

### Phase 5: AI Integration
1. Copy default content for new vendors
2. AI reword based on brand
3. Allow vendor editing
4. Instant rebranding

---

## 📋 CONTENT FIELDS COMPLETE LIST

### Global/Header:
- logo_url (from vendors table)
- store_name (from vendors table)
- navigation_style (from template_config)

### Home Page:
- hero_headline
- hero_subheadline
- hero_cta_primary (text, link)
- hero_cta_secondary (text, link)
- process_headline
- process_subheadline
- process_steps (array)
- locations_headline
- locations_subheadline
- featured_products_headline
- featured_products_count
- reviews_headline
- about_headline
- about_paragraphs (array)
- shipping_badges (array)

### About Page:
- about_page_headline
- about_page_subheadline
- about_page_image
- about_story_intro
- about_story_paragraphs (array)
- differentiators_headline
- differentiators_items (array)
- stats (array)
- about_cta_headline
- about_cta_description
- about_cta_button (text, link)

### Contact Page:
- contact_headline
- contact_description
- contact_email
- contact_phone
- contact_hours
- contact_form_enabled
- contact_social_links

### FAQ Page:
- faq_headline
- faq_items (array of Q&A)

### Footer:
- compliance_text
- restricted_states_text
- copyright_text
- powered_by_visible
- social_media_links

---

## ✅ NEXT STEPS

This analysis provides the complete blueprint for:
1. Database schema (exact fields needed)
2. Content sections (all 15+)
3. Rebranding strategy (AI + manual editing)
4. Template switching (content persists)
5. Content editor UI (what forms to build)

**Total Content Fields: 50+**
**Total Sections: 15+**
**Template-Agnostic: 100%**
**Reusable: 100%**

This is everything needed to build the complete content-driven template system!

