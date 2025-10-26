# Blueprint Fields System - Visual Guide

## 🎯 The Complete Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           YACHT CLUB PLATFORM                            │
│                        Blueprint Fields System                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: ADMIN CONTROL                                                  │
│  Platform defines field standards                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  📋 field_groups                                                         │
│  ┌───────────────────────────────────────────────┐                      │
│  │  Name: "Cannabis Flower"                       │                      │
│  │  Scope: required_category                      │                      │
│  │  Fields:                                       │                      │
│  │    • THC Percentage (number, required)         │                      │
│  │    • CBD Percentage (number, required)         │                      │
│  │    • Strain Type (select, required)            │                      │
│  │    • Genetics (text, optional)                 │                      │
│  └───────────────────────────────────────────────┘                      │
│                                                                           │
│  🔗 category_field_groups (Assignments)                                  │
│  ┌───────────────────────────────────────────────┐                      │
│  │  Category: "Flower"                            │                      │
│  │  Field Group: "Cannabis Flower"                │                      │
│  │  Is Required: ✓ YES                            │                      │
│  └───────────────────────────────────────────────┘                      │
│                                                                           │
│  Result: All flower products MUST have these fields                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: VENDOR CUSTOMIZATION                                           │
│  Vendors add their own product fields                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  🌱 vendor_product_fields (NEW!)                                         │
│  ┌───────────────────────────────────────────────┐                      │
│  │  Vendor: "Flora Distro"                        │                      │
│  │  Field ID: "harvest_date"                      │                      │
│  │  Category: "Flower"                            │                      │
│  │  Definition:                                   │                      │
│  │    {                                           │                      │
│  │      "type": "date",                           │                      │
│  │      "label": "Harvest Date",                  │                      │
│  │      "required": false,                        │                      │
│  │      "description": "When batch harvested"     │                      │
│  │    }                                           │                      │
│  └───────────────────────────────────────────────┘                      │
│                                                                           │
│  ┌───────────────────────────────────────────────┐                      │
│  │  Vendor: "Flora Distro"                        │                      │
│  │  Field ID: "terpene_profile"                   │                      │
│  │  Category: NULL (all products)                 │                      │
│  │  Definition:                                   │                      │
│  │    {                                           │                      │
│  │      "type": "textarea",                       │                      │
│  │      "label": "Terpene Profile",               │                      │
│  │      "required": false,                        │                      │
│  │      "placeholder": "e.g., Myrcene, Limonene"  │                      │
│  │    }                                           │                      │
│  └───────────────────────────────────────────────┘                      │
│                                                                           │
│  📄 vendor_custom_fields (EXISTING - for storefront)                     │
│  └─ Used for hero sections, page customization                           │
│  └─ NOT for product fields                                               │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: MERGED FIELDS                                                  │
│  System combines admin + vendor fields                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  🔄 get_product_fields(vendor_id, category_id)                           │
│                                                                           │
│  When Flora Distro edits a Flower product, they see:                     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  🔒 ADMIN REQUIRED FIELDS (Read-only structure)                │     │
│  │  ───────────────────────────────────────────────────────────   │     │
│  │  • THC Percentage * (from admin)                               │     │
│  │  • CBD Percentage * (from admin)                               │     │
│  │  • Strain Type * (from admin)                                  │     │
│  │  • Genetics (from admin, optional)                             │     │
│  │                                                                 │     │
│  │  ✏️  YOUR CUSTOM FIELDS (Editable)                             │     │
│  │  ───────────────────────────────────────────────────────────   │     │
│  │  • Harvest Date (your field, flower only)                      │     │
│  │  • Terpene Profile (your field, all products)                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: PRODUCT DATA                                                   │
│  Actual field values stored in products                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  📦 products.blueprint_fields (JSONB)                                    │
│  ┌───────────────────────────────────────────────┐                      │
│  │  Product: "Blue Dream"                         │                      │
│  │  {                                             │                      │
│  │    "thc_percentage": "24.5",                   │                      │
│  │    "cbd_percentage": "0.8",                    │                      │
│  │    "strain_type": "Hybrid",                    │                      │
│  │    "genetics": "Blueberry x Haze",             │                      │
│  │    "harvest_date": "2024-10-15",               │                      │
│  │    "terpene_profile": "Myrcene, Pinene"        │                      │
│  │  }                                             │                      │
│  └───────────────────────────────────────────────┘                      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎨 Vendor UI Flow

