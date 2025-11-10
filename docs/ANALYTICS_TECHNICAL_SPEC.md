# Analytics System - Technical Specification

## Overview

This document provides the technical specification for building a world-class analytics system that accountants will love and Steve Jobs would be proud of.

---

## Database Schema

### 1. New Tables

#### `analytics_daily_cache`
Pre-aggregated daily metrics for fast queries.

```sql
CREATE TABLE analytics_daily_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  location_id UUID REFERENCES locations(id),
  date DATE NOT NULL,

  -- Revenue Metrics
  gross_sales NUMERIC(12,2) DEFAULT 0,
  net_sales NUMERIC(12,2) DEFAULT 0,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  tip_amount NUMERIC(12,2) DEFAULT 0,

  -- Cost Metrics
  cost_of_goods NUMERIC(12,2) DEFAULT 0,
  gross_profit NUMERIC(12,2) DEFAULT 0,
  gross_margin NUMERIC(5,2) DEFAULT 0,

  -- Transaction Metrics
  total_orders INTEGER DEFAULT 0,
  total_refunds INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  total_quantity NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(10,2) DEFAULT 0,
  avg_items_per_order NUMERIC(5,2) DEFAULT 0,
  avg_quantity_per_order NUMERIC(5,2) DEFAULT 0,

  -- Payment Methods (JSONB for flexibility)
  payment_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: {"cash": 1500.00, "card": 3500.00, "digital": 1000.00}

  -- Category Breakdown (JSONB)
  category_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: {"flower": {"sales": 5000, "margin": 52.5}, ...}

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, location_id, date),
  CONSTRAINT check_margin CHECK (gross_margin >= 0 AND gross_margin <= 100)
);

CREATE INDEX idx_analytics_daily_vendor_date
ON analytics_daily_cache(vendor_id, date DESC);

CREATE INDEX idx_analytics_daily_location_date
ON analytics_daily_cache(location_id, date DESC) WHERE location_id IS NOT NULL;
```

#### `analytics_product_cache`
Product performance metrics, updated periodically.

```sql
CREATE TABLE analytics_product_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  location_id UUID REFERENCES locations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Sales Metrics
  units_sold INTEGER DEFAULT 0,
  quantity_sold NUMERIC(12,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(12,2) DEFAULT 0,
  margin NUMERIC(5,2) DEFAULT 0,

  -- Performance Metrics
  total_orders INTEGER DEFAULT 0,
  avg_price NUMERIC(10,2) DEFAULT 0,
  discount_given NUMERIC(12,2) DEFAULT 0,
  markdown_percent NUMERIC(5,2) DEFAULT 0,

  -- Inventory Metrics
  stock_on_hand NUMERIC(12,2),
  days_of_inventory NUMERIC(5,1),
  turnover_rate NUMERIC(5,2),

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, product_id, location_id, period_start, period_end)
);

CREATE INDEX idx_analytics_product_vendor_period
ON analytics_product_cache(vendor_id, period_start, period_end);

CREATE INDEX idx_analytics_product_performance
ON analytics_product_cache(vendor_id, margin DESC, revenue DESC);
```

#### `analytics_employee_cache`
Employee performance metrics.

```sql
CREATE TABLE analytics_employee_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  employee_id UUID REFERENCES users(id) NOT NULL,
  location_id UUID REFERENCES locations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Sales Metrics
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  total_quantity NUMERIC(12,2) DEFAULT 0,

  -- Performance Metrics
  avg_transaction_value NUMERIC(10,2) DEFAULT 0,
  avg_items_per_transaction NUMERIC(5,2) DEFAULT 0,
  transactions_per_hour NUMERIC(5,2),

  -- Financial Metrics
  total_discounts NUMERIC(12,2) DEFAULT 0,
  total_refunds NUMERIC(12,2) DEFAULT 0,
  gross_profit NUMERIC(12,2) DEFAULT 0,
  gross_margin NUMERIC(5,2) DEFAULT 0,

  -- Commission
  commission_amount NUMERIC(10,2) DEFAULT 0,
  commission_rate NUMERIC(5,2),

  -- Payment Breakdown
  cash_collected NUMERIC(12,2) DEFAULT 0,
  card_processed NUMERIC(12,2) DEFAULT 0,
  tips_collected NUMERIC(12,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, employee_id, location_id, period_start, period_end)
);

CREATE INDEX idx_analytics_employee_vendor_period
ON analytics_employee_cache(vendor_id, period_start, period_end);

CREATE INDEX idx_analytics_employee_performance
ON analytics_employee_cache(vendor_id, total_sales DESC);
```

