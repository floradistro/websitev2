# 🔗 TV Menu + POS/Inventory Integration Plan

**Date:** October 28, 2025
**Status:** Planning Document
**Integration Scope:** TV Digital Signage ↔ POS ↔ Inventory ↔ Vendor Dashboard

---

## 📋 Executive Summary

This document outlines how to integrate your **TV Menu Digital Signage System** with the **POS** and **Inventory Management** systems to create a unified, real-time product display that automatically updates based on inventory levels, sales data, and vendor promotions.

### Key Benefits:
- **Real-time Inventory Sync:** TV menus show only in-stock products
- **Auto-Hide Out-of-Stock:** Products auto-remove from displays when sold out
- **Dynamic Pricing:** TV menus reflect current prices, sales, and discounts
- **Low Stock Alerts:** Visual indicators when products are running low
- **Sales-Driven Content:** Popular products automatically featured
- **POS Integration:** Purchases update TV menus instantly

---

## 🏗️ Current System Architecture

### TV Menu System (Existing):
```
┌─────────────────────────────────────────────┐
│         TV MENU SYSTEM (Current)            │
├─────────────────────────────────────────────┤
│ • tv_menus (menu configurations)            │
│ • tv_devices (physical TVs)                 │
│ • tv_playlists (content rotation)           │
│ • tv_schedules (automated switching)        │
│ • tv_content (ads/promotions)               │
│ • tv_display_analytics (performance)        │
└─────────────────────────────────────────────┘
         ↓
    Displays products from categories
    (Currently: Static product data)
```

### POS/Inventory System (Existing):
```
┌─────────────────────────────────────────────┐
│      POS/INVENTORY SYSTEM (Current)         │
├─────────────────────────────────────────────┤
│ • products (catalog)                        │
│ • inventory (stock levels)                  │
│ • orders (sales transactions)               │
│ • purchase_orders (inbound stock)           │
│ • pricing_blueprints (dynamic pricing)      │
└─────────────────────────────────────────────┘
         ↓
    Real-time stock tracking
    Live pricing updates
```

---

## 🔄 Proposed Integration Architecture

### Unified System:
```
┌──────────────────────────────────────────────────────────┐
│                  VENDOR DASHBOARD                         │
│  (Central control for all systems)                        │
└──────────────────────────────────────────────────────────┘
                        ↓
         ┌──────────────┼──────────────┐
         ↓              ↓              ↓
┌────────────┐  ┌────────────┐  ┌────────────┐
│  TV MENUS  │←→│    POS     │←→│ INVENTORY  │
└────────────┘  └────────────┘  └────────────┘
      ↓              ↓              ↓
   Displays       Sells        Tracks Stock
   Products      Products       Levels
```

### Data Flow:
```
1. INVENTORY UPDATE:
   POS Sale → Inventory Decremented → TV Menu Refreshed → TV Display Updated

2. PRICE CHANGE:
   Vendor Dashboard → Product Price → TV Menu Data → TV Refreshed

3. NEW PRODUCT:
   PO Received → Inventory Created → Product Published → TV Menu Shows

4. OUT OF STOCK:
   Inventory = 0 → TV Menu Filters Out → Product Hidden on Display

5. LOW STOCK:
   Inventory < Threshold → TV Menu Shows Badge → "Limited Stock" indicator
```

---

## 🛠️ Implementation Plan

### Phase 1: Database Schema Enhancements

#### 1.1 Add Inventory Sync Fields to tv_menus
```sql
ALTER TABLE public.tv_menus
ADD COLUMN IF NOT EXISTS sync_with_inventory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_out_of_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_low_stock_badges BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS sync_pricing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_inventory_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_refresh_interval INTEGER DEFAULT 60; -- seconds
```

#### 1.2 Create Product Display Rules Table
```sql
CREATE TABLE IF NOT EXISTS public.tv_menu_product_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_menu_id UUID NOT NULL REFERENCES public.tv_menus(id) ON DELETE CASCADE,

  -- Product Filtering
  category_ids UUID[], -- Which categories to show
  tag_ids UUID[], -- Which tags to filter by
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),

  -- Inventory Rules
  require_in_stock BOOLEAN DEFAULT true,
  show_if_available_qty_gte INTEGER, -- Only show if qty >= X
  hide_if_reserved_qty_gte INTEGER, -- Hide if too many reserved

  -- Sorting/Ordering
  sort_by TEXT DEFAULT 'name' CHECK (sort_by IN (
    'name', 'price_asc', 'price_desc', 'stock_qty',
    'popularity', 'newest', 'featured', 'sales_rank'
  )),
  max_products_displayed INTEGER DEFAULT 50,

  -- Visual Indicators
  show_stock_count BOOLEAN DEFAULT false,
  show_low_stock_badge BOOLEAN DEFAULT true,
  show_new_badge_days INTEGER DEFAULT 7, -- Show "NEW" for X days
  show_sale_badge BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tv_menu_product_rules_menu ON public.tv_menu_product_rules(tv_menu_id);
```

