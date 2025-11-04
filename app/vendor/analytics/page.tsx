"use client";

import { useState } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Activity,
  Target,
  AlertCircle,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from '@/lib/icons';
import { useVendorAnalytics } from '@/hooks/useVendorData';
import { StatCard } from '@/components/ui/StatCard';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { AnalyticsPageWrapper } from '@/components/analytics/AnalyticsPageWrapper';
import type { VendorAnalyticsData, TimeRange, TrendData } from '@/types/analytics';
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
} from '@/lib/analytics-utils';
import { createDefaultVendorAnalytics, mergeWithDefaults } from '@/lib/analytics-defaults';

function VendorAnalyticsContent() {
  const { vendor } = useAppAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data: analyticsResponse, loading, error, refetch } = useVendorAnalytics(timeRange);

  // Type-safe data extraction with defaults
  // API returns { success: true, analytics: {...} }
  const analytics: VendorAnalyticsData = mergeWithDefaults(
    (analyticsResponse as any)?.analytics || null,
    createDefaultVendorAnalytics()
  );

  // Helper to normalize trend data (handle both old number format and new TrendData format)
  const normalizeTrend = (trend: number | TrendData): TrendData => {
    if (typeof trend === 'number') {
      return {
        value: 0,
        change: trend,
        changePercent: trend,
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral',
      };
    }
    return trend;
  };

  // Render trend indicator helper
  const renderTrendIndicator = (trend: number | TrendData) => {
    const trendData = normalizeTrend(trend);

    if (trendData.direction === 'neutral') {
      return (
        <div className="flex items-center gap-1 text-white/40 text-xs font-bold">
          <Minus className="w-3 h-3" />
          0%
        </div>
      );
    }

    const isPositive = trendData.direction === 'up';
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div className={`flex items-center gap-1 ${color} text-xs font-bold`}>
        <Icon className="w-3 h-3" />
        {formatPercentage(Math.abs(trendData.changePercent), { decimals: 0, showSign: false })}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full px-4 lg:px-0 py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
          <p className="mt-4 text-white/40">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full px-4 lg:px-0 py-12">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error.message || 'Failed to load analytics'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show UI with default values if no data (better UX than error)
  const hasData = analyticsResponse !== null && analyticsResponse !== undefined;

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
            Advanced Analytics
          </h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
            Performance Insights · {vendor?.store_name?.toUpperCase()}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[
            { label: '7D', value: '7d' },
            { label: '30D', value: '30d' },
            { label: '90D', value: '90d' },
            { label: '1Y', value: '1y' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 border rounded-2xl ${
                timeRange === range.value
                  ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border-white/20'
                  : 'bg-black/20 text-white/50 border-white/10 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 spacing-grid mb-8">
        <StatCard
          label="Revenue"
          value={formatCurrency(analytics.revenue.total, { showCents: true })}
          sublabel="Total revenue"
          icon={DollarSign}
          delay="0s"
          trend={{
            value: formatPercentage(Math.abs(normalizeTrend(analytics.revenue.trend).changePercent), { decimals: 0 }),
            direction: normalizeTrend(analytics.revenue.trend).direction
          }}
        />
        <StatCard
          label="Profit Margin"
          value={formatPercentage(analytics.costs.avgMargin, { decimals: 1 })}
          sublabel="Average across catalog"
          icon={Target}
          delay="0.1s"
        />
        <StatCard
          label="Turnover Rate"
          value={`${analytics.inventory.turnoverRate.toFixed(1)}x`}
          sublabel="Annual rate"
          icon={Activity}
          delay="0.2s"
        />
        <StatCard
          label="Avg Order"
          value={formatCurrency(analytics.orders.avgValue, { showCents: true })}
          sublabel="Per transaction"
          icon={ShoppingCart}
          delay="0.3s"
          trend={{
            value: formatPercentage(Math.abs(normalizeTrend(analytics.orders.trend).changePercent), { decimals: 0 }),
            direction: normalizeTrend(analytics.orders.trend).direction
          }}
        />
      </div>

      {/* Revenue Chart */}
      <div className="minimal-glass subtle-glow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Revenue Trend</h3>
            <p className="text-white/30 text-[10px] font-light">DAILY BREAKDOWN</p>
          </div>
        </div>
        <TimeSeriesChart
          data={analytics.revenue.data.map(d => ({
            date: d.date,
            sent: 0,
            opened: 0,
            clicked: 0,
            revenue: d.amount
          }))}
          activeMetric="revenue"
          height={256}
          className="mt-4"
        />
      </div>

      {/* Top Products */}
      <div className="minimal-glass subtle-glow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Top Performers</h3>
            <p className="text-white/30 text-[10px] font-light">HIGHEST MARGIN PRODUCTS</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {analytics.products.topPerformers.length === 0 ? (
            <div className="text-center text-white/40 py-8 text-xs">No product data available</div>
          ) : (
            analytics.products.topPerformers.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/[0.01] transition-all duration-300 px-4 -mx-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/40 text-xs font-light border border-white/10">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="text-white text-sm font-light mb-1">{product.name}</div>
                    <div className="text-white/40 text-xs">{formatNumber(product.units)} units sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-light mb-1">{formatCurrency(product.revenue)}</div>
                  <div className="text-green-500 text-xs">{formatPercentage(product.margin, { decimals: 1 })} margin</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="grid lg:grid-cols-2 spacing-grid">
        <div className="minimal-glass subtle-glow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Cost Analysis</h3>
              <p className="text-white/30 text-[10px] font-light">PROFITABILITY METRICS</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Total COGS</span>
              <span className="text-white font-light">{formatCurrency(analytics.costs.totalCost)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Gross Profit</span>
              <span className="text-white font-light">
                {formatCurrency(analytics.costs.grossProfit ?? (analytics.revenue.total - analytics.costs.totalCost))}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Profit Margin</span>
              <span className="text-green-500 font-light">{formatPercentage(analytics.costs.avgMargin, { decimals: 1 })}</span>
            </div>
          </div>
        </div>

        <div className="minimal-glass subtle-glow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Inventory Health</h3>
              <p className="text-white/30 text-[10px] font-light">STOCK METRICS</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Stock Value</span>
              <span className="text-white font-light">{formatCurrency(analytics.inventory.stockValue)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Turnover Rate</span>
              <span className="text-white font-light">{analytics.inventory.turnoverRate.toFixed(1)}x / year</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Low Stock Items</span>
              {analytics.inventory.lowStockCount > 0 ? (
                <span className="text-yellow-500 font-light flex items-center gap-2">
                  <AlertCircle size={14} strokeWidth={1.5} />
                  {formatNumber(analytics.inventory.lowStockCount)}
                </span>
              ) : (
                <span className="text-green-500 font-light">All Good</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function VendorAnalytics() {
  return (
    <AnalyticsPageWrapper>
      <VendorAnalyticsContent />
    </AnalyticsPageWrapper>
  );
}