#### `report_exports`
Track report generation and downloads.

```sql
CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,

  report_type TEXT NOT NULL,
  -- 'sales_by_day', 'product_performance', 'employee_report', etc.

  file_format TEXT NOT NULL,
  -- 'csv', 'xlsx', 'pdf'

  filters JSONB,
  -- Store the query parameters used

  file_url TEXT,
  file_size_bytes BIGINT,

  status TEXT DEFAULT 'pending',
  -- 'pending', 'processing', 'completed', 'failed'

  error_message TEXT,

  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ,
  -- Auto-delete after 7 days

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_exports_vendor
ON report_exports(vendor_id, created_at DESC);

CREATE INDEX idx_report_exports_status
ON report_exports(status) WHERE status IN ('pending', 'processing');

CREATE INDEX idx_report_exports_expired
ON report_exports(expires_at) WHERE status = 'completed';
```

#### `report_schedules`
Scheduled report delivery (email, etc.).

```sql
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,

  name TEXT NOT NULL,
  report_type TEXT NOT NULL,

  schedule_type TEXT NOT NULL,
  -- 'daily', 'weekly', 'monthly', 'custom'

  schedule_config JSONB,
  -- {"day_of_week": "monday", "time": "08:00", "timezone": "America/New_York"}
  -- {"day_of_month": 1, "time": "09:00"}

  delivery_method TEXT NOT NULL DEFAULT 'email',
  -- 'email', 'download', 'webhook'

  delivery_config JSONB,
  -- {"email": "accounting@example.com", "format": "xlsx"}

  filters JSONB,
  -- Report filters (locations, date ranges, etc.)

  is_active BOOLEAN DEFAULT true,

  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_schedules_vendor
ON report_schedules(vendor_id, is_active);

CREATE INDEX idx_report_schedules_next_run
ON report_schedules(next_run_at) WHERE is_active = true;
```

### 2. Alter Existing Tables

```sql
-- Add analytics columns to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cost_of_goods NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gross_profit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5,2);

CREATE INDEX idx_orders_analytics
ON orders(vendor_id, order_date DESC, status)
WHERE status IN ('completed', 'processing');

-- Add analytics columns to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS profit_per_unit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5,2);

-- Add analytics columns to pos_transactions
ALTER TABLE pos_transactions
ADD COLUMN IF NOT EXISTS cost_of_goods NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gross_profit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES users(id);

CREATE INDEX idx_pos_transactions_analytics
ON pos_transactions(vendor_id, transaction_date DESC)
WHERE payment_status = 'completed';
```

### 3. Database Views

#### `v_daily_sales`
Unified view combining orders and POS transactions.

```sql
CREATE OR REPLACE VIEW v_daily_sales AS
WITH order_sales AS (
  SELECT
    o.vendor_id,
    o.pickup_location_id as location_id,
    DATE(o.order_date) as sale_date,
    o.employee_id,
    o.id as order_id,
    NULL::uuid as transaction_id,
    o.total_amount,
    o.subtotal,
    o.tax_amount,
    o.discount_amount,
    o.cost_of_goods,
    o.gross_profit,
    o.payment_method,
    0 as tip_amount,
    o.status
  FROM orders o
  WHERE o.status IN ('completed', 'processing')
),
pos_sales AS (
  SELECT
    pt.vendor_id,
    pt.location_id,
    DATE(pt.transaction_date) as sale_date,
    pt.employee_id,
    pt.order_id,
    pt.id as transaction_id,
    pt.total_amount,
    pt.subtotal,
    pt.tax_amount,
    pt.discount_amount,
    pt.cost_of_goods,
    pt.gross_profit,
    pt.payment_method,
    COALESCE(pt.tip_amount, 0) as tip_amount,
    pt.payment_status as status
  FROM pos_transactions pt
  WHERE pt.payment_status = 'completed'
)
SELECT * FROM order_sales
UNION ALL
SELECT * FROM pos_sales;
```

