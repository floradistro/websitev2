# TV Menu + Inventory Integration - Implementation Status

**Date:** October 28, 2025
**Status:** Phase 1 Complete, Phases 2-4 Ready for Implementation

---

## ✅ COMPLETED

### Phase 1: Database Schema ✅
**File:** `/supabase/migrations/20251028_tv_menu_inventory_integration.sql`

**Created:**
- ✅ Enhanced `tv_menus` table with 12 new inventory sync columns
- ✅ Created `tv_menu_product_rules` table for filtering logic
- ✅ Created `tv_menu_inventory_cache` table for fast lookups
- ✅ Helper functions: `is_product_new()`, `is_low_stock()`, `refresh_tv_menu_inventory_cache()`, `cleanup_expired_tv_menu_cache()`
- ✅ RLS policies for security
- ✅ Indexes for performance

**To Deploy:**
Run the migration via Supabase dashboard SQL editor or:
```bash
psql $DATABASE_URL -f supabase/migrations/20251028_tv_menu_inventory_integration.sql
```

---

## 📦 READY TO IMPLEMENT

### Phase 2: Backend APIs

#### API 1: Enhanced TV Menu Data Endpoint
**File to create:** `/app/api/tv-menu/data/route.ts`

**Purpose:** Returns products with real-time inventory for TV display

**Key Features:**
- Fetches products with inventory data
- Applies menu rules (hide out-of-stock, low stock threshold)
- Enhances products with display badges (NEW, LOW STOCK, SALE)
- Sorts products by configured method
- Updates cache
- Returns stats

**Endpoint:** `GET /api/tv-menu/data?menu_id=XXX&location_id=YYY`

**Response:**
```json
{
  "success": true,
  "menu": {
    "id": "uuid",
    "name": "Main Menu",
    "config": {...},
    "last_sync": "2025-10-28T..."
  },
  "products": [
    {
      "id": "uuid",
      "name": "Blue Dream",
      "display_badges": {
        "isNew": false,
        "isLowStock": true,
        "isOnSale": false,
        "stockCount": 5
      },
      "display_price": 35.00,
      "inventory": {
        "available_quantity": 5,
        "stock_status": "low_stock"
      }
    }
  ],
  "stats": {
    "total_products": 45,
    "low_stock_count": 3,
    "on_sale_count": 7
  }
}
```

