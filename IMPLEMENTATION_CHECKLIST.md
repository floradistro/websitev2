# ✅ Implementation Checklist: Cost Tracking & Dual Units

## Database Migration

- [ ] **Run migration file**
  ```bash
  # Connect to Supabase
  cd /Users/whale/Desktop/Website
  
  # Apply migration (or use Supabase dashboard)
  psql -h your-supabase-db.supabase.co -U postgres -d postgres \
    -f supabase/migrations/20251024_cost_tracking_and_dual_units.sql
  ```

## Vendor Product Form Updates

### Files to Update:

1. **`app/vendor/products/new/page.tsx`**
   - [ ] Add `cost_price` field to form
   - [ ] Add real-time margin calculator
   - [ ] Add pricing context selector (retail/wholesale/both)
   - [ ] Show profit per unit display

2. **`app/vendor/products/[id]/edit/page.tsx`**
   - [ ] Add `cost_price` field to edit form
   - [ ] Show margin changes when updating prices
   - [ ] Log cost changes to audit trail

3. **`app/vendor/pricing/page.tsx`**
   - [ ] Display retail vs wholesale blueprints separately
   - [ ] Add unit preference selector
   - [ ] Show converted amounts in both units

## API Updates

- [ ] **`app/api/vendor/products/route.ts`**
  - Add `cost_price` to product creation
  - Validate cost_price is not exposed to non-vendors
  
- [ ] **`app/api/wholesale/products/route.ts`**
  - Display quantities in pounds for wholesale context
  - Convert gram-based prices to pound display

## Admin Panel

- [ ] **Create Pricing Blueprints**
  - Retail (gram-based) blueprint
  - Wholesale (pound-based) blueprint
  - Concentrate blueprints
  
- [ ] **Vendor Settings Page**
  - Add toggle for cost tracking
  - Add unit preference dropdowns
  - Show inventory value calculations

## UI Components

- [ ] **Profit Margin Widget** (Vendor Dashboard)
  ```tsx
  <ProfitMarginSummary 
    avgMargin={42.5}
    inventoryValue={125000}
    potentialProfit={75000}
  />
  ```

- [ ] **Cost Input Field Component**
  ```tsx
  <CostPriceInput 
    value={costPrice}
    onChange={setCostPrice}
    showMargin={true}
    retailPrice={retailPrice}
  />
  ```

- [ ] **Unit Display Component**
  ```tsx
  <UnitDisplay 
    grams={453.6}
    context="wholesale"  // Shows "1 lb"
  />
  
  <UnitDisplay 
    grams={28}
    context="retail"  // Shows "28g (1 oz)"
  />
  ```

## Testing

- [ ] **Cost Tracking**
  - [ ] Vendor can add cost to product
  - [ ] Margin calculates correctly
  - [ ] Cost is hidden from customers
  - [ ] Cost changes are logged
  - [ ] Other vendors cannot see costs

- [ ] **Dual Units**
  - [ ] Retail products show grams
  - [ ] Wholesale products show pounds
  - [ ] Conversions are accurate
  - [ ] Both units can coexist on same product

- [ ] **Pricing Blueprints**
  - [ ] Retail blueprint creates gram tiers
  - [ ] Wholesale blueprint creates pound tiers
  - [ ] Vendors can assign blueprints
  - [ ] Products inherit pricing correctly

## Documentation

- [ ] **Vendor Help Guide**
  - How to track costs
  - Understanding profit margins
  - Using dual unit pricing
  
- [ ] **Admin Guide**
  - Creating pricing blueprints
  - Managing vendor cost permissions
  - Running profit reports

## Rollout Plan

1. **Phase 1: Database** (Day 1)
   - Run migration
   - Verify tables created
   - Test RLS policies

2. **Phase 2: Vendor Forms** (Day 2-3)
   - Update product creation form
   - Add cost tracking fields
   - Implement margin calculator

3. **Phase 3: Blueprints** (Day 4)
   - Create preset blueprints
   - Test with sample vendor
   - Adjust pricing templates

4. **Phase 4: Testing** (Day 5)
   - Full vendor workflow test
   - Security testing (cost privacy)
   - Unit conversion verification

5. **Phase 5: Launch** (Day 6)
   - Notify vendors of new feature
   - Provide training documentation
   - Monitor for issues

## Code Snippets for Quick Implementation

### Add Cost Price to Product Form

```tsx
// In app/vendor/products/new/page.tsx
const [formData, setFormData] = useState({
  name: '',
  price: '',
  cost_price: '',  // ← ADD THIS
  category: '',
  // ... other fields
});

// In the form JSX:
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Cost Price */}
  <div>
    <label className="block text-white/80 text-sm mb-2">
      Cost Price (Your Cost) 
      <span className="text-white/40 text-xs ml-2">🔒 Private</span>
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
      <input
        type="number"
        step="0.01"
        value={formData.cost_price}
        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
        placeholder="10.00"
        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded focus:outline-none focus:border-white/20"
      />
    </div>
    <p className="text-white/40 text-xs mt-1">
      Your cost per unit (not visible to customers)
    </p>
  </div>

  {/* Retail Price */}
  <div>
    <label className="block text-white/80 text-sm mb-2">
      Retail Price <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
      <input
        type="number"
        step="0.01"
        required
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
        placeholder="15.00"
        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded focus:outline-none focus:border-white/20"
      />
    </div>
    
    {/* Show margin if both values exist */}
    {formData.cost_price && formData.price && (
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className={`font-medium ${getMarginColor(calculateMargin(formData.cost_price, formData.price))}`}>
          Margin: {calculateMargin(formData.cost_price, formData.price)}%
        </span>
        <span className="text-white/40">|</span>
        <span className="text-green-400">
          Profit: ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}/unit
        </span>
      </div>
    )}
  </div>
</div>

// Helper functions:
function calculateMargin(cost: string, price: string): string {
  const c = parseFloat(cost);
  const p = parseFloat(price);
  if (c > 0 && p > 0) {
    return ((p - c) / p * 100).toFixed(1);
  }
  return '0';
}

function getMarginColor(margin: string): string {
  const m = parseFloat(margin);
  if (m >= 40) return 'text-green-400';
  if (m >= 25) return 'text-yellow-400';
  return 'text-red-400';
}
```

### Update API to Accept Cost Price

```typescript
// In app/api/vendor/products/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const productData = {
    name: body.name,
    price: body.price,
    cost_price: body.cost_price,  // ← ADD THIS
    vendor_id: vendorId,
    // ... other fields
  };
  
  // Insert product
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();
    
  // ...
}
```

## Priority Order

**HIGH PRIORITY:**
1. ✅ Database migration
2. ✅ Cost price field in product form
3. ✅ Margin calculation display

**MEDIUM PRIORITY:**
4. Pricing blueprint creation (admin)
5. Unit display conversion
6. Wholesale product listing with pound display

**LOW PRIORITY:**
7. Profit analytics dashboard
8. Cost history audit log UI
9. Bulk cost update tools

---

## Quick Start (30 minutes)

1. **Run migration** (5 min)
2. **Update product form** (15 min)
3. **Test with one product** (10 min)

Done! You now have cost tracking working.

The dual unit system can be added incrementally as you create pricing blueprints.