#### `v_product_performance`
Current product performance metrics.

```sql
CREATE OR REPLACE VIEW v_product_performance AS
SELECT
  p.id as product_id,
  p.vendor_id,
  p.name,
  p.primary_category_id,
  COUNT(DISTINCT oi.order_id) as order_count,
  SUM(oi.quantity) as units_sold,
  SUM(oi.line_total) as revenue,
  SUM(oi.line_total * COALESCE(p.cost_price, 0) / NULLIF(p.regular_price, 0)) as estimated_cost,
  SUM(oi.line_total) - SUM(oi.line_total * COALESCE(p.cost_price, 0) / NULLIF(p.regular_price, 0)) as estimated_profit,
  CASE
    WHEN SUM(oi.line_total) > 0
    THEN ((SUM(oi.line_total) - SUM(oi.line_total * COALESCE(p.cost_price, 0) / NULLIF(p.regular_price, 0))) / SUM(oi.line_total) * 100)
    ELSE 0
  END as margin_percentage
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.status = 'published'
GROUP BY p.id, p.vendor_id, p.name, p.primary_category_id;
```

---

## API Endpoints

### Base Structure

All analytics endpoints follow this pattern:
- **Base URL**: `/api/vendor/analytics`
- **Authentication**: Required (vendor JWT)
- **Rate Limiting**: 100 requests/minute per vendor
- **Caching**: 15-minute TTL on most endpoints

### Common Query Parameters

```typescript
interface AnalyticsQueryParams {
  // Required
  start_date: string;      // ISO date: '2025-01-01'
  end_date: string;        // ISO date: '2025-01-31'

  // Optional filters
  location_ids?: string;   // Comma-separated UUIDs
  employee_ids?: string;   // Comma-separated UUIDs
  category_ids?: string;   // Comma-separated UUIDs
  product_ids?: string;    // Comma-separated UUIDs

  // Optional grouping
  group_by?: 'day' | 'week' | 'month';

  // Optional comparison
  compare?: 'previous_period' | 'previous_year' | 'none';

  // Optional pagination
  page?: number;
  limit?: number;

  // Optional sorting
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
```

### Standard Response Format

```typescript
interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    start_date: string;
    end_date: string;
    total_records: number;
    page?: number;
    limit?: number;
    filters_applied: {
      locations?: string[];
      employees?: string[];
      categories?: string[];
    };
    comparison_period?: {
      start_date: string;
      end_date: string;
    };
  };
  summary?: {
    // Key aggregates
    total_revenue: number;
    total_orders: number;
    total_profit: number;
    avg_margin: number;
    // ... other totals
  };
  comparison?: {
    // Comparison vs previous period
    revenue_change: number;
    revenue_change_percent: number;
    orders_change: number;
    // ...
  };
}
```

---

## Endpoints Specification

### 1. Sales Reports

#### `GET /api/vendor/analytics/sales/overview`
Dashboard overview with key metrics.

**Response:**
```typescript
{
  success: true,
  data: {
    revenue: {
      total: 125000.00,
      change: 12.5,
      change_percent: 11.2,
      trend: [/* daily data */]
    },
    orders: {
      total: 856,
      change: -23,
      change_percent: -2.6,
      avg_value: 146.03
    },
    profit: {
      total: 65000.00,
      margin: 52.0
    },
    // ... more metrics
  }
}
```

#### `GET /api/vendor/analytics/sales/by-day`
Daily sales breakdown.

**Query Params:** Standard + `group_by=day|week|month`

**Response:**
```typescript
{
  success: true,
  data: [
    {
      date: "2025-01-01",
      gross_sales: 4250.00,
      net_sales: 4100.00,
      refunds: 150.00,
      orders: 42,
      avg_order_value: 97.62,
      items_per_order: 2.3,
      gross_profit: 2200.00,
      gross_margin: 53.66,
      tax_collected: 308.00,
      discounts_given: 425.00,
      payment_breakdown: {
        cash: 1200.00,
        card: 2900.00
      }
    },
    // ... more days
  ],
  summary: {
    total_gross_sales: 125000.00,
    total_net_sales: 122500.00,
    total_orders: 856,
    avg_daily_sales: 4285.71
  }
}
```