#### 1.3 Create Real-time Inventory Snapshot Table
```sql
CREATE TABLE IF NOT EXISTS public.tv_menu_inventory_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_menu_id UUID NOT NULL REFERENCES public.tv_menus(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Cached Inventory Data (for fast TV display)
  available_quantity INTEGER NOT NULL,
  reserved_quantity INTEGER NOT NULL,
  stock_status TEXT,
  is_low_stock BOOLEAN DEFAULT false,
  is_out_of_stock BOOLEAN DEFAULT false,

  -- Cached Product Data
  current_price DECIMAL(10,2),
  is_on_sale BOOLEAN DEFAULT false,
  sale_price DECIMAL(10,2),

  -- Analytics
  display_count INTEGER DEFAULT 0,
  last_displayed_at TIMESTAMPTZ,

  -- Metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  cache_expires_at TIMESTAMPTZ,

  UNIQUE(tv_menu_id, product_id)
);

CREATE INDEX idx_tv_menu_cache_menu ON public.tv_menu_inventory_cache(tv_menu_id);
CREATE INDEX idx_tv_menu_cache_product ON public.tv_menu_inventory_cache(product_id);
CREATE INDEX idx_tv_menu_cache_stock ON public.tv_menu_inventory_cache(is_out_of_stock, is_low_stock);
CREATE INDEX idx_tv_menu_cache_expires ON public.tv_menu_inventory_cache(cache_expires_at);
```

---

### Phase 2: Backend API Enhancements

#### 2.1 TV Menu Data API (Enhanced)
**File:** `/app/api/tv-menu/data/route.ts`

```typescript
// GET /api/tv-menu/data?menu_id=XXX&location_id=YYY
// Returns products with real-time inventory for TV display

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const menuId = searchParams.get('menu_id');
  const locationId = searchParams.get('location_id');

  // 1. Get menu configuration
  const { data: menu } = await supabase
    .from('tv_menus')
    .select('*, tv_menu_product_rules(*)')
    .eq('id', menuId)
    .single();

  // 2. Get products with inventory
  let query = supabase
    .from('products')
    .select(`
      *,
      inventory!inner (
        available_quantity,
        reserved_quantity,
        stock_status
      ),
      categories (name),
      pricing_blueprints (*)
    `)
    .eq('vendor_id', menu.vendor_id)
    .eq('status', 'published');

  // Apply location filter
  if (locationId) {
    query = query.eq('inventory.location_id', locationId);
  }

  // 3. Apply menu rules
  if (menu.hide_out_of_stock) {
    query = query.gt('inventory.available_quantity', 0);
  }

  const { data: products } = await query;

  // 4. Enhance products with display metadata
  const enhancedProducts = products.map(product => ({
    ...product,
    display_badges: {
      isNew: isProductNew(product.created_at, menu.show_new_badge_days),
      isLowStock: product.inventory.available_quantity <= menu.low_stock_threshold,
      isOnSale: product.on_sale,
      stockCount: menu.show_stock_count ? product.inventory.available_quantity : null
    },
    display_price: menu.sync_pricing
      ? (product.on_sale ? product.sale_price : product.regular_price)
      : product.config_data?.display_price || product.regular_price
  }));

  // 5. Sort and limit
  const sorted = sortProducts(enhancedProducts, menu.sort_by);
  const limited = sorted.slice(0, menu.max_products_displayed || 50);

  // 6. Update cache
  await updateInventoryCache(menuId, limited);

  return NextResponse.json({
    success: true,
    menu: {
      id: menu.id,
      name: menu.name,
      config: menu.config_data,
      last_sync: new Date().toISOString()
    },
    products: limited,
    stats: {
      total_products: limited.length,
      low_stock_count: limited.filter(p => p.display_badges.isLowStock).length,
      on_sale_count: limited.filter(p => p.display_badges.isOnSale).length
    }
  });
}
```

#### 2.2 Real-time Inventory Sync Webhook
**File:** `/app/api/tv-menu/sync-inventory/route.ts`