```
┌──────────────────────────────────────────────────────────────┐
│  /vendor/product-fields                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Product Fields                                               │
│  MANAGE CUSTOM PRODUCT ATTRIBUTES                             │
│                                                               │
│  Filter: [Flower ▼]                                           │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  🔒 REQUIRED FIELDS (ADMIN-DEFINED)                           │
│                                                               │
│  These fields are required by the platform admin.             │
│  You cannot edit or remove these fields.                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Cannabis Flower                    [Required]       │    │
│  │                                                       │    │
│  │  Standard fields for all flower products             │    │
│  │                                                       │    │
│  │  • THC Percentage (number) *         🔒              │    │
│  │  • CBD Percentage (number) *         🔒              │    │
│  │  • Strain Type (select) *            🔒              │    │
│  │  • Genetics (text)                   🔒              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ✏️  YOUR CUSTOM FIELDS                                       │
│                        [➕ Add Custom Field]                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Harvest Date                                        │    │
│  │  ID: harvest_date                                    │    │
│  │  Type: date                                          │    │
│  │  When this batch was harvested                       │    │
│  │                                      [✏️ Edit] [🗑️]   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Terpene Profile                                     │    │
│  │  ID: terpene_profile                                 │    │
│  │  Type: textarea                                      │    │
│  │  Dominant terpenes in this product                   │    │
│  │                                      [✏️ Edit] [🗑️]   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 🔑 Key Concepts

### Field Scope (Admin Control)

| Scope | Description | Usage |
|-------|-------------|-------|
| **required_global** | All vendors must use | Lab testing, compliance fields |
| **required_category** | Required for category | THC% for flower, battery info for vapes |
| **optional** | Vendors can choose | Additional product details |

### Field Ownership

| Owner | Can Edit | Can Delete | Scope |
|-------|----------|------------|-------|
| **Admin** | Yes (structure only) | Yes | Platform-wide or per-category |
| **Vendor** | Yes | Yes | Their products only |
| **Product** | No (uses definitions) | No | Stores actual values |

## 📊 Data Flow Example

### Scenario: Flora Distro adds a flower product

```
1. GET /api/vendor/product-fields?category_id=flower-uuid
   Headers: { x-vendor-id: flora-uuid }

   Response:
   {
     "adminFields": [
       {
         "name": "Cannabis Flower",
         "fields": [
           { "slug": "thc_percentage", "type": "number", "required": true },
           { "slug": "cbd_percentage", "type": "number", "required": true },
           { "slug": "strain_type", "type": "select", "required": true },
           { "slug": "genetics", "type": "text", "required": false }
         ],
         "isRequired": true,
         "source": "admin"
       }
     ],
     "vendorFields": [
       {
         "fieldId": "harvest_date",
         "definition": { "type": "date", "label": "Harvest Date" },
         "source": "vendor"
       },
       {
         "fieldId": "terpene_profile",
         "definition": { "type": "textarea", "label": "Terpene Profile" },
         "source": "vendor"
       }
     ],
     "merged": [
       /* All fields combined, ready to render */
     ]
   }

2. Vendor fills form with values