#### `GET /api/vendor/analytics/sales/by-location`
Sales comparison by location.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      location_id: "uuid",
      location_name: "Charlotte - Monroe",
      gross_sales: 82000.00,
      net_sales: 80500.00,
      orders: 523,
      avg_order_value: 153.92,
      gross_profit: 42640.00,
      gross_margin: 52.0,
      percent_of_total: 65.6
    },
    // ... more locations
  ]
}
```

#### `GET /api/vendor/analytics/sales/by-employee`
Employee performance report.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      employee_id: "uuid",
      employee_name: "Summer Ball",
      transactions: 2327,
      gross_sales: 136305.31,
      net_sales: 99321.21,
      avg_transaction: 39.79,
      items_per_transaction: 1.70,
      discounts_given: 43698.64,
      discount_percent: 32.05,
      gross_profit: 46115.00,
      gross_margin: 49.79,
      tips_collected: 608.24,
      payment_breakdown: {
        cash: 20162.75,
        card: 79158.46
      }
    },
    // ... more employees
  ]
}
```

#### `GET /api/vendor/analytics/sales/by-category`
Category performance breakdown.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      category_id: "uuid",
      category_name: "Bulk Flower",
      items_sold: 49479.28,
      gross_sales: 572034.53,
      net_sales: 406854.66,
      cost: 191941.75,
      profit: 214912.91,
      margin: 52.82,
      discount_amount: 165179.87,
      markdown_percent: 28.87,
      tax_amount: 27468.06,
      percent_of_total: 58.3
    },
    // ... more categories
  ]
}
```

#### `GET /api/vendor/analytics/sales/by-payment-method`
Payment method breakdown.

**Response:**
```typescript
{
  success: true,
  data: {
    cash: {
      amount: 35000.00,
      transactions: 280,
      avg_transaction: 125.00,
      percent: 28.0
    },
    card: {
      amount: 75000.00,
      transactions: 520,
      avg_transaction: 144.23,
      percent: 60.0
    },
    digital: {
      amount: 15000.00,
      transactions: 56,
      avg_transaction: 267.86,
      percent: 12.0
    }
  },
  summary: {
    total_amount: 125000.00,
    total_transactions: 856
  }
}
```

### 2. Product Reports

#### `GET /api/vendor/analytics/products/performance`
Product performance ranking.

**Query Params:** Standard + `sort_by=revenue|margin|units`

**Response:**
```typescript
{
  success: true,
  data: [
    {
      product_id: "uuid",
      product_name: "GMO",
      category: "Bulk Flower",
      units_sold: 1250.5,
      revenue: 35000.00,
      cost: 16500.00,
      profit: 18500.00,
      margin: 52.86,
      avg_price: 28.00,
      discount_given: 4200.00,
      markdown_percent: 12.0,
      orders: 456,
      stock_on_hand: 350.0,
      turnover_rate: 3.57
    },
    // ... more products
  ]
}
```

#### `GET /api/vendor/analytics/products/by-location`
Product performance by location.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      product_id: "uuid",
      product_name: "GMO",
      locations: [
        {
          location_id: "uuid",
          location_name: "Charlotte",
          units_sold: 650.0,
          revenue: 18200.00,
          percent_of_product: 52.0
        },
        // ... more locations
      ],
      total_units: 1250.5,
      total_revenue: 35000.00
    }
  ]
}
```

#### `GET /api/vendor/analytics/products/trends`
Product sales trends over time.

**Query Params:** Standard + `product_ids` + `group_by`

**Response:**
```typescript
{
  success: true,
  data: [
    {
      product_id: "uuid",
      product_name: "GMO",
      trend_data: [
        {
          date: "2025-01-01",
          units_sold: 45.5,
          revenue: 1260.00,
          orders: 18
        },
        // ... more dates
      ]
    }
  ]
}
```

#### `GET /api/vendor/analytics/products/itemized`
Itemized transaction details.

**Query Params:** Standard + pagination