```typescript
// POST /api/tv-menu/sync-inventory
// Triggered when inventory changes (from POS sales, receiving, etc.)

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { product_id, location_id, inventory_change } = body;

  // 1. Find all TV menus showing this product
  const { data: affectedMenus } = await supabase
    .from('tv_menus')
    .select('id, vendor_id, location_id')
    .eq('sync_with_inventory', true)
    .or(`location_id.eq.${location_id},location_id.is.null`);

  // 2. Update cache for each menu
  for (const menu of affectedMenus) {
    await updateMenuProductCache(menu.id, product_id);
  }

  // 3. Send refresh command to TV devices
  const { data: devices } = await supabase
    .from('tv_devices')
    .select('id')
    .in('active_menu_id', affectedMenus.map(m => m.id));

  for (const device of devices) {
    await supabase.from('tv_commands').insert({
      tv_device_id: device.id,
      command_type: 'refresh',
      payload: { reason: 'inventory_update', product_id }
    });
  }

  return NextResponse.json({ success: true, menus_updated: affectedMenus.length });
}
```

#### 2.3 Low Stock Alert Integration
**File:** `/app/api/tv-menu/low-stock-products/route.ts`

```typescript
// GET /api/tv-menu/low-stock-products?menu_id=XXX
// Returns products below threshold for special display

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const menuId = searchParams.get('menu_id');

  const { data: menu } = await supabase
    .from('tv_menus')
    .select('*, vendor_id, location_id, low_stock_threshold')
    .eq('id', menuId)
    .single();

  // Get low stock products
  const { data: lowStockProducts } = await supabase
    .from('tv_menu_inventory_cache')
    .select(`
      *,
      products (
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

  return NextResponse.json({
    success: true,
    low_stock_products: lowStockProducts,
    threshold: menu.low_stock_threshold
  });
}
```

---

### Phase 3: Frontend Components

#### 3.1 Enhanced TV Display Component
**File:** `/app/tv-display/[menuId]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';

export default function TVDisplay({ params }) {
  const [products, setProducts] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null);

  // Fetch products with inventory
  const loadProducts = async () => {
    const res = await fetch(`/api/tv-menu/data?menu_id=${params.menuId}&location_id=${locationId}`);
    const data = await res.json();
    setProducts(data.products);
    setMenuConfig(data.menu);
  };

  // Real-time subscription for inventory updates
  useRealtime('tv_commands', {
    filter: `tv_device_id=eq.${deviceId}`,
    callback: (payload) => {
      if (payload.new.command_type === 'refresh') {
        loadProducts(); // Reload products when inventory changes
      }
    }
  });

  // Auto-refresh every N seconds (from menu config)
  useEffect(() => {
    if (!menuConfig) return;
    const interval = setInterval(loadProducts, menuConfig.auto_refresh_interval * 1000);
    return () => clearInterval(interval);
  }, [menuConfig]);

  return (
    <div className="tv-display">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          showBadges={true}
          badges={{
            lowStock: product.display_badges.isLowStock,
            onSale: product.display_badges.isOnSale,
            new: product.display_badges.isNew,
            stockCount: product.display_badges.stockCount
          }}
        />
      ))}
    </div>
  );
}
```

#### 3.2 Vendor Dashboard - TV Menu Manager
**File:** `/app/vendor/tv-menus/[menuId]/settings/page.tsx`

```typescript
'use client';