3. POST /api/vendor/products
   {
     "name": "Blue Dream",
     "category_id": "flower-uuid",
     "blueprint_fields": {
       "thc_percentage": "24.5",      // Admin required
       "cbd_percentage": "0.8",       // Admin required
       "strain_type": "Hybrid",       // Admin required
       "genetics": "Blueberry x Haze", // Admin optional
       "harvest_date": "2024-10-15",   // Vendor custom
       "terpene_profile": "Myrcene"    // Vendor custom
     }
   }

4. System validates:
   ✓ All admin required fields present
   ✓ Values match field types
   ✓ Product saved successfully
```

## 🚀 Migration Path

### What Changed

```diff
BEFORE (Confusing):
- field_groups existed but NO migration file
- vendor_custom_fields used for BOTH storefront AND products
- No way for vendors to add product fields
- Unclear what fields are required

AFTER (Clear):
+ field_groups has proper migration
+ field_groups has scope column (required_global/category/optional)
+ vendor_custom_fields = storefront/pages ONLY
+ vendor_product_fields = product attributes ONLY (NEW!)
+ Vendors can create/edit/delete product fields
+ Clear UI showing what's required vs custom
```

### Database State

```sql
-- All tables exist and tracked
✓ field_groups (with scope column)
✓ category_field_groups  
✓ vendor_product_fields (NEW!)
✓ vendor_custom_fields (existing, for storefront)
✓ field_component_bindings

-- All functions created
✓ get_product_fields(vendor_id, category_id)
✓ validate_product_fields(vendor_id, category_id, blueprint_fields)

-- All migrations in version control
✓ 20251026_create_field_groups.sql
✓ 20251026_create_category_field_groups.sql
✓ 20251026_vendor_product_fields.sql
✓ 20251026_field_merge_function.sql
```

## 💡 Usage Examples

### Admin: Create Required Fields

```typescript
// Admin creates "Cannabis Flower" field group
POST /api/admin/field-groups
{
  "name": "Cannabis Flower",
  "slug": "cannabis-flower",
  "scope": "required_category",
  "fields": [
    {
      "name": "THC Percentage",
      "slug": "thc_percentage",
      "type": "number",
      "required": true,
      "min": 0,
      "max": 100,
      "suffix": "%"
    },
    {
      "name": "Strain Type",
      "slug": "strain_type",
      "type": "select",
      "options": ["Sativa", "Indica", "Hybrid"],
      "required": true
    }
  ]
}

// Admin assigns to Flower category
POST /api/admin/field-groups/assignments
{
  "category_id": "flower-uuid",
  "field_group_id": "cannabis-flower-uuid",
  "is_required": true
}
```

### Vendor: Add Custom Field

```typescript
// Vendor adds "Harvest Date" field
POST /api/vendor/product-fields
Headers: { x-vendor-id: flora-uuid }
{
  "field_id": "harvest_date",
  "category_id": "flower-uuid",
  "field_definition": {
    "type": "date",
    "label": "Harvest Date",
    "required": false,
    "description": "When this batch was harvested"
  }
}
```

### Product Editor: Render Fields

```typescript
// Get merged fields for product form
const { merged } = await fetch(
  `/api/vendor/product-fields?category_id=${categoryId}`,
  { headers: { 'x-vendor-id': vendorId } }
).then(r => r.json());

// Render each field
merged.forEach(field => {
  <FieldInput
    field={field}
    value={product.blueprint_fields[field.slug]}
    onChange={(value) => updateField(field.slug, value)}
    readonly={field.source === 'admin'}
    required={field.required}
  />
});
```

## ✅ Success Criteria Met

- [x] **Vendors can add custom product fields** ✓
- [x] **Admins can define required fields** ✓  
- [x] **Clear separation: storefront ≠ product fields** ✓
- [x] **All tables have migrations** ✓
- [x] **Complete UI for field management** ✓
- [x] **API endpoints functional** ✓
- [x] **No breaking changes** ✓
- [x] **System is scalable** ✓

---

**The system now works exactly as you envisioned!** 🎉

Vendors have flexibility, admins have control, and everything is properly organized.