**Response:**
```typescript
{
  success: true,
  data: [
    {
      transaction_id: "uuid",
      transaction_number: "ORD-12345",
      transaction_date: "2025-01-15T14:30:00Z",
      location_name: "Charlotte",
      employee_name: "Summer Ball",
      customer_id: "uuid",
      items: [
        {
          product_name: "GMO",
          category: "Bulk Flower",
          quantity: 3.5,
          unit_price: 28.00,
          line_total: 98.00,
          discount: 10.00,
          tax: 7.35
        }
      ],
      subtotal: 88.00,
      tax: 7.35,
      discount: 10.00,
      total: 85.35,
      payment_method: "card"
    },
    // ... more transactions
  ],
  metadata: {
    total_records: 5234,
    page: 1,
    limit: 50
  }
}
```

### 3. Financial Reports

#### `GET /api/vendor/analytics/financial/profit-loss`
P&L statement.

**Response:**
```typescript
{
  success: true,
  data: {
    revenue: {
      gross_sales: 125000.00,
      refunds: -2500.00,
      net_sales: 122500.00
    },
    cost_of_goods: 58800.00,
    gross_profit: 63700.00,
    gross_margin: 52.0,

    operating_expenses: {
      // Could include payroll, rent, etc. if tracked
      total: 15000.00
    },

    net_income: 48700.00,
    net_margin: 39.8
  },
  comparison: {
    // vs previous period
    revenue_change: 8.5,
    profit_change: 12.3
  }
}
```

#### `GET /api/vendor/analytics/financial/tax-report`
Tax collected by location and category.

**Response:**
```typescript
{
  success: true,
  data: {
    summary: {
      total_taxable_sales: 110000.00,
      total_tax_collected: 7975.00,
      total_tax_exempt: 12500.00,
      effective_rate: 7.25
    },
    by_location: [
      {
        location_name: "Charlotte",
        taxable_sales: 75000.00,
        tax_collected: 5437.50,
        tax_exempt: 8000.00,
        rate: 7.25
      }
    ],
    by_category: [
      {
        category_name: "Bulk Flower",
        taxable_sales: 85000.00,
        tax_collected: 6162.50,
        tax_exempt: 5000.00
      }
    ]
  }
}
```

#### `GET /api/vendor/analytics/financial/discount-analysis`
Discount and promotion effectiveness.

**Response:**
```typescript
{
  success: true,
  data: {
    summary: {
      total_discounts: 12500.00,
      discount_percent: 10.2,
      revenue_impact: -12500.00,
      orders_with_discount: 423,
      discount_rate: 49.4
    },
    by_type: [
      {
        discount_type: "Bulk Discount",
        amount: 8500.00,
        orders: 320,
        avg_discount: 26.56
      }
    ],
    by_product: [
      {
        product_name: "GMO",
        discount_amount: 2100.00,
        markdown_percent: 6.0
      }
    ]
  }
}
```

### 4. Employee Reports

#### `GET /api/vendor/analytics/employees/performance`
Employee performance summary (already covered in sales/by-employee).

#### `GET /api/vendor/analytics/employees/commissions`
Employee commission report.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      employee_id: "uuid",
      employee_name: "Summer Ball",
      sales: 99321.21,
      commission_rate: 3.0,
      commission_amount: 2979.64,
      transactions: 2327,
      location: "Charlotte"
    }
  ]
}
```

### 5. Location Reports

#### `GET /api/vendor/analytics/locations/comparison`
Side-by-side location comparison (covered in sales/by-location).

#### `GET /api/vendor/analytics/locations/profit-loss`
P&L by location.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      location_id: "uuid",
      location_name: "Charlotte",
      gross_sales: 82000.00,
      net_sales: 80500.00,
      cost_of_goods: 38640.00,
      gross_profit: 41860.00,
      gross_margin: 52.0,
      operating_expenses: 10000.00,
      net_income: 31860.00
    }
  ]
}
```

### 6. Session & Register Reports

#### `GET /api/vendor/analytics/sessions/summary`
POS session summaries.

**Query Params:** Standard + `location_ids`