**Implementation Code:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menu_id');
    const locationId = searchParams.get('location_id');

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'Menu ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Get menu configuration
    const { data: menu, error: menuError } = await supabase
      .from('tv_menus')
      .select('*')
      .eq('id', menuId)
      .single();

    if (menuError || !menu) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    // 2. Get products with inventory
    let query = supabase
      .from('products')
      .select(`
        *,
        inventory!inner (
          available_quantity,
          reserved_quantity,
          stock_status,
          location_id
        ),
        pricing_assignments:product_pricing_assignments(
          blueprint_id,
          price_overrides,
          is_active,
          blueprint:pricing_tier_blueprints(
            id, name, slug, price_breaks, display_unit
          )
        )
      `)
      .eq('vendor_id', menu.vendor_id)
      .eq('status', 'published');

    // Apply location filter
    if (locationId) {
      query = query.eq('inventory.location_id', locationId);
    }

    // Apply menu rules
    if (menu.hide_out_of_stock) {
      query = query.gt('inventory.available_quantity', 0);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { success: false, error: productsError.message },
        { status: 500 }
      );
    }

    // 3. Load vendor pricing configs
    const { data: vendorConfigs } = await supabase
      .from('vendor_pricing_configs')
      .select('blueprint_id, pricing_values')
      .eq('vendor_id', menu.vendor_id)
      .eq('is_active', true);

    const configMap = new Map(
      (vendorConfigs || []).map((config: any) => [config.blueprint_id, config.pricing_values])
    );

    // 4. Enhance products with display metadata
    const isProductNew = (createdAt: string) => {
      const created = new Date(createdAt);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - (menu.show_new_badge_days || 7));
      return created >= threshold;
    };

    const enrichedProducts = (products || []).map((product: any) => {
      const inventory = product.inventory;
      const isLowStock = inventory.available_quantity > 0 &&
                        inventory.available_quantity <= (menu.low_stock_threshold || 10);

      // Enrich pricing data
      let productWithPricing = product;
      if (product.pricing_assignments && product.pricing_assignments.length > 0) {
        const assignment = product.pricing_assignments[0];
        const blueprint = assignment.blueprint;
        const vendorPrices = configMap.get(assignment.blueprint_id) || {};
        const finalPrices = { ...vendorPrices, ...(assignment.price_overrides || {}) };

        productWithPricing = {
          ...product,
          pricing_blueprint: blueprint,
          pricing_tiers: finalPrices
        };
      }

      return {
        ...productWithPricing,
        display_badges: {
          isNew: isProductNew(product.created_at),
          isLowStock,
          isOnSale: product.on_sale || false,
          stockCount: menu.show_stock_count ? inventory.available_quantity : null
        },
        display_price: menu.sync_pricing
          ? (product.on_sale ? product.sale_price : product.regular_price)
          : product.regular_price
      };
    });

    // 5. Sort products
    const sortProducts = (products: any[], sortBy: string) => {
      switch (sortBy) {
        case 'price_asc':
          return [...products].sort((a, b) => a.display_price - b.display_price);
        case 'price_desc':
          return [...products].sort((a, b) => b.display_price - a.display_price);
        case 'stock_qty':
          return [...products].sort((a, b) =>
            b.inventory.available_quantity - a.inventory.available_quantity
          );
        case 'newest':
          return [...products].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case 'name':
        default:
          return [...products].sort((a, b) => a.name.localeCompare(b.name));
      }
    };

    const sorted = sortProducts(enrichedProducts, menu.sort_by || 'name');
    const limited = sorted.slice(0, menu.max_products_displayed || 50);

    // 6. Calculate stats
    const stats = {
      total_products: limited.length,
      low_stock_count: limited.filter(p => p.display_badges.isLowStock).length,
      on_sale_count: limited.filter(p => p.display_badges.isOnSale).length
    };

    return NextResponse.json({
      success: true,
      menu: {
        id: menu.id,
        name: menu.name,
        config: menu.config_data,
        last_sync: new Date().toISOString()
      },
      products: limited,
      stats
    });
  } catch (error: any) {
    console.error('Error in TV menu data API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

#### API 2: Inventory Sync Webhook
**File to create:** `/app/api/tv-menu/sync-inventory/route.ts`

**Purpose:** Triggered when inventory changes to refresh TV displays

**Endpoint:** `POST /api/tv-menu/sync-inventory`

**Request Body:**
```json
{
  "product_ids": ["uuid1", "uuid2"],
  "location_id": "uuid",
  "inventory_change": "decrease" | "increase" | "price_update"
}
```

**Implementation Code:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_ids, location_id, inventory_change } = body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product IDs required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Find all TV menus that should sync
    const { data: affectedMenus, error: menusError } = await supabase
      .from('tv_menus')
      .select('id, vendor_id, location_id, last_inventory_sync')
      .eq('sync_with_inventory', true)
      .or(`location_id.eq.${location_id},location_id.is.null`);

    if (menusError) {
      console.error('Error finding affected menus:', menusError);
      return NextResponse.json(
        { success: false, error: menusError.message },
        { status: 500 }
      );
    }

    console.log(`📊 Found ${affectedMenus?.length || 0} menus to sync`);

    // Update cache for each menu
    for (const menu of affectedMenus || []) {
      // Call the PostgreSQL function to refresh cache
      const { error: refreshError } = await supabase.rpc(
        'refresh_tv_menu_inventory_cache',
        {
          p_menu_id: menu.id,
          p_location_id: location_id
        }
      );

      if (refreshError) {
        console.error(`Error refreshing cache for menu ${menu.id}:`, refreshError);
      } else {
        console.log(`✅ Refreshed cache for menu: ${menu.id}`);
      }
    }

    // Send refresh command to TV devices (via Supabase real-time)
    const menuIds = (affectedMenus || []).map(m => m.id);

    if (menuIds.length > 0) {
      const { data: devices } = await supabase
        .from('tv_devices')
        .select('id, device_name')
        .in('active_menu_id', menuIds);

      console.log(`📺 Notifying ${devices?.length || 0} TV devices`);

      // Broadcast refresh event
      const channel = supabase.channel('tv_inventory_sync');
      await channel.send({
        type: 'broadcast',
        event: 'inventory_update',
        payload: {
          product_ids,
          location_id,
          inventory_change,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      menus_updated: affectedMenus?.length || 0,
      devices_notified: menuIds.length
    });
  } catch (error: any) {
    console.error('Error in inventory sync webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

#### API 3: Low Stock Products
**File to create:** `/app/api/tv-menu/low-stock-products/route.ts`

**Purpose:** Returns products below threshold for urgency display

**Endpoint:** `GET /api/tv-menu/low-stock-products?menu_id=XXX`

**Implementation Code:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menu_id');

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'Menu ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get menu config
    const { data: menu, error: menuError } = await supabase
      .from('tv_menus')
      .select('id, vendor_id, location_id, low_stock_threshold')
      .eq('id', menuId)
      .single();

    if (menuError || !menu) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Get low stock products from cache
    const { data: lowStockProducts, error: productsError } = await supabase
      .from('tv_menu_inventory_cache')
      .select(`
        *,
        product:products (
          id,
          name,
          sku,
          featured_image,
          regular_price,
          sale_price,
          on_sale
        )
      `)
      .eq('tv_menu_id', menuId)
      .eq('is_low_stock', true)
      .order('available_quantity', { ascending: true })
      .limit(10);

    if (productsError) {
      console.error('Error fetching low stock products:', productsError);
      return NextResponse.json(
        { success: false, error: productsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      low_stock_products: lowStockProducts || [],
      threshold: menu.low_stock_threshold
    });
  } catch (error: any) {
    console.error('Error in low stock products API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: POS Integration Triggers

#### Trigger 1: POS Sale
**File to modify:** `/app/pos/register/page.tsx` or `/app/api/pos/sales/create/route.ts`

**Add after sale creation:**
```typescript
// Trigger TV menu inventory sync
await fetch('/api/tv-menu/sync-inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_ids: items.map(i => i.productId),
    location_id: locationId,
    inventory_change: 'decrease'
  })
});
```

#### Trigger 2: Inventory Receiving
**File to modify:** `/app/api/vendor/purchase-orders/receive/route.ts`

**Add after receiving:**
```typescript
// Trigger TV menu update
await fetch('/api/tv-menu/sync-inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_ids: receivedProducts.map(p => p.product_id),
    location_id: locationId,
    inventory_change: 'increase'
  })
});
```

---

### Phase 4: Frontend Enhancements

#### Enhancement 1: TV Display Real-time Updates
**File to modify:** `/app/tv-display/page.tsx`

**Add real-time subscription:**
```typescript
// Subscribe to inventory updates
useEffect(() => {
  if (!vendorId) return;

  const channel = supabase
    .channel('tv_inventory_sync')
    .on('broadcast', { event: 'inventory_update' }, (payload) => {
      console.log('📊 Inventory updated, refreshing display');
      loadProducts(); // Reload products with new inventory data
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [vendorId]);

// Use enhanced API endpoint
const loadProducts = async (menu: any) => {
  const res = await fetch(`/api/tv-menu/data?menu_id=${menu.id}&location_id=${locationId || ''}`);
  const data = await res.json();

  if (data.success) {
    setProducts(data.products);
    console.log('📊 Loaded products:', data.stats);
  }
};
```

**Add inventory badges to product cards:**
```typescript
{/* Low Stock Badge */}
{product.display_badges?.isLowStock && (
  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-500 text-white text-xs font-bold">
    LIMITED STOCK
  </div>
)}

{/* New Badge */}
{product.display_badges?.isNew && (
  <div className="absolute top-2 left-2 px-2 py-1 rounded bg-blue-500 text-white text-xs font-bold">
    NEW
  </div>
)}

{/* Stock Count */}
{product.display_badges?.stockCount !== null && (
  <div className="text-xs text-red-400 mt-1">
    Only {product.display_badges.stockCount} left!
  </div>
)}
```

---

## 🧪 TESTING CHECKLIST

### Test 1: Out-of-Stock Auto-Hide
- [ ] Set product to 1 unit
- [ ] Verify shows on TV
- [ ] Complete POS sale
- [ ] Wait < 5 seconds
- [ ] Verify disappears from TV

### Test 2: Low Stock Badge
- [ ] Set product to 8 units (below threshold of 10)
- [ ] Verify "Limited Stock" badge appears on TV
- [ ] Sell units via POS
- [ ] Verify badge updates in real-time

### Test 3: Price Change Sync
- [ ] Update product price in vendor dashboard
- [ ] Wait < 10 seconds
- [ ] Verify TV shows new price
- [ ] Verify POS shows new price

### Test 4: New Product Auto-Display
- [ ] Create new product
- [ ] Publish product
- [ ] Verify appears on TV with "NEW" badge
- [ ] Wait 7 days (or change show_new_badge_days)
- [ ] Verify "NEW" badge disappears

### Test 5: Multi-Location Isolation
- [ ] Update inventory at Location A
- [ ] Verify TV at Location A updates
- [ ] Verify TVs at Location B don't change

---

## 📊 NEXT STEPS

### Immediate (1-2 hours):
1. Run database migration via Supabase dashboard
2. Create the 3 API endpoint files
3. Add POS triggers for inventory sync
4. Test with sample data

### Short-term (this week):
1. Build vendor settings UI at `/vendor/tv-menus/[menuId]/settings`
2. Enhance TV display component with real-time updates
3. Add inventory badges (LOW STOCK, NEW, etc.)
4. End-to-end testing

### Medium-term (next week):
1. Analytics dashboard for TV menu performance
2. Automated cache cleanup (cron job)
3. Performance optimization for large catalogs
4. Documentation for vendors

---

## 📁 FILES SUMMARY

### Created:
- ✅ `/supabase/migrations/20251028_tv_menu_inventory_integration.sql` - Database schema

### To Create:
- [ ] `/app/api/tv-menu/data/route.ts` - Enhanced TV menu data
- [ ] `/app/api/tv-menu/sync-inventory/route.ts` - Inventory sync webhook
- [ ] `/app/api/tv-menu/low-stock-products/route.ts` - Low stock products

### To Modify:
- [ ] `/app/tv-display/page.tsx` - Add real-time updates and badges
- [ ] `/app/pos/register/page.tsx` or `/app/api/pos/sales/create/route.ts` - Add sync trigger
- [ ] `/app/api/vendor/purchase-orders/receive/route.ts` - Add sync trigger

---

**Implementation Status:** Phase 1 Complete (Database), Phases 2-4 Ready for Build
**Estimated Time to Complete:** 4-6 hours for core functionality
**Documentation:** Complete with code examples

All systems ready to go! 🚀
