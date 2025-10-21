"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [stats, setStats] = useState({
    totalRevenue: 66109.63,
    totalOrders: 795,
    avgOrderValue: 83.16,
    topVendor: 'Loading...',
    topProduct: 'Loading...',
  });

  // Sample data - replace with real API calls
  const revenueData = [
    { date: 'Week 1', revenue: 12500 },
    { date: 'Week 2', revenue: 15800 },
    { date: 'Week 3', revenue: 18200 },
    { date: 'Week 4', revenue: 19609.63 },
  ];

  const categoryData = [
    { category: 'Flower', sales: 35000 },
    { category: 'Edibles', sales: 18000 },
    { category: 'Concentrates', sales: 8000 },
    { category: 'Pre-Rolls', sales: 5109.63 },
  ];

  return (
    <div className="w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl text-white font-light tracking-tight mb-2">
          Analytics
        </h1>
        <p className="text-white/50 text-sm">
          Marketplace insights and performance metrics
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTimeRange('7d')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            timeRange === '7d'
              ? 'bg-white text-black'
              : 'bg-[#111111] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            timeRange === '30d'
              ? 'bg-white text-black'
              : 'bg-[#111111] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimeRange('90d')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            timeRange === '90d'
              ? 'bg-white text-black'
              : 'bg-[#111111] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          90 Days
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Revenue</span>
            <DollarSign size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-white/30 text-xs">Total earnings</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Orders</span>
            <ShoppingCart size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            {stats.totalOrders}
          </div>
          <div className="text-white/30 text-xs">Completed</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Avg Order</span>
            <TrendingUp size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            ${stats.avgOrderValue.toFixed(2)}
          </div>
          <div className="text-white/30 text-xs">Per transaction</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Conversion</span>
            <Users size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            3.2%
          </div>
          <div className="text-white/30 text-xs">Rate</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue Trend */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-sm font-medium mb-1">Revenue Trend</h3>
              <p className="text-white/40 text-xs">Last 30 days</p>
            </div>
            <TrendingUp size={18} className="text-white/30" />
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
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-sm font-medium mb-1">Sales by Category</h3>
              <p className="text-white/40 text-xs">Last 30 days</p>
            </div>
            <Package size={18} className="text-white/30" />
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
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Vendors */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <h3 className="text-white text-sm font-medium mb-4">Top Vendors</h3>
          <div className="space-y-4">
            {[
              { name: 'Vendor A', revenue: 15240, orders: 89 },
              { name: 'Vendor B', revenue: 12500, orders: 67 },
              { name: 'Vendor C', revenue: 9870, orders: 54 },
            ].map((vendor, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex-1">
                  <div className="text-white text-sm mb-1">{vendor.name}</div>
                  <div className="text-white/40 text-xs">{vendor.orders} orders</div>
                </div>
                <div className="text-white font-medium">${vendor.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <h3 className="text-white text-sm font-medium mb-4">Top Products</h3>
          <div className="space-y-4">
            {[
              { name: 'Product A', revenue: 8240, units: 156 },
              { name: 'Product B', revenue: 6500, units: 98 },
              { name: 'Product C', revenue: 4870, units: 74 },
            ].map((product, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex-1">
                  <div className="text-white text-sm mb-1">{product.name}</div>
                  <div className="text-white/40 text-xs">{product.units} units sold</div>
                </div>
                <div className="text-white font-medium">${product.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
