# 🏗️ Component Architecture Explained

## Is Everything in Supabase?

### **What's In Supabase (Database):**

**1. Component Registry (Metadata)**
```sql
component_templates table:
- component_key: 'smart_product_grid'
- name: 'Smart Product Grid'
- description: 'Auto-fetches products...'
- category: 'smart'
- props_schema: {...}
```
This tells the system "smart_product_grid exists and what props it accepts"

**2. Component Instances (Content)**
```sql
vendor_component_instances table:
- vendor_id: 'flora-distro'
- component_key: 'smart_product_grid'
- props: { maxProducts: 100, columns: 4 }
- position_order: 42
```
This tells the system "Flora's shop page has a product grid at position 42 with these props"

**3. Sections (Structure)**
```sql
vendor_storefront_sections table:
- vendor_id: 'flora-distro'
- section_key: 'shop_hero'
- page_type: 'shop'
- section_order: 0
```
This tells the system "Flora's shop page has these sections in this order"

### **What's NOT in Supabase (Code):**

**React Components (The Actual Code)**
```typescript
// components/component-registry/smart/SmartProductGrid.tsx
export function SmartProductGrid({ vendorId, maxProducts, columns }) {
  const [products, setProducts] = useState([]);
  // ... fetch logic, rendering logic, etc
  return <ProductGrid products={products} />;
}
```

**This is HARDCODED React code** because:
- It has logic (fetch, filter, render)
- It imports other components
- It uses hooks (useState, useEffect)
- It's the "engine" that powers the component

### **How It Works Together:**

```
Database (Supabase):           Code (React Components):
┌─────────────────────┐        ┌──────────────────────────┐
│ component_templates │───────▶│ SmartProductGrid.tsx     │
│ - smart_product_grid│        │ - Fetch products         │
│ - props_schema      │        │ - Render grid            │
└─────────────────────┘        └──────────────────────────┘
         │                               ▲
         │                               │
         ▼                               │
┌─────────────────────┐                 │
│ vendor_component    │                 │
│ instances           │                 │
│ - props: {...}      │─────────────────┘
│ - position: 42      │     "Use SmartProductGrid
└─────────────────────┘      with these props"
```

### **Flow:**
1. **Agent generates** → Inserts into `vendor_component_instances`
2. **Page loads** → Queries database for vendor's components
3. **Renderer reads** → "Flora needs smart_product_grid at position 42"
4. **DynamicComponent** → Looks up `SmartProductGrid.tsx` from code
5. **Renders** → `<SmartProductGrid {...propsFromDatabase} />`

### **What CAN Be Customized (Database):**
✅ Which components to use  
✅ Component props (maxProducts, columns, colors, text)  
✅ Component order/position  
✅ Which pages have which sections  
✅ Text content  
✅ Images  
✅ Buttons  
✅ Spacing  

### **What CANNOT Be Customized (Hardcoded):**
❌ Component logic (how SmartProductGrid fetches products)  
❌ Component rendering (how ProductCard displays data)  
❌ Hover effects (defined in component CSS)  
❌ Animations (defined in component code)  
❌ Event handlers (onClick, onHover, etc)  

### **Why This Architecture?**

**Good:**
- Vendor can customize WHAT components to use (via dashboard)
- Vendor can customize props (colors, text, limits)
- We control HOW components work (consistent quality)
- No vendor can break the site (components are safe)
- Updates to components affect all vendors instantly

**Limitations:**
- Vendors can't add NEW types of components (only devs can)
- Vendors can't change component logic
- Vendors can't add custom CSS/animations

### **This is Industry Standard:**

**Shopify:**
- Themes are code (Liquid templates)
- Merchants customize via theme settings (database)
- Merchants can't edit theme code

**Webflow:**
- Components are code (React)
- Users customize via visual editor (database)
- Users can't edit component internals

**WordPress:**
- Blocks are code (PHP/JS)
- Users customize via block settings (database)
- Users can't edit block code

### **Our System:**
Same as above - **vendors customize settings, developers build components.**

---

## Summary

**In Database:** ✅ Component choices, props, content, structure  
**In Code:** ✅ Component logic, rendering, animations, interactions  

**ProductCard.tsx is hardcoded React** but vendors can:
- Choose to use it or not
- Set its props (showPrice, columns, etc)
- Position it anywhere
- Customize its text/images through props

**They cannot:**
- Change how it fetches data
- Modify hover animations
- Add new features to it
- Change its internal logic

**This is correct and safe architecture!** ✅