**Response:**
```typescript
{
  success: true,
  data: [
    {
      session_id: "uuid",
      session_number: "SESS-001",
      location_name: "Charlotte",
      employee_name: "Summer Ball",
      opened_at: "2025-01-15T08:00:00Z",
      closed_at: "2025-01-15T17:00:00Z",
      opening_cash: 200.00,
      closing_cash: 1450.00,
      expected_cash: 1500.00,
      variance: -50.00,
      total_sales: 3200.00,
      total_transactions: 32,
      cash_sales: 1300.00,
      card_sales: 1900.00,
      refunds: 100.00
    }
  ]
}
```

#### `GET /api/vendor/analytics/sessions/reconciliation`
Cash drawer reconciliation report.

**Response:**
```typescript
{
  success: true,
  data: {
    session_id: "uuid",
    opening_cash: 200.00,
    cash_sales: 1300.00,
    cash_in: 0.00,
    cash_out: 50.00,
    expected_cash: 1450.00,
    actual_cash: 1430.00,
    variance: -20.00,
    variance_reason: "Customer shortchange",

    payment_breakdown: {
      cash: 1300.00,
      card: 1900.00,
      tips: 50.00
    },

    transactions: {
      total: 32,
      refunds: 2,
      voids: 1
    }
  }
}
```

### 7. Export & Scheduling

#### `POST /api/vendor/analytics/exports/generate`
Generate a report export.

**Request Body:**
```typescript
{
  report_type: 'sales_by_day',
  format: 'xlsx', // 'csv', 'pdf'
  filters: {
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    location_ids: ['uuid1', 'uuid2']
  }
}
```

**Response:**
```typescript
{
  success: true,
  export_id: "uuid",
  status: "processing",
  estimated_time: 30 // seconds
}
```

#### `GET /api/vendor/analytics/exports/:id`
Check export status and download.

**Response:**
```typescript
{
  success: true,
  export: {
    id: "uuid",
    status: "completed",
    file_url: "https://...",
    file_size: 125840,
    expires_at: "2025-01-22T00:00:00Z"
  }
}
```

#### `POST /api/vendor/analytics/schedules`
Create scheduled report.

**Request Body:**
```typescript
{
  name: "Daily Sales Report",
  report_type: "sales_by_day",
  schedule_type: "daily",
  schedule_config: {
    time: "08:00",
    timezone: "America/New_York"
  },
  delivery_method: "email",
  delivery_config: {
    email: "accounting@example.com",
    format: "xlsx"
  },
  filters: {
    location_ids: ["all"]
  }
}
```

---

## Backend Implementation

### Query Optimization Strategies

#### 1. Use Analytics Cache Tables
```typescript
// Prefer querying cache for date ranges
async function getDailySales(vendorId: string, startDate: Date, endDate: Date) {
  // Query cache first
  const { data: cacheData } = await supabase
    .from('analytics_daily_cache')
    .select('*')
    .eq('vendor_id', vendorId)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString());

  if (cacheData && cacheData.length > 0) {
    return cacheData;
  }

  // Fall back to calculating from transactions
  return calculateDailySales(vendorId, startDate, endDate);
}
```

#### 2. Background Cache Updates
```typescript
// Scheduled job: Update yesterday's cache
async function updateDailyCache() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const vendors = await getActiveVendors();

  for (const vendor of vendors) {
    await calculateAndCacheDailyMetrics(vendor.id, yesterday);
  }
}
```

#### 3. Parallel Queries
```typescript
async function getAnalyticsOverview(vendorId: string, dateRange: DateRange) {
  // Execute all queries in parallel
  const [revenue, orders, products, costs] = await Promise.all([
    getRevenueMetrics(vendorId, dateRange),
    getOrderMetrics(vendorId, dateRange),
    getProductMetrics(vendorId, dateRange),
    getCostMetrics(vendorId, dateRange)
  ]);

  return { revenue, orders, products, costs };
}
```

#### 4. Streaming for Large Exports
```typescript
async function exportToCSV(query: AnalyticsQuery) {
  const stream = createWriteStream('report.csv');
  const csvWriter = createCsvWriter(stream);

  // Stream results in batches
  for await (const batch of queryInBatches(query)) {
    csvWriter.writeRecords(batch);
  }

  return uploadToS3(stream);
}
```

### Cron Jobs