export default function TVMenuSettings({ params }) {
  const [menu, setMenu] = useState(null);

  const settings = [
    {
      section: 'Inventory Sync',
      settings: [
        {
          key: 'sync_with_inventory',
          label: 'Sync with Real-time Inventory',
          type: 'toggle',
          description: 'Automatically update TV menu when inventory changes'
        },
        {
          key: 'hide_out_of_stock',
          label: 'Hide Out of Stock Products',
          type: 'toggle',
          description: 'Remove products from display when quantity = 0'
        },
        {
          key: 'show_low_stock_badges',
          label: 'Show Low Stock Badges',
          type: 'toggle',
          description: 'Display "Limited Stock" indicator'
        },
        {
          key: 'low_stock_threshold',
          label: 'Low Stock Threshold',
          type: 'number',
          description: 'Show low stock badge when quantity is below this number'
        }
      ]
    },
    {
      section: 'Pricing',
      settings: [
        {
          key: 'sync_pricing',
          label: 'Sync Live Pricing',
          type: 'toggle',
          description: 'Show real-time prices from POS system'
        },
        {
          key: 'show_sale_badges',
          label: 'Show Sale Badges',
          type: 'toggle',
          description: 'Highlight products on sale'
        }
      ]
    },
    {
      section: 'Display Rules',
      settings: [
        {
          key: 'max_products_displayed',
          label: 'Max Products to Show',
          type: 'number',
          description: 'Limit number of products displayed'
        },
        {
          key: 'auto_refresh_interval',
          label: 'Auto Refresh Interval (seconds)',
          type: 'number',
          description: 'How often to check for updates'
        },
        {
          key: 'sort_by',
          label: 'Sort Products By',
          type: 'select',
          options: [
            { value: 'name', label: 'Name (A-Z)' },
            { value: 'price_asc', label: 'Price (Low to High)' },
            { value: 'price_desc', label: 'Price (High to Low)' },
            { value: 'stock_qty', label: 'Stock Quantity' },
            { value: 'popularity', label: 'Popularity (Sales)' },
            { value: 'newest', label: 'Newest First' }
          ]
        }
      ]
    }
  ];

  return (
    <div className="settings-panel">
      {settings.map(section => (
        <SettingsSection key={section.section} {...section} />
      ))}
    </div>
  );
}
```

---

### Phase 4: POS Integration Triggers

#### 4.1 POS Sale Trigger
**Location:** `/app/api/pos/sales/create/route.ts`

```typescript
// After creating a sale, trigger TV menu sync

// Existing POS sale creation code...

// NEW: Trigger TV menu inventory sync
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

#### 4.2 Inventory Receiving Trigger
**Location:** `/app/api/vendor/purchase-orders/receive/route.ts`

```typescript
// After receiving inventory, sync TV menus

// Existing receiving logic...

// NEW: Trigger TV menu update
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

#### 4.3 Price Update Trigger
**Location:** `/app/api/vendor/products/[productId]/route.ts`

```typescript
// After updating product price, refresh TV menus

// Existing price update logic...

