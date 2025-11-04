/**
 * Default Analytics Data
 * Provides safe default values to prevent undefined errors
 */

import type { VendorAnalyticsData, MarketingAnalyticsData, TrendData } from '@/types/analytics';

/**
 * Create default trend data
 */
export function createDefaultTrend(): TrendData {
  return {
    value: 0,
    change: 0,
    changePercent: 0,
    direction: 'neutral',
  };
}

/**
 * Create default vendor analytics data
 */
export function createDefaultVendorAnalytics(): VendorAnalyticsData {
  return {
    revenue: {
      total: 0,
      trend: createDefaultTrend(),
      data: [],
    },
    orders: {
      total: 0,
      trend: createDefaultTrend(),
      avgValue: 0,
    },
    products: {
      total: 0,
      topPerformers: [],
      underPerformers: [],
    },
    costs: {
      totalCost: 0,
      avgMargin: 0,
      profitability: 0,
      grossProfit: 0,
    },
    inventory: {
      turnoverRate: 0,
      stockValue: 0,
      lowStockCount: 0,
      daysOfInventory: 0,
    },
  };
}

/**
 * Create default marketing analytics data
 */
export function createDefaultMarketingAnalytics(): MarketingAnalyticsData {
  return {
    overview: {
      totalCampaigns: 0,
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalRevenue: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      revenuePerCampaign: 0,
      trends: {
        campaigns: createDefaultTrend(),
        openRate: createDefaultTrend(),
        clickRate: createDefaultTrend(),
        revenue: createDefaultTrend(),
      },
    },
    channelPerformance: {
      email: {
        campaigns: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        revenue: 0,
        conversionRate: 0,
      },
      sms: {
        campaigns: 0,
        sent: 0,
        delivered: 0,
        clicked: 0,
        revenue: 0,
        conversionRate: 0,
      },
    },
    topCampaigns: [],
    timeSeries: [],
  };
}

/**
 * Merge partial analytics data with defaults
 */
export function mergeWithDefaults<T extends object>(
  data: Partial<T> | null | undefined,
  defaults: T
): T {
  if (!data) return defaults;

  return {
    ...defaults,
    ...data,
  } as T;
}
