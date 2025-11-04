# Analytics Quick Reference Guide

## 📁 File Structure

```
analytics/
├── types/
│   └── analytics.ts                 # ALL type definitions
├── lib/
│   └── analytics-utils.ts           # Pure utility functions
├── components/
│   └── analytics/
│       └── TimeSeriesChart.tsx      # Reusable chart component
├── app/
│   ├── vendor/
│   │   ├── analytics/
│   │   │   └── page.tsx             # Main vendor analytics UI
│   │   └── marketing/
│   │       └── analytics/
│   │           └── page.tsx         # Marketing analytics UI
│   └── api/
│       └── vendor/
│           ├── analytics/
│           │   ├── route.ts         # Main analytics API
│           │   ├── overview/
│           │   ├── sales-trend/
│           │   └── products/
│           └── marketing/
│               └── analytics/
│                   └── route.ts     # Marketing analytics API
└── hooks/
    └── useVendorData.ts             # Data fetching hook
```

---

## 🎯 Quick Start Cheatsheet

### **Import Common Utilities**
```typescript
import {
  // Formatting
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,

  // Calculations
  calculateTrend,
  calculatePercentage,
  calculateAverage,
  calculateGrowthRate,

  // Dates
  getStartDate,
  getComparisonPeriod,

  // Validation
  isValidTimeRange,
  isValidVendorId,

  // Data transformation
  groupByDate,
  fillMissingDates,
  safeParseFloat,
  safeParseInt,
} from '@/lib/analytics-utils';
```

### **Import Types**
```typescript
import type {
  // Main types
  MarketingAnalyticsData,
  VendorAnalyticsData,

  // Metric types
  CampaignOverview,
  ChannelPerformance,
  Campaign,
  TrendData,

  // Utility types
  TimeRange,
  ChannelType,
  DateRange,

  // Component props
  StatCardProps,
  ChartConfig,
} from '@/types/analytics';
```

### **Import Components**
```typescript
import { TimeSeriesChart, MultiMetricChart } from '@/components/analytics/TimeSeriesChart';
import { StatCard } from '@/components/ui/StatCard';
```

---

## 🔧 Common Patterns

### **1. Formatting Numbers**

```typescript
// Currency
formatCurrency(1234.56)                    // "$1,234.56"
formatCurrency(1234.56, { decimals: 0 })   // "$1,235"
formatCurrency(1234.56, { showCents: false }) // "$1,235"
formatCurrency(1500000, { compact: true }) // "$1.5M"

// Percentages
formatPercentage(23.456)                   // "23.5%"
formatPercentage(23.456, { decimals: 2 })  // "23.46%"
formatPercentage(5.2, { showSign: true })  // "+5.2%"

// Numbers
formatNumber(1234)                         // "1,234"
formatNumber(1234, { decimals: 2 })        // "1,234.00"
formatNumber(1500000, { compact: true })   // "1.5M"

// Dates
formatDate('2024-01-15')                   // "Jan 15"
formatDate('2024-01-15', 'long')           // "January 15, 2024"
```

---

### **2. Calculating Trends**

```typescript
// Simple trend
const trend = calculateTrend(currentValue, previousValue);
// Returns:
// {
//   value: 150,
//   change: 50,           // 150 - 100
//   changePercent: 50,    // (50 / 100) * 100
//   direction: 'up'       // 'up' | 'down' | 'neutral'
// }

// Percentage of total
const percentage = calculatePercentage(part, total);
// calculatePercentage(25, 100) => 25

// Average
const avg = calculateAverage([10, 20, 30, 40]);  // 25

// Period-over-period growth
const growth = calculatePeriodGrowth(timeSeriesData);
```

---

### **3. Date Handling**

```typescript
// Get start date for a time range
const startDate = getStartDate('30d');     // 30 days ago
const startDate = getStartDate('7d');      // 7 days ago
const startDate = getStartDate('1y');      // 1 year ago

// Get comparison period
const comparisonPeriod = getComparisonPeriod('30d');
// Returns: { start: Date (60 days ago), end: Date (31 days ago) }

// Validate time range
if (isValidTimeRange(range)) {
  // range is '7d' | '30d' | '90d' | '1y' | 'all'
}
```