// NEW: Trigger TV menu price sync
await fetch('/api/tv-menu/sync-inventory', {
  method: 'POST',
  body: JSON.stringify({
    product_id: productId,
    inventory_change: 'price_update'
  })
});
```

---

## 📊 Use Cases & Benefits

### Use Case 1: Automatic Out-of-Stock Hiding
**Scenario:** Customer buys last unit of "Blue Dream" flower at POS

**Flow:**
1. POS records sale → Inventory = 0
2. Inventory sync API triggered
3. TV menu cache updated (is_out_of_stock = true)
4. TV device receives refresh command
5. "Blue Dream" disappears from TV display
6. Next customer sees only in-stock products

**Benefit:** Prevents customer disappointment from seeing unavailable products

---

### Use Case 2: Dynamic Pricing Display
**Scenario:** Manager puts "Lemon Haze" on sale (30% off)

**Flow:**
1. Manager updates price in vendor dashboard
2. Product price updated in database
3. TV menu sync triggered
4. TV displays show new sale price
5. "SALE" badge appears on TV
6. POS also shows new price

**Benefit:** Consistent pricing across all touchpoints

---

### Use Case 3: Low Stock Urgency
**Scenario:** Only 3 units of "Gelato" left

**Flow:**
1. Inventory drops below threshold (10 units)
2. TV menu cache marks as low_stock
3. TV display shows "Limited Stock" badge
4. Product may be highlighted/featured
5. Creates urgency for customers

**Benefit:** Drives sales of low-inventory items before stockout

---

### Use Case 4: New Product Launch
**Scenario:** Vendor receives shipment of new product "Purple Punch"

**Flow:**
1. Inbound PO received → Inventory created
2. Product status set to "published"
3. TV menu sync triggered
4. "NEW" badge appears (7 days)
5. Product prominently displayed
6. Available at POS immediately

**Benefit:** Automatic marketing for new products

---

### Use Case 5: Popular Products Auto-Feature
**Scenario:** "Wedding Cake" sells 50 units in a day

**Flow:**
1. Sales analytics track product popularity
2. TV menu rules set to sort by "popularity"
3. High-selling products move to top
4. Featured placement on TV
5. Reinforces best-sellers

**Benefit:** Merchandising based on actual sales data

---

## 🚀 Implementation Timeline

### Week 1: Database & Backend
- [x] Day 1-2: Create database schema enhancements
- [x] Day 3-4: Build TV menu data API
- [x] Day 5: Build inventory sync webhook API
- [x] Day 6-7: Build low stock products API

### Week 2: Frontend Components
- [x] Day 1-2: Enhance TV display component with real-time updates
- [x] Day 3-4: Build vendor TV menu settings UI
- [x] Day 5: Build product display badges/indicators
- [x] Day 6-7: Testing & bug fixes

### Week 3: Integration & Testing
- [x] Day 1-2: Add triggers to POS sale endpoints
- [x] Day 3: Add triggers to inventory receiving
- [x] Day 4: Add triggers to price updates
- [x] Day 5-6: End-to-end testing
- [x] Day 7: Documentation & training

### Week 4: Polish & Deploy
- [x] Day 1-2: Performance optimization
- [x] Day 3: Analytics dashboard
- [x] Day 4-5: User acceptance testing
- [x] Day 6: Deploy to production
- [x] Day 7: Monitor & iterate

---

## 🧪 Testing Strategy

### Test Scenario 1: Stock Depletion
1. Set product to 1 unit in stock
2. Verify TV shows product
3. Complete POS sale for that product
4. Wait for sync (< 5 seconds)
5. Verify product disappears from TV

**Expected:** Product auto-hides on TV when sold out

---

### Test Scenario 2: Price Change
1. Display product on TV at $20
2. Update price to $15 in vendor dashboard
3. Wait for sync
4. Verify TV shows $15
5. Verify "SALE" badge appears (if applicable)

**Expected:** Price updates in < 10 seconds

---

### Test Scenario 3: Low Stock Alert
1. Set product to 8 units (below threshold of 10)
2. Verify "Limited Stock" badge appears
3. Sell 3 units via POS
4. Verify stock count updates (if enabled)
5. Sell remaining 5 units
6. Verify product disappears

**Expected:** Dynamic stock indicators work correctly

---

### Test Scenario 4: New Product
1. Receive inbound PO with new product
2. Publish product
3. Verify appears on TV menu
4. Verify "NEW" badge shows
5. Wait 7 days (or simulate)
6. Verify "NEW" badge disappears

**Expected:** New products auto-appear with badge

---

### Test Scenario 5: Multi-Location
1. Set TV menu to specific location
2. Update inventory at that location
3. Verify TV at that location updates
4. Verify TVs at other locations don't change

**Expected:** Location-specific inventory isolation

---

## 📈 Performance Considerations

### Caching Strategy:
```
┌─────────────────────────────────────────┐
│      CACHING LAYERS                     │
├─────────────────────────────────────────┤
│ 1. Database Cache (tv_menu_inventory_  │
│    cache) - 60 second TTL               │
│ 2. API Response Cache - 30 second TTL  │
│ 3. TV Device Local Cache - Refresh on  │
│    command or every N seconds           │
└─────────────────────────────────────────┘
```

### Optimization:
- **Debounce Syncs:** Wait 5 seconds after inventory change before syncing (batch multiple rapid changes)
- **Incremental Updates:** Only sync affected products, not entire menu
- **CDN Caching:** Cache product images at edge
- **WebSocket Fallback:** Use long-polling if WebSockets unavailable
- **Lazy Loading:** Load products in batches for large catalogs

---

## 🔐 Security Considerations

### RLS Policies:
- Vendors can only sync their own menus
- TV devices can read menu data (public access)
- Inventory data filtered by vendor_id
- Price updates require vendor authentication

### Rate Limiting:
- Max 1 sync per product per 5 seconds
- Max 100 TV refresh commands per minute per vendor
- API endpoints throttled to prevent abuse

---

## 📊 Analytics & Insights

### New Metrics to Track:
1. **Product Display Time:** How long each product shown on TV
2. **Conversion Rate:** Products displayed → Products sold
3. **Low Stock Effectiveness:** Sales increase when "Limited Stock" shown
4. **Menu Performance:** Which menu configs drive most sales
5. **Out-of-Stock Events:** How often products go out of stock during display
6. **Price Change Impact:** Sales before/after price changes

### Dashboard Widgets:
```typescript
<TVMenuAnalytics vendorId={vendorId}>
  <MetricCard title="Products Displayed Today" value={125} />
  <MetricCard title="Auto-Removed (Out of Stock)" value={12} />
  <MetricCard title="Low Stock Alerts Shown" value={18} />
  <MetricCard title="Avg Display-to-Sale Time" value="4.2 min" />
</TVMenuAnalytics>
```

---

## 🎨 UI/UX Enhancements

### TV Display Badges:
```css
/* Low Stock Badge */
.badge-low-stock {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  animation: pulse 2s ease-in-out infinite;
}

