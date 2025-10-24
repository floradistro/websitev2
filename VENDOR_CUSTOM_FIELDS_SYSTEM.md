# 🎨 Vendor Custom Fields System

## **The Power: Vendors Can Extend ANY Section**

---

## **How It Works:**

### **1. Admin Defines Base Schema**
```javascript
// In section_schemas table
{
  section_key: 'hero',
  fields: [
    { id: 'headline', type: 'text', label: 'Headline', required: true },
    { id: 'subheadline', type: 'text', label: 'Subheadline' },
    { id: 'cta_buttons', type: 'array', max_items: 2 }
  ]
}
```

**These are REQUIRED fields every vendor gets.**

---

### **2. Vendor Adds Custom Fields**
```javascript
// In vendor_custom_fields table
{
  vendor_id: 'zarati-uuid',
  section_key: 'hero',
  field_id: 'promotional_badge',
  field_definition: {
    type: 'text',
    label: 'Promotional Badge',
    placeholder: 'NEW! | SALE | 50% OFF',
    max_length: 20,
    helper_text: 'Shows in top-right corner of hero'
  }
}
```

**This field is ONLY for this vendor.**

---

### **3. System Merges Schemas**
```javascript
// When rendering editor for Zarati
const merged = await getMergedSchema('hero', 'zarati-uuid');

// Result:
{
  fields: [
    // Base fields (admin-defined)
    { id: 'headline', type: 'text', ... },
    { id: 'subheadline', type: 'text', ... },
    { id: 'cta_buttons', type: 'array', ... },
    
    // Vendor's custom fields
    { id: 'promotional_badge', type: 'text', ..., is_custom: true },
  ]
}
```

---

### **4. Editor Renders Dynamically**
```jsx
<SchemaBasedSectionEditor 
  schema={mergedSchema}
  values={sectionValues}
  onChange={handleChange}
/>

// Automatically shows:
// - Headline input (base)
// - Subheadline input (base)
// - CTA buttons array (base)
// - Promotional badge input (custom!) ⭐
```

---

### **5. Section Component Uses Custom Fields**
```jsx
// In HeroSection component
export function HeroSection({ content, vendor }) {
  return (
    <div>
      <h1>{content.headline}</h1>
      <p>{content.subheadline}</p>
      
      {/* Vendor's custom field */}
      {content.promotional_badge && (
        <div className="badge">{content.promotional_badge}</div>
      )}
      
      {/* Dynamically render ANY custom fields */}
      {Object.entries(content).map(([key, value]) => {
        if (key.startsWith('custom_')) {
          return <CustomFieldRenderer key={key} id={key} value={value} />;
        }
      })}
    </div>
  );
}
```

---

## **Use Cases:**

### **Scenario 1: Flora Distro Adds Lab Results Badge**
```javascript
// Flora Distro adds custom field
{
  field_id: 'lab_results_badge',
  field_definition: {
    type: 'boolean',
    label: 'Show Lab Results Badge',
    default: true,
    helper_text: 'Display "Lab Tested" badge on hero'
  }
}

// Now their hero editor shows:
// - Headline ✓
// - Subheadline ✓
// - CTA Buttons ✓
// - Lab Results Badge ✓ (CUSTOM - only Flora Distro has this)
```

### **Scenario 2: Zarati Adds Countdown Timer**
```javascript
{
  field_id: 'sale_countdown',
  field_definition: {
    type: 'datetime',
    label: 'Sale End Date',
    helper_text: 'Show countdown timer until this date'
  }
}

// Zarati's hero now has a countdown timer
// Other vendors don't have this field
```

### **Scenario 3: Vendor Adds Trust Icons**
```javascript
{
  field_id: 'trust_icons',
  field_definition: {
    type: 'array',
    label: 'Trust Icons',
    max_items: 5,
    item_schema: {
      icon: { type: 'icon_picker', label: 'Icon' },
      text: { type: 'text', label: 'Text' }
    }
  }
}

// Now they can add unlimited trust badges
// "Money Back Guarantee", "Free Shipping", "24/7 Support", etc.
```

