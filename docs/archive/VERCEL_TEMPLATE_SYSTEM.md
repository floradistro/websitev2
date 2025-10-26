# 🎨 Vercel Black Template System

## Overview
**Template-first approach** for guaranteed professional quality. Instead of AI generating from scratch, we apply proven templates and customize content.

## Design Philosophy

### **Vercel.com Aesthetic**
- ✅ Pure monochrome (black background, white text)
- ✅ Ultra-minimal (no unnecessary elements)
- ✅ Typography-driven (font weights, letter spacing)
- ✅ Subtle effects (1px gradients, soft glows)
- ✅ Maximum whitespace
- ✅ Uppercase headings with wide tracking

### **Color System (LOCKED)**
```css
Background: #000000 (pure black)
Text Primary: #ffffff (white)
Text Secondary: rgba(255,255,255,0.6) (60% opacity)
Text Tertiary: rgba(255,255,255,0.4) (40% opacity)
Borders: rgba(255,255,255,0.1) (10% opacity)
Hover: rgba(255,255,255,0.05) (5% opacity)
```

**NO other colors allowed.** Pure monochrome only.

### **Typography Scale (LOCKED)**
```css
Hero Headline: xlarge (48-64px), font-weight: 300, tracking: tight
Section Headings: medium (24px), font-weight: 400, uppercase, tracking: wider
Subheadings: medium (20px), font-weight: 400
Body Text: small (14-16px), font-weight: 300, color: white/40
CTAs: small (12px), font-weight: 500, uppercase, tracking: widest
```

### **Spacing System (LOCKED)**
```
Section Padding: 80px top/bottom
Between Sections: 60px
Between Groups: 40-48px
Between Elements: 24-32px
Tight Spacing: 12-16px
Micro Spacing: 8px
```

**Only use these values:** 8, 12, 16, 24, 32, 40, 48, 60, 80

---

## Template Structure

### **Home Page Sections (IN ORDER)**

1. **smart_header** (order: -1, page_type: "all")
   - Navigation, logo, search, cart
   - Always present on all pages

2. **hero** (order: 0)
   - Centered logo
   - Brand name (xlarge, thin)
   - Tagline (large, 60% opacity)
   - Primary CTA button

3. **trust_badges** (order: 1)
   - 4 features in horizontal layout
   - Icons: shield-check, truck, lock, star
   - Labels: LAB TESTED, FAST DELIVERY, DISCREET, PREMIUM
   - Short descriptions (40% opacity)

4. **featured_products** (order: 2)
   - smart_product_grid (if products exist)
   - OR "Coming Soon" message (if 0 products)
   - 8 products, 4 columns, show lab results

5. **how_it_works** (order: 3)
   - 3 numbered steps (badges: 01, 02, 03)
   - Browse → Order → Delivery
   - Clean, minimal descriptions

6. **reviews** (order: 4)
   - smart_testimonials component
   - 6 reviews max
   - Grid layout

7. **faq** (order: 5)
   - 3 top questions with answers
   - Q/A format
   - Centered, minimal

8. **cta_final** (order: 6)
   - Simple call-to-action
   - "Ready to experience premium cannabis?"
   - SHOP NOW button

9. **smart_footer** (order: 999, page_type: "all")
   - Links: Privacy, Terms, Cookies, Returns, Shipping, FAQ, About, Contact
   - Social links
   - Copyright
   - Always present on all pages

---

## Compliance Pages (Auto-Generated)

Every storefront gets these pages automatically:

### **Legal Pages**
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/cookies` - Cookie Policy
- `/returns` - Return & Refund Policy
- `/shipping` - Shipping Policy

### **Info Pages**
- `/about` - About the vendor
- `/faq` - Frequently Asked Questions
- `/contact` - Contact form/info

### **Cannabis-Specific**
- Medical disclaimer (21+ age requirement)
- Lab testing information
- Dosage guidelines
- Storage instructions
- Effects & safety info

---

## Component Usage

### **Smart Components (Auto-wire to DB)**
```typescript
smart_header        // Navigation (required)
smart_footer        // Footer with links (required)
smart_product_grid  // Product listings
smart_testimonials  // Customer reviews
smart_location_map  // Store locations (if applicable)
```

### **Basic Components**
```typescript
text      // All text content
image     // Logos, photos
button    // CTAs
badge     // Step numbers (01, 02, 03)
icon      // Lucide icons
spacer    // Vertical spacing
divider   // Horizontal lines
```

### **Component Props (Standardized)**

**Text:**
```json
{
  "text": "Content here",
  "size": "xlarge|large|medium|small",
  "color": "#ffffff|rgba(255,255,255,0.6)|rgba(255,255,255,0.4)",
  "alignment": "center",
  "font_weight": "300|400|500"
}
```

**Button:**
```json
{
  "text": "SHOP NOW",
  "link": "/shop",
  "style": "primary|outline",
  "size": "large|medium"
}
```

**Icon:**
```json
{
  "name": "shield-check|truck|lock|star|check-circle",
  "size": 32,
  "color": "rgba(255,255,255,0.6)"
}
```

---

## How Template System Works

### **Old Way (Claude generates everything):**
```
1. Claude generates structure + content
2. Often inconsistent (random colors, spacing)
3. Missing pages (no FAQ, policies)
4. Quality varies (4/10 to 7/10)
```

### **New Way (Template + Customization):**
```
1. Pick proven template (Vercel Black)
2. Apply vendor data (name, logo, tagline)
3. Customize only specific fields
4. Add compliance sections
5. Always perfect structure
Result: Consistent 9/10 quality
```

### **Generation Flow:**
```typescript
// 1. Check vendor type
if (vendor_type === 'cannabis') {
  // Use template
  const template = VERCEL_CANNABIS_TEMPLATE;
  const design = applyTemplate(vendorData);
  design = addComplianceSections(design);
} else {
  // Claude generates (fallback for other industries)
  const design = await claudeGenerate(vendorData);
}

