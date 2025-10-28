"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topVendor: 'Loading...',
    topProduct: 'Loading...',
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);

        // Fetch real analytics from API
        const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
        
        if (response.ok) {
          const data = await response.json();
          
          setStats({
            totalRevenue: data.stats?.totalRevenue || 0,
            totalOrders: data.stats?.totalOrders || 0,
            avgOrderValue: data.stats?.avgOrderValue || 0,
            topVendor: data.stats?.topVendor || 'No data',
            topProduct: data.stats?.topProduct || 'No data'
          });

          setRevenueData(data.revenueData || []);
          setCategoryData(data.categoryData || []);
        } else {
          console.error('Failed to fetch analytics');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="w-full px-4 lg:px-0">
      

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
          Insights
        </h1>
        <p className="text-white/40 text-xs font-light tracking-wide">
          MARKETPLACE ANALYTICS · PERFORMANCE METRICS
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTimeRange('7d')}
          className={`px-5 py-2 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
            timeRange === '7d'
              ? 'bg-white text-black'
              : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={`px-5 py-2 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
            timeRange === '30d'
              ? 'bg-white text-black'
              : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimeRange('90d')}
          className={`px-5 py-2 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
            timeRange === '90d'
              ? 'bg-white text-black'
              : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          90 Days
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Revenue</span>
            <DollarSign size={16} className="text-white/20" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white mb-2">
            ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Total Earnings</div>
        </div>

        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Orders</span>
            <ShoppingCart size={16} className="text-white/20" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white mb-2">
            {stats.totalOrders}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Completed</div>
        </div>

        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Avg Order</span>
            <TrendingUp size={16} className="text-white/20" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white mb-2">
            ${stats.avgOrderValue.toFixed(2)}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Per Transaction</div>
        </div>

        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Conversion</span>
            <Users size={16} className="text-white/20" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white mb-2">
            3.2%
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Rate</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-3 mb-8">
        {/* Revenue Trend */}
        <div className="minimal-glass subtle-glow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Revenue Trend</h3>
              <p className="text-white/30 text-[10px] font-light">LAST 30 DAYS</p>
            </div>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
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
                  tickFormatter={(value) => `$${value / 1000}k`}
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
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  dot={{ fill: '#ffffff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="minimal-glass subtle-glow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Sales by Category</h3>
              <p className="text-white/30 text-[10px] font-light">LAST 30 DAYS</p>
            </div>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  stroke="#ffffff40" 
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#ffffff40" 
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000000', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#ffffff80' }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Sales']}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#ffffff" 
                  radius={[0, 0, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* Top Vendors */}
        <div className="minimal-glass subtle-glow p-6">
          <div className="mb-6">
            <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Top Vendors</h3>
            <p className="text-white/30 text-[10px] font-light">HIGHEST PERFORMERS</p>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-white/20 text-xs font-light py-12 text-center">LOADING DATA...</div>
            ) : (
              <div className="text-white/20 text-xs font-light py-12 text-center">
                NO VENDOR PERFORMANCE DATA AVAILABLE YET
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="minimal-glass subtle-glow p-6">
          <div className="mb-6">
            <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Top Products</h3>
            <p className="text-white/30 text-[10px] font-light">BEST SELLERS</p>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-white/20 text-xs font-light py-12 text-center">LOADING DATA...</div>
            ) : (
              <div className="text-white/20 text-xs font-light py-12 text-center">
                NO PRODUCT SALES DATA AVAILABLE YET
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