---

### **4. Safe Parsing**

```typescript
// Instead of parseFloat(value || '0')
const amount = safeParseFloat(databaseValue, 0);  // Default: 0
const count = safeParseInt(databaseValue, 0);     // Default: 0

// Handles: null, undefined, '', NaN, actual numbers
safeParseFloat(null)          // 0
safeParseFloat('123.45')      // 123.45
safeParseFloat('invalid')     // 0
safeParseFloat(undefined, 10) // 10 (custom default)
```

---

### **5. Data Fetching**

```typescript
// Using the hook
import { useVendorAnalytics } from '@/hooks/useVendorData';

const { data, loading, error, refetch } = useVendorAnalytics('30d');

// Manual fetch
const response = await fetch(
  `/api/vendor/marketing/analytics?range=30d&channel=all`,
  { headers: { 'x-vendor-id': vendor.id } }
);
const data: MarketingAnalyticsData = await response.json();
```

---

### **6. Rendering Trends**

```typescript
// Helper function
const renderTrendIndicator = (trend: TrendData) => {
  if (trend.direction === 'neutral') {
    return (
      <div className="flex items-center gap-1 text-white/40 text-xs font-bold">
        <Minus className="w-3 h-3" />
        0%
      </div>
    );
  }

  const isPositive = trend.direction === 'up';
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={`flex items-center gap-1 ${color} text-xs font-bold`}>
      <Icon className="w-3 h-3" />
      {formatPercentage(Math.abs(trend.changePercent), { decimals: 0 })}
    </div>
  );
};

// Usage
<StatCard
  label="Revenue"
  value={formatCurrency(overview.totalRevenue)}
  trend={renderTrendIndicator(overview.trends.revenue)}
/>
```

---

### **7. Using Charts**

```typescript
// Single metric chart
<TimeSeriesChart
  data={timeSeries}
  activeMetric="revenue"
  height={320}
  showLegend={false}
/>

// Multi-metric chart
<MultiMetricChart
  data={timeSeries}
  metrics={['sent', 'opened', 'clicked']}
  height={400}
/>

// With state for metric switching
const [activeMetric, setActiveMetric] = useState<'sent' | 'opened' | 'clicked' | 'revenue'>('revenue');

<TimeSeriesChart
  data={timeSeries}
  activeMetric={activeMetric}
  height={320}
/>
```

---

## 🎨 Styling Patterns

### **Stat Cards**
```typescript
// Gradient background with icon
<div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
    <Icon className="w-5 h-5 text-blue-400" />
  </div>
  <div className="text-2xl font-black text-white mb-1">
    {formatNumber(value)}
  </div>
  <div className="text-xs uppercase tracking-wider text-white/60">
    Label
  </div>
</div>
```

### **Glass Panels**
```typescript
<div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
  {/* Content */}
</div>
```

### **Buttons**
```typescript
// Active state
className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg"

// Inactive state
className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-lg transition-all"
```

---

## ⚡ Performance Tips

### **1. Use Parallel Queries**
```typescript
// ❌ Bad: Sequential
const emailData = await getEmailCampaigns(...);
const smsData = await getSMSCampaigns(...);

// ✅ Good: Parallel
const [emailData, smsData] = await Promise.all([
  getEmailCampaigns(...),
  getSMSCampaigns(...),
]);
```

### **2. Select Only Needed Fields**
```typescript
// ❌ Bad
.select('*')

// ✅ Good
.select('id, name, total_revenue, total_sent, created_at')
```

### **3. Use Memoization**
```typescript
import { useMemo } from 'react';

const chartData = useMemo(() => {
  return data.map(d => ({
    ...d,
    displayDate: formatDate(d.date),
  }));
}, [data]);
```

---

## 🐛 Common Gotchas

### **1. Percentage Calculations**
```typescript
// ❌ Wrong: Returns decimal (0.25)
const rate = opened / sent;

// ✅ Correct: Use utility
const rate = calculatePercentage(opened, sent) / 100;  // Returns 25
```

