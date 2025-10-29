"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppAuth } from '@/context/AppAuthContext';
import {
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart,
  Users, BarChart3, Activity, Target, AlertCircle
} from '@/lib/icons';
import { useVendorAnalytics } from '@/hooks/useVendorData';
import { StatCard } from '@/components/ui/StatCard';

// Lazy load charts for better performance
const LineChart = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(m => ({ default: m.AreaChart })), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => ({ default: m.BarChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => ({ default: m.Line })), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => ({ default: m.Area })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => ({ default: m.Bar })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });

interface AnalyticsData {
  revenue: {
    total: number;
    trend: number;
    data: Array<{ date: string; amount: number }>;
  };
  orders: {
    total: number;
    trend: number;
    avgValue: number;
  };
  products: {
    total: number;
    topPerformers: Array<{ id: string; name: string; revenue: number; units: number; margin: number }>;
  };
  costs: {
    totalCost: number;
    avgMargin: number;
    profitability: number;
  };
  inventory: {
    turnoverRate: number;
    stockValue: number;
    lowStockCount: number;
  };
}

export default function VendorAnalytics() {
  const { vendor } = useAppAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const { data: analyticsResponse, loading } = useVendorAnalytics(timeRange);
  
  const analytics: AnalyticsData = (analyticsResponse as any)?.analytics || {
    revenue: { total: 0, trend: 0, data: [] },
    orders: { total: 0, trend: 0, avgValue: 0 },
    products: { total: 0, topPerformers: [] },
    costs: { totalCost: 0, avgMargin: 0, profitability: 0 },
    inventory: { turnoverRate: 0, stockValue: 0, lowStockCount: 0 },
  };

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
          value={loading ? '—' : `$${analytics.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sublabel={`${Math.abs(analytics.revenue.trend)}% vs last period`}
          icon={DollarSign}
          loading={loading}
          delay="0s"
          trend={analytics.revenue.trend !== 0 ? {
            value: `${Math.abs(analytics.revenue.trend)}%`,
            direction: analytics.revenue.trend > 0 ? 'up' : 'down'
          } : undefined}
        />
        <StatCard
          label="Profit Margin"
          value={loading ? '—' : `${analytics.costs.avgMargin.toFixed(1)}%`}
          sublabel="Average across catalog"
          icon={Target}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="Turnover Rate"
          value={loading ? '—' : `${analytics.inventory.turnoverRate.toFixed(1)}x`}
          sublabel="Annual rate"
          icon={Activity}
          loading={loading}
          delay="0.2s"
        />
        <StatCard
          label="Avg Order"
          value={loading ? '—' : `$${analytics.orders.avgValue.toFixed(2)}`}
          sublabel="Per transaction"
          icon={ShoppingCart}
          loading={loading}
          delay="0.3s"
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
        <div className="h-64">
          {loading || analytics.revenue.data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/20 text-xs font-light">LOADING CHART DATA...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenue.data}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff40" 
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#ffffff40" 
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000000', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#ffffff80' }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
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
          {loading ? (
            <div className="text-center text-white/40 py-8 text-xs">Loading products...</div>
          ) : analytics.products.topPerformers.length === 0 ? (
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
                    <div className="text-white/40 text-xs">{product.units} units sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-light mb-1">${product.revenue.toFixed(2)}</div>
                  <div className="text-green-500 text-xs">{product.margin.toFixed(1)}% margin</div>
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
              <span className="text-white font-light">${analytics.costs.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Gross Profit</span>
              <span className="text-white font-light">${(analytics.revenue.total - analytics.costs.totalCost).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-white/60 text-xs font-light tracking-wide uppercase">Profit Margin</span>
              <span className="text-green-500 font-light">{analytics.costs.avgMargin.toFixed(1)}%</span>
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
              <span className="text-white font-light">${analytics.inventory.stockValue.toFixed(2)}</span>
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
                  {analytics.inventory.lowStockCount}
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

