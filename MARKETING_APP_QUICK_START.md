# Marketing App Implementation Quick Start

## Overview
The **Marketing app** placeholder exists in `/components/admin/AppsGrid.tsx` pointing to `/vendor/marketing` but the route is not implemented yet. This guide shows how to build it.

## Current Marketing Features Already Implemented

### 1. Promotions System
- **Location**: `/vendor/promotions`
- **Status**: Production-ready
- **Capabilities**: 
  - 4 promotion types (product, category, tier, global)
  - Schedule-based (dates, days, times)
  - Badge customization
  - Real-time updates
  - Priority resolution

### 2. Analytics
- **Location**: `/vendor/analytics`
- **Metrics**: Revenue, margins, inventory, top products
- **Visualizations**: Charts, tables, KPIs

### 3. Reviews Management
- **Location**: `/vendor/reviews`
- **Features**: Star ratings, responses, filtering

### 4. Branding
- **Location**: `/vendor/branding`
- **Features**: Logo, colors, fonts, social links

### 5. Digital Signage (TV Menus)
- **Location**: `/vendor/tv-menus`
- **Features**: AI-powered layouts, themes, real-time inventory sync

### 6. Media Library
- **Location**: `/vendor/media-library`
- **Features**: AI enhancement, generation, bulk operations

---

## How to Create the Marketing App

### Step 1: Create Route Structure
```bash
mkdir -p /app/vendor/marketing
touch /app/vendor/marketing/page.tsx
```

### Step 2: Update Navigation
Add to `/lib/vendor-navigation.ts`:
```typescript
{
  href: '/vendor/marketing',
  icon: Megaphone,
  label: 'Marketing',
  description: 'Campaigns & promotions',
  isCore: false,
  group: 'content'
}
```