/* Sale Badge */
.badge-sale {
  background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
  font-weight: 900;
}

/* New Badge */
.badge-new {
  background: linear-gradient(135deg, #339af0 0%, #1c7ed6 100%);
  animation: shimmer 3s linear infinite;
}
```

### Product Card Enhancements:
- **Stock Count:** "Only 3 left!" for low stock items
- **Real-time Price:** Live price updates without page refresh
- **Sale Countdown:** "Sale ends in 2 hours"
- **Availability Indicator:** Green dot = In Stock, Red = Low Stock

---

## 🔧 Maintenance & Monitoring

### Health Checks:
- Monitor inventory cache freshness (alert if > 2 min old)
- Track TV device connection status
- Alert when sync fails for >3 consecutive attempts
- Monitor API response times (target < 500ms)

### Automated Tasks:
```typescript
// Cron Job: Clean expired cache (run every hour)
async function cleanExpiredCache() {
  await supabase
    .from('tv_menu_inventory_cache')
    .delete()
    .lt('cache_expires_at', new Date().toISOString());
}

// Cron Job: Sync all menus (run every 5 minutes as backup)
async function syncAllMenus() {
  const { data: menus } = await supabase
    .from('tv_menus')
    .select('id')
    .eq('sync_with_inventory', true)
    .eq('is_active', true);

  for (const menu of menus) {
    await syncMenuInventory(menu.id);
  }
}
```

---

## 📞 Implementation Checklist

### Database:
- [ ] Create `tv_menu_product_rules` table
- [ ] Create `tv_menu_inventory_cache` table
- [ ] Add sync fields to `tv_menus` table
- [ ] Create indexes for performance
- [ ] Test RLS policies

### Backend APIs:
- [ ] Build `/api/tv-menu/data` endpoint
- [ ] Build `/api/tv-menu/sync-inventory` webhook
- [ ] Build `/api/tv-menu/low-stock-products` endpoint
- [ ] Add triggers to POS sales API
- [ ] Add triggers to inventory receiving API
- [ ] Add triggers to price update API

### Frontend:
- [ ] Enhance TV display component with real-time updates
- [ ] Build vendor settings UI for TV menus
- [ ] Create product display badges (Low Stock, Sale, New)
- [ ] Build analytics dashboard
- [ ] Add WebSocket/real-time subscriptions

### Testing:
- [ ] Test stock depletion scenario
- [ ] Test price change propagation
- [ ] Test low stock alerts
- [ ] Test new product display
- [ ] Test multi-location isolation
- [ ] Performance testing (1000+ products)
- [ ] Load testing (10+ concurrent TVs)

### Documentation:
- [ ] API documentation
- [ ] Vendor user guide
- [ ] Setup instructions for TV devices
- [ ] Troubleshooting guide

---

## 🎯 Success Metrics

### Technical:
- Sync latency < 5 seconds
- API response time < 500ms
- 99.9% uptime for TV displays
- Zero inventory sync errors

### Business:
- 30% reduction in customer inquiries about unavailable products
- 20% increase in sales of low-stock items (urgency effect)
- 95%+ inventory accuracy on displays
- 100% price consistency across POS and TV menus

---

## 🚀 Quick Start Guide

### For Vendors:
1. Go to `/vendor/tv-menus`
2. Click on a menu → "Settings" tab
3. Enable "Sync with Real-time Inventory"
4. Configure low stock threshold
5. Save changes
6. TV displays will automatically update

### For Developers:
```bash
# 1. Run database migrations
npm run db:migrate

# 2. Test TV menu data API
curl "http://localhost:3000/api/tv-menu/data?menu_id=XXX&location_id=YYY"

# 3. Trigger manual sync
curl -X POST "http://localhost:3000/api/tv-menu/sync-inventory" \
  -H "Content-Type: application/json" \
  -d '{"product_id": "XXX", "location_id": "YYY"}'

# 4. Open TV display
open "http://localhost:3000/tv-display/MENU_ID"
```

---

## 📚 Additional Resources

- [TV Menu System Schema](/supabase/migrations/20251027_tv_menu_system.sql)
- [Inventory Management API](/app/api/vendor/inventory)
- [POS Sales API](/app/api/pos/sales)
- [Real-time Subscriptions Guide](/docs/REALTIME_SUBSCRIPTIONS.md)

---

*Generated: October 28, 2025*
*Version: 1.0.0*
*Status: Planning Document - Ready for Implementation*
