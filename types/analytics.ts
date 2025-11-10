/**
 * Analytics Type Definitions
 * Central source of truth for all analytics-related types
 */

// ============================================================================
// Common Types
// ============================================================================

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";
export type ChannelType = "email" | "sms" | "all";
export type PeriodType = "daily" | "weekly" | "monthly";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TrendData {
  value: number;
  change: number;
  changePercent: number;
  direction: "up" | "down" | "neutral";
}

// ============================================================================
// Vendor Analytics Types
// ============================================================================

export interface RevenueMetrics {
  total: number;
  trend: number | TrendData; // Support both old (number) and new (TrendData) formats
  data: RevenueDataPoint[];
}

export interface RevenueDataPoint {
  date: string;
  amount: number;
  orders?: number;
}

export interface OrderMetrics {
  total: number;
  trend: number | TrendData; // Support both old (number) and new (TrendData) formats
  avgValue: number;
  avgItems?: number; // Optional for backward compatibility
}

export interface ProductPerformer {
  id: string;
  name: string;
  revenue: number;
  units: number;
  margin: number;
  category?: string;
}

export interface ProductMetrics {
  total: number;
  topPerformers: ProductPerformer[];
  underPerformers: ProductPerformer[];
}

export interface CostMetrics {
  totalCost: number;
  avgMargin: number;
  profitability: number;
  grossProfit?: number; // Optional for backward compatibility
}

export interface InventoryMetrics {
  turnoverRate: number;
  stockValue: number;
  lowStockCount: number;
  daysOfInventory: number;
}

export interface VendorAnalyticsData {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  products: ProductMetrics;
  costs: CostMetrics;
  inventory: InventoryMetrics;
  comparisonPeriod?: {
    revenue: number;
    orders: number;
    margin: number;
  };
}

// ============================================================================
// Marketing Analytics Types
// ============================================================================

export interface CampaignOverview {
  totalCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalRevenue: number;
  avgOpenRate: number;
  avgClickRate: number;
  revenuePerCampaign: number;
  trends: {
    campaigns: TrendData;
    openRate: TrendData;
    clickRate: TrendData;
    revenue: TrendData;
  };
}

export interface ChannelPerformance {
  campaigns: number;
  sent: number;
  opened?: number;
  delivered?: number;
  clicked: number;
  revenue: number;
  conversionRate: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: "email" | "sms";
  sentAt: string;
  sent: number;
  opened: number;
  clicked: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  revenue: number;
}

export interface MarketingAnalyticsData {
  overview: CampaignOverview;
  channelPerformance: {
    email: ChannelPerformance;
    sms: ChannelPerformance;
  };
  topCampaigns: Campaign[];
  timeSeries: TimeSeriesDataPoint[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AnalyticsApiResponse {
  success: boolean;
  analytics: VendorAnalyticsData;
}

export interface MarketingAnalyticsApiResponse extends MarketingAnalyticsData {}

// ============================================================================
// Component Props Types
// ============================================================================

export interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ComponentType<any>;
  loading?: boolean;
  delay?: string;
}

export interface ChartConfig {
  height: number;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
  animate?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  field: string;
  order: "asc" | "desc";
}

export interface FilterParams {
  dateRange?: DateRange;
  categories?: string[];
  minRevenue?: number;
  maxRevenue?: number;
}