### **2. Trend Direction**
```typescript
// ❌ Wrong: No neutral state
direction: change > 0 ? 'up' : 'down'

// ✅ Correct: Handle zero
direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
```

### **3. Empty Arrays**
```typescript
// ❌ Wrong: Division by zero
const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;

// ✅ Correct: Guard clause
const avg = data.length > 0
  ? data.reduce((sum, d) => sum + d.value, 0) / data.length
  : 0;

// ✅ Better: Use utility
const avg = calculateAverage(data.map(d => d.value));
```

---

## 🧪 Testing Utilities

```typescript
import {
  calculateTrend,
  calculatePercentage,
  safeParseFloat
} from '@/lib/analytics-utils';

describe('Analytics Utils', () => {
  it('calculates trend correctly', () => {
    const trend = calculateTrend(150, 100);
    expect(trend.changePercent).toBe(50);
    expect(trend.direction).toBe('up');
  });

  it('handles division by zero', () => {
    const percentage = calculatePercentage(10, 0);
    expect(percentage).toBe(0);
  });

  it('parses safely', () => {
    expect(safeParseFloat(null)).toBe(0);
    expect(safeParseFloat('123.45')).toBe(123.45);
    expect(safeParseFloat('invalid')).toBe(0);
  });
});
```

---

## 📋 API Response Examples

### **Marketing Analytics**
```typescript
{
  overview: {
    totalCampaigns: 42,
    totalSent: 15000,
    totalOpened: 3750,
    totalClicked: 525,
    totalRevenue: 12500,
    avgOpenRate: 0.25,        // 25%
    avgClickRate: 0.035,      // 3.5%
    revenuePerCampaign: 297.62,
    trends: {
      campaigns: {
        value: 42,
        change: 8,
        changePercent: 23.5,
        direction: 'up'
      },
      // ... more trends
    }
  },
  channelPerformance: {
    email: { campaigns: 30, sent: 10000, ... },
    sms: { campaigns: 12, sent: 5000, ... }
  },
  topCampaigns: [
    {
      id: 'uuid',
      name: 'Summer Sale',
      type: 'email',
      sentAt: '2024-01-15',
      sent: 1000,
      opened: 250,
      clicked: 35,
      revenue: 1500,
      openRate: 0.25,
      clickRate: 0.035,
      conversionRate: 0.035
    },
    // ... more campaigns
  ],
  timeSeries: [
    { date: '2024-01-01', sent: 500, opened: 125, clicked: 18, revenue: 750 },
    // ... more data points
  ]
}
```

---

## 🎯 Best Practices

1. **Always use type definitions** - Import from `/types/analytics.ts`
2. **Use utility functions** - Don't rewrite calculations
3. **Handle loading/error states** - Users should always see something
4. **Format all numbers** - Use `formatCurrency`, `formatNumber`, `formatPercentage`
5. **Validate inputs** - Use `isValidTimeRange`, `isValidVendorId`
6. **Safe parsing** - Use `safeParseFloat` / `safeParseInt`
7. **Parallel queries** - Use `Promise.all` when possible
8. **Memoize expensive calculations** - Use `useMemo`
9. **Consistent styling** - Follow existing patterns
10. **Real data only** - Never hardcode metrics

---

## 🆘 Troubleshooting

### **"Data is undefined"**
```typescript
// ❌ Wrong
const rate = data.overview.avgOpenRate * 100;

// ✅ Correct
if (!data) return <LoadingState />;
const { overview } = data;
const rate = overview.avgOpenRate * 100;
```

### **"Trend is showing NaN%"**
```typescript
// Likely division by zero - use utilities:
const trend = calculateTrend(current, previous);
// Handles previous === 0 safely
```

### **"Chart not rendering"**
```typescript
// Check:
1. Is data array empty? Component shows empty state
2. Is data formatted correctly? Use console.log
3. Are Recharts components lazy-loaded? (They are in analytics/page.tsx)
```

---

**Built for speed, maintainability, and developer happiness.**

*Questions? Check the main summary doc or the source code - it's well-commented!*