### Step 3: Basic Page Structure
```tsx
// /app/vendor/marketing/page.tsx
"use client";

import { useAppAuth } from '@/context/AppAuthContext';
import { Megaphone, Mail, Gift, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function MarketingPage() {
  const { vendor } = useAppAuth();

  const marketingApps = [
    {
      name: 'Promotions',
      description: 'Create sales promotions and discounts',
      icon: Tag,
      route: '/vendor/promotions',
      status: 'active'
    },
    {
      name: 'Email Campaigns',
      description: 'Send newsletters and campaigns',
      icon: Mail,
      route: '/vendor/marketing/email',
      status: 'coming_soon'
    },
    {
      name: 'Loyalty Program',
      description: 'Customer loyalty and rewards',
      icon: Gift,
      route: '/vendor/marketing/loyalty',
      status: 'coming_soon'
    },
    {
      name: 'Performance',
      description: 'Campaign analytics and ROI',
      icon: TrendingUp,
      route: '/vendor/analytics',
      status: 'active'
    }
  ];

  return (
    <div className="w-full px-4 lg:px-0">
      <div className="mb-8 pb-6 border-b border-white/5">
        <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1">
          Marketing Hub
        </h1>
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
          Campaigns · Promotions · Customer Engagement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketingApps.map((app) => {
          const Icon = app.icon;
          return (
            <Link
              key={app.name}
              href={app.route}
              className={`group relative bg-white/5 border rounded-2xl p-6 transition-all duration-300 ${
                app.status === 'coming_soon'
                  ? 'opacity-50 cursor-not-allowed border-white/5 hover:border-white/5'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <Icon size={24} className="text-white mb-4" />
                  <h3 className="text-white font-black text-lg uppercase mb-2">
                    {app.name}
                  </h3>
                  <p className="text-white/60 text-sm">{app.description}</p>
                </div>
                {app.status === 'coming_soon' && (
                  <span className="text-xs uppercase tracking-wider text-white/40 bg-white/10 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Integration Points

### Leverage Existing Systems

#### 1. Promotions Integration
```typescript
// Already works across all channels
import { calculatePrice } from '@/lib/pricing';

const priceCalc = calculatePrice(product, activePromotions, quantity);
// Returns: originalPrice, finalPrice, savings, appliedPromotion, badge
```

#### 2. Analytics Data
```typescript
// Use existing analytics endpoint
const response = await fetch(`/api/vendor/analytics?timeRange=${period}`);
const analytics = await response.json();
// Returns: revenue, orders, products, costs, inventory
```

#### 3. Media Library
```typescript
// Use existing media APIs for campaign assets
const media = await fetch('/api/vendor/media', {
  headers: { 'x-vendor-id': vendor.id }
});
```

#### 4. Customer Data
```typescript
// Query from customers table via Supabase
const { data: customers } = await supabase
  .from('customers')
  .select('*')
  .eq('vendor_id', vendor.id);
```

#### 5. Real-time Subscriptions
```typescript
// Subscribe to order changes for campaign metrics
const channel = supabase
  .channel('marketing_orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `vendor_id=eq.${vendor.id}`
  }, (payload) => {
    updateCampaignMetrics();
  })
  .subscribe();
```

---

## Recommended Marketing App Features

### Phase 1: MVP (Core)
1. **Campaign Dashboard**
   - Overview of all promotions
   - Active campaigns
   - Performance metrics

2. **Email Campaigns** (Basic)
   - Template builder
   - Customer segmentation
   - Send scheduling
   - Basic analytics

3. **Customer Segmentation**
   - RFM scoring (Recency, Frequency, Monetary)
   - Purchase history groups
   - Behavioral segments

### Phase 2: Enhanced
4. **Loyalty Program**
   - Points system
   - Tier levels
   - Reward catalog

5. **Content Calendar**
   - Plan campaigns across channels
   - Schedule content
   - Team collaboration

6. **SMS Campaigns**
   - Twilio integration
   - Template library
   - Delivery tracking

### Phase 3: Advanced
7. **Social Integration**
   - Instagram/Facebook sync
   - Post scheduling
   - Engagement metrics

8. **Referral Program**
   - Referral tracking
   - Reward distribution
   - Viral mechanics

9. **Attribution & ROI**
   - Campaign performance
   - Channel attribution
   - Conversion tracking

---

## Database Tables for New Features

### Email Campaigns Table
```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  name VARCHAR(255),
  description TEXT,
  
  -- Template
  subject_line TEXT,
  template_id UUID REFERENCES email_templates(id),
  body_html TEXT,
  
  -- Targeting
  segment_id UUID REFERENCES customer_segments(id),
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  send_time TIMESTAMPTZ,
  
  -- Tracking
  total_sent INT DEFAULT 0,
  opened INT DEFAULT 0,
  clicked INT DEFAULT 0,
  unsubscribed INT DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Customer Segments Table
```sql
CREATE TABLE customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  name VARCHAR(255),
  description TEXT,
  
  -- Criteria (JSON for flexibility)
  segment_rules JSONB,
  
  -- Stats
  customer_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Loyalty Program Table
```sql
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  name VARCHAR(255),
  description TEXT,
  
  -- Point System
  point_value DECIMAL(10,2), -- $X per point
  point_expiry_days INT,
  
  -- Tiers
  tiers JSONB, -- [{"name":"Silver","points":0},{"name":"Gold","points":500}]
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints to Create

```typescript
// Marketing endpoints pattern
GET    /api/vendor/marketing/campaigns          // List all campaigns
POST   /api/vendor/marketing/campaigns          // Create campaign
PATCH  /api/vendor/marketing/campaigns/:id      // Update campaign
DELETE /api/vendor/marketing/campaigns/:id      // Delete campaign

GET    /api/vendor/marketing/email/:id/send     // Send email
GET    /api/vendor/marketing/email/:id/analytics // Campaign metrics

GET    /api/vendor/marketing/segments           // List segments
POST   /api/vendor/marketing/segments           // Create segment
GET    /api/vendor/marketing/segments/:id/preview // Preview members

GET    /api/vendor/marketing/loyalty            // Get loyalty config
PATCH  /api/vendor/marketing/loyalty            // Update loyalty config
```

---

## UI Components to Create

### 1. Campaign Builder
```tsx
<CampaignBuilder 
  template={selectedTemplate}
  onSave={saveCampaign}
  onSchedule={scheduleCampaign}
/>
```

### 2. Segment Editor
```tsx
<SegmentEditor
  initialRules={segmentRules}
  onSave={saveSegment}
  previewCount={segmentSize}
/>
```

### 3. Campaign Analytics
```tsx
<CampaignAnalytics
  campaign={campaign}
  metrics={metrics}
  timeRange="7d"
/>
```

### 4. Customer List
```tsx
<CustomerList
  segment={selectedSegment}
  sortBy="revenue"
  filters={activeFilters}
/>
```

---

## Key Considerations

### Multi-Location Support
Marketing campaigns should consider:
- Location-specific promotions
- Location-level analytics
- Per-location scheduling (time zones)

### GDPR Compliance
- Customer opt-in tracking
- Unsubscribe management
- Data retention policies
- Export user data on request

### Real-time Updates
- Use Supabase subscriptions for:
  - Campaign performance
  - Email delivery status
  - Customer segment updates

### Performance
- Lazy load charts/analytics
- Paginate customer lists
- Index frequently queried segments
- Cache popular segments

---

## Testing Strategy

### Unit Tests
- Campaign calculation logic
- Segment filtering rules
- Point calculations

### Integration Tests
- Email sending flow
- Campaign creation → delivery
- Segment updates trigger analytics

### E2E Tests
- Create campaign → schedule → send
- Update promotions → see in POS
- Customer segment → email campaign

---

## Monitoring & Metrics

### Campaign KPIs
- Send rate (% successfully delivered)
- Open rate (% opened emails)
- Click-through rate (% clicked links)
- Conversion rate (% purchased after click)
- ROI (revenue / cost)

### Segment Health
- Size changes over time
- Engagement levels
- Churn rate
- LTV (lifetime value)

### System Health
- Email queue depth
- API response times
- Database query performance
- Real-time subscription lag

---

## Resources & Examples

### From Existing Codebase
- **Promotions logic**: `/lib/pricing.ts`
- **Real-time patterns**: `/app/vendor/promotions/page.tsx`
- **Analytics patterns**: `/app/vendor/analytics/page.tsx`
- **Form patterns**: `/app/vendor/branding/page.tsx`
- **API patterns**: `/app/api/vendor/promotions/route.ts`

### Third-party Services
- **Email**: Sendgrid, Mailgun, AWS SES
- **SMS**: Twilio, Vonage
- **Analytics**: Segment, Rudderstack
- **Social**: Instagram Graph API, Facebook Conversion API