```typescript
// /lib/scheduled-tasks.ts

// 1. Update daily cache (runs at 1 AM daily)
export const updateDailyCacheJob = {
  schedule: '0 1 * * *',
  task: updateDailyCache
};

// 2. Update product cache (runs every 6 hours)
export const updateProductCacheJob = {
  schedule: '0 */6 * * *',
  task: updateProductCache
};

// 3. Process scheduled reports (runs every hour)
export const processScheduledReportsJob = {
  schedule: '0 * * * *',
  task: processScheduledReports
};

// 4. Clean up expired exports (runs daily at 3 AM)
export const cleanupExportsJob = {
  schedule: '0 3 * * *',
  task: cleanupExpiredExports
};
```

---

## Frontend Implementation

### Component Structure

```
app/vendor/analytics/
├── page.tsx                     # Main analytics page
├── components/
│   ├── AnalyticsHeader.tsx     # Date range, filters, export
│   ├── QuickMetrics.tsx        # Stat cards
│   ├── ReportGrid.tsx          # Report cards/list
│   ├── ReportCard.tsx          # Individual report preview
│   ├── ExportButton.tsx        # Export dropdown
│   └── ScheduleModal.tsx       # Schedule report modal
├── reports/
│   ├── [reportType]/
│   │   └── page.tsx            # Individual report page
│   ├── sales-by-day/
│   ├── product-performance/
│   ├── employee-performance/
│   └── ...
└── hooks/
    ├── useAnalytics.ts         # Main analytics hook
    ├── useReportExport.ts      # Export hook
    └── useReportSchedule.ts    # Schedule hook
```

### Key Hooks

```typescript
// hooks/useAnalytics.ts
export function useAnalytics(
  reportType: string,
  filters: AnalyticsFilters
) {
  const { data, loading, error } = useSWR(
    [`/api/vendor/analytics/${reportType}`, filters],
    ([url, filters]) => fetchAnalytics(url, filters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15 * 60 * 1000 // 15 minutes
    }
  );

  return { data, loading, error };
}

// hooks/useReportExport.ts
export function useReportExport() {
  const [exporting, setExporting] = useState(false);

  const exportReport = async (
    reportType: string,
    format: string,
    filters: any
  ) => {
    setExporting(true);

    // Request export
    const { export_id } = await fetch('/api/vendor/analytics/exports/generate', {
      method: 'POST',
      body: JSON.stringify({ report_type: reportType, format, filters })
    }).then(r => r.json());

    // Poll for completion
    const result = await pollExportStatus(export_id);

    setExporting(false);

    // Trigger download
    window.location.href = result.file_url;
  };

  return { exportReport, exporting };
}
```

### Chart Components

```typescript
// Use recharts for visualizations
import { LineChart, BarChart, PieChart } from 'recharts';

// Example: Sales trend chart
<LineChart data={salesData} width={800} height={300}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="revenue"
    stroke="#3B82F6"
    strokeWidth={2}
  />
</LineChart>
```

---

## Testing Plan

### Unit Tests
- Analytics query builders
- Date range calculations
- Metric aggregations
- Export formatters

### Integration Tests
- API endpoint responses
- Database views
- Cache updates
- Report generation

### E2E Tests
- Complete report workflows
- Export functionality
- Scheduled reports
- Multi-location filtering

---

## Performance Targets

- **API Response Time**: < 500ms for cached queries, < 2s for fresh queries
- **Export Generation**: < 30s for standard reports, < 2min for large exports
- **Real-time Updates**: < 5s latency for new transactions
- **Cache Hit Rate**: > 80% for common date ranges

---

## Security Considerations

- **RLS Policies**: All queries respect vendor ownership
- **Employee Access**: Limit sensitive financial data by role
- **Export Expiry**: Auto-delete exports after 7 days
- **Audit Logging**: Log all export and schedule actions
- **Rate Limiting**: Prevent abuse of export generation

---

## Next Steps

1. **Phase 1**: Build database schema and core APIs
2. **Phase 2**: Implement caching and background jobs
3. **Phase 3**: Build frontend components and reports
4. **Phase 4**: Add export and scheduling features
5. **Phase 5**: Polish UI/UX and add visualizations
6. **Phase 6**: Testing and optimization

---

**This specification provides everything needed to build a world-class analytics system that accountants will love.**