---

## **Where Vendors Manage Custom Fields:**

### **Option 1: Fields Manager (Dashboard)**
```
/vendor/fields-manager

List of Custom Fields:
┌─────────────────────────────────────────────┐
│ Hero Section                                │
│ • Promotional Badge (text)         [Delete] │
│ • Sale Countdown (datetime)        [Delete] │
│                                              │
│ Footer Section                               │
│ • Custom Legal Text (textarea)     [Delete] │
│                                              │
│ [+ Add Custom Field]                        │
└─────────────────────────────────────────────┘
```

### **Option 2: Live Editor (In-Context)**
```
When editing a section:
┌─────────────────────────────────────────────┐
│ Edit Hero Section                           │
│                                              │
│ Headline: [Welcome to My Store]             │
│ Subheadline: [Premium products]             │
│                                              │
│ --- Custom Fields ---                       │
│ Promotional Badge: [NEW!]                   │
│                                              │
│ [+ Add Custom Field to This Section]        │
└─────────────────────────────────────────────┘
```

**Both options work simultaneously!**

---

## **API Endpoints:**

### **For Vendors:**
- `GET /api/vendor/custom-fields` - Get all my custom fields
- `POST /api/vendor/custom-fields` - Add a custom field
- `DELETE /api/vendor/custom-fields?id=xxx` - Remove a custom field

### **For System:**
- `getMergedSchema(sectionKey, vendorId)` - Get complete schema
- `validateSectionValues(values, schema)` - Validate against schema
- `applyStylePreset(values, preset)` - Apply design preset

---

## **Example Flow:**

### **Vendor Adds "Video Background URL" to Hero:**

**Step 1:** Vendor clicks "+ Add Custom Field" in live editor

**Step 2:** Form appears:
```
Field Name: video_background
Field Label: Video Background URL
Field Type: [URL ▼]
Placeholder: https://...
Required: [ ] No
Apply to: [Hero Section ▼]

[Cancel] [Add Field]
```

**Step 3:** System creates:
```sql
INSERT INTO vendor_custom_fields (
  vendor_id, section_key, field_id, field_definition
) VALUES (
  'vendor-uuid',
  'hero',
  'video_background',
  '{"type": "url", "label": "Video Background URL", "placeholder": "https://..."}'
);
```

**Step 4:** Editor instantly shows new field

**Step 5:** Vendor enters video URL

**Step 6:** Hero component renders video background

**Zero code changes. Zero deploys. Instant.**

---

## **Benefits:**

### **For Vendors:**
- ✅ Unlimited customization
- ✅ No waiting for platform updates
- ✅ Section works exactly how THEY want
- ✅ Easy to manage (add/remove anytime)

### **For Platform:**
- ✅ Vendors can't break other vendors
- ✅ Custom fields are isolated per vendor
- ✅ Base schema stays protected
- ✅ Infinite flexibility without code complexity

### **For AI (Future):**
- 🤖 AI can suggest custom fields based on industry
- 🤖 "Cannabis vendors need lab results badge" → Auto-creates field
- 🤖 Analyzes competitor sites → Suggests missing fields
- 🤖 "Add this to beat your competition"

---

## **Database Structure:**

```
section_schemas (Admin-Level, Global)
    ↓
    Defines base fields for 'hero', 'process', etc.
    Every vendor gets these

vendor_custom_fields (Vendor-Level, Per-Vendor)
    ↓
    Vendor-specific field extensions
    Only this vendor sees/uses these
    
vendor_storefront_sections (Instance-Level, Per-Section)
    ↓
    content_data: Values for base fields
    custom_fields: Values for vendor's custom fields
```

---

## **What This Means:**

**Shopify:**
- Want a new field? → Submit feature request → Wait 6 months → Maybe they add it

**Us:**
- Want a new field? → Click button → Define it → Use it immediately

**That's the unfair advantage.** 🚀

