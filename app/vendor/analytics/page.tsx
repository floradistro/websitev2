"use client";

import { useEffect, useState } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, BarChart3, Activity, Target, AlertCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const { vendor } = useVendorAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 0, trend: 0, data: [] },
    orders: { total: 0, trend: 0, avgValue: 0 },
    products: { total: 0, topPerformers: [] },
    costs: { totalCost: 0, avgMargin: 0, profitability: 0 },
    inventory: { turnoverRate: 0, stockValue: 0, lowStockCount: 0 },
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const response = await fetch(`/api/vendor/analytics?vendor_id=${vendorId}&range=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full px-4 lg:px-0">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Header */}
      <div className="mb-12 fade-in flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
            Advanced Analytics
          </h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            PERFORMANCE INSIGHTS · {vendor?.store_name?.toUpperCase()}
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
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 border rounded-[14px] ${
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {/* Revenue */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Revenue</span>
            <DollarSign size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            ${loading ? '—' : analytics.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2">
            {analytics.revenue.trend > 0 ? (
              <TrendingUp size={12} className="text-green-500" strokeWidth={1.5} />
            ) : (
              <TrendingDown size={12} className="text-red-500" strokeWidth={1.5} />
            )}
            <span className={`text-[10px] font-light ${analytics.revenue.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(analytics.revenue.trend)}% vs last period
            </span>
          </div>
        </div>

        {/* Average Margin */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Profit Margin</span>
            <Target size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            {loading ? '—' : analytics.costs.avgMargin.toFixed(1)}%
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">
            Average across catalog
          </div>
        </div>

        {/* Inventory Turnover */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Turnover Rate</span>
            <Activity size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            {loading ? '—' : analytics.inventory.turnoverRate.toFixed(1)}x
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">
            Annual rate
          </div>
        </div>

        {/* Average Order Value */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Avg Order</span>
            <ShoppingCart size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            ${loading ? '—' : analytics.orders.avgValue.toFixed(2)}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">
            Per transaction
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="minimal-glass subtle-glow p-6 mb-8 fade-in" style={{ animationDelay: '0.4s' }}>
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
      <div className="minimal-glass subtle-glow p-6 mb-8 fade-in" style={{ animationDelay: '0.5s' }}>
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
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="minimal-glass subtle-glow p-6 fade-in" style={{ animationDelay: '0.6s' }}>
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

        <div className="minimal-glass subtle-glow p-6 fade-in" style={{ animationDelay: '0.7s' }}>
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