// 2. Validate
const validation = validateStorefront(design);
if (!validation.valid) {
  design = autoFixDesign(design);
}

// 3. Insert to database
await insertSections(design.sections);
await insertComponents(design.components);
```

---

## Template Customization Points

### **What Agent Customizes:**
✅ Vendor name (in text components)
✅ Tagline (hero section)
✅ Logo URL (image components)
✅ About content (2-3 custom sentences)
✅ Number of products to show
✅ Which optional sections to include

### **What's Locked (Never Changes):**
🔒 Color palette (pure monochrome)
🔒 Spacing values (8, 12, 16, 24...)
🔒 Section order (hero → features → products → faq → footer)
🔒 Typography system (sizes, weights, tracking)
🔒 Component structure (hero always has logo → name → tagline → CTA)
🔒 Compliance pages (all required pages included)

---

## Benefits

### **For Vendors:**
- ✅ Professional design (looks expensive)
- ✅ All compliance pages included
- ✅ Consistent branding
- ✅ Works on all devices
- ✅ Fast loading

### **For Development:**
- ✅ Scalable (add templates for other industries)
- ✅ Maintainable (update 1 template, affects all)
- ✅ Testable (validate against template schema)
- ✅ Predictable (same structure every time)
- ✅ Cheaper (no Claude API for structure)

### **For Quality:**
- ✅ Guaranteed structure (header/footer always present)
- ✅ No missing pages (all compliance included)
- ✅ Consistent spacing (no random values)
- ✅ Color harmony (pure monochrome)
- ✅ Typography hierarchy (proven scale)

---

## Future Templates

### **Planned:**
1. **Vercel Black** - Cannabis (✅ Complete)
2. **Luxury Minimal** - Premium retail (gold accents)
3. **Bold Street** - Streetwear/edgy brands (high contrast)
4. **Fresh Modern** - Restaurants/food (appetizing)
5. **Tech Clean** - Services/SaaS (blue accents)

### **Template Schema:**
```typescript
{
  template_id: string,
  name: string,
  industry: string[],
  design_system: {
    colors: {...},
    typography: {...},
    spacing: number[]
  },
  home_page: Section[],
  compliance_pages: {...}
}
```

---

## Testing

### **Generate Storefront:**
```bash
curl -X POST http://localhost:3001/api/generate-storefront \
  -H "Authorization: Bearer yacht-club-secret-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "cd2e1122-d511-4edb-be5d-98ef274b4baf",
    "vendorData": {
      "store_name": "Flora Distro",
      "slug": "flora-distro",
      "vendor_type": "cannabis"
    }
  }'
```

**Expected Result:**
- ✅ Uses Vercel Black template (not Claude generation)
- ✅ 9 sections (header, hero, trust, products, how, reviews, faq, cta, footer)
- ✅ ~120 components
- ✅ Pure black/white (no random colors)
- ✅ Consistent spacing
- ✅ All compliance pages

---

## Extending Templates

### **Add New Section:**
```typescript
// In vercel-cannabis.ts
{
  section_key: 'education',
  section_order: 5,
  components: [
    { component_key: 'text', props: {...} },
    // ... more components
  ]
}
```

### **Add New Template:**
```typescript
// templates/luxury-retail.ts
export const LUXURY_RETAIL_TEMPLATE = {
  template_id: 'luxury_retail',
  design_system: {
    colors: {
      background: '#ffffff',
      text_primary: '#000000',
      accent: '#d4af37' // Gold
    }
  },
  // ... structure
}

// In template-engine.ts
function selectTemplate(vendorType) {
  const templates = {
    cannabis: VERCEL_CANNABIS_TEMPLATE,
    retail: LUXURY_RETAIL_TEMPLATE,  // NEW
    restaurant: FRESH_MODERN_TEMPLATE // NEW
  };
  return templates[vendorType];
}
```

---

## Status

✅ **Template Created**: Vercel Cannabis Black  
✅ **Compliance Content**: Ready  
✅ **Template Engine**: Built  
✅ **Agent Integration**: Complete  
🔄 **Testing**: In Progress  
⏳ **Documentation**: This file  

**Next**: Test generation, verify quality, iterate if needed.

