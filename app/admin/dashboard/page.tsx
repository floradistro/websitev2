"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Users, DollarSign, TrendingUp, AlertCircle, Store, Activity, ShoppingCart } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingProducts: 0,
    activeVendors: 0
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [products, customers, orders, vendors, pendingProducts] = await Promise.all([
          fetch('/api/supabase/products?per_page=1').then(r => r.json()),
          fetch('/api/supabase/customers?per_page=1').then(r => r.json()),
          fetch('/api/supabase/orders?per_page=1').then(r => r.json()),
          fetch('/api/admin/vendors').then(r => r.json()),
          fetch('/api/admin/pending-products').then(r => r.json())
        ]);

        const allOrders = await fetch('/api/supabase/orders?per_page=1000').then(r => r.json());
        const totalRevenue = allOrders.orders?.reduce((sum: number, order: any) => 
          sum + parseFloat(order.total_amount || 0), 0
        ) || 0;

        // Process revenue data for chart (last 7 days)
        const now = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const revenueByDay = last7Days.map(date => {
          const dayRevenue = allOrders.orders
            ?.filter((order: any) => order.created_at?.startsWith(date))
            .reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0) || 0;
          
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: Math.round(dayRevenue * 100) / 100
          };
        });

        const ordersByDay = last7Days.map(date => {
          const dayOrders = allOrders.orders
            ?.filter((order: any) => order.created_at?.startsWith(date))
            .length || 0;
          
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            orders: dayOrders
          };
        });

        setRevenueData(revenueByDay);
        setOrdersData(ordersByDay);

        setStats({
          totalProducts: products.pagination?.total || 0,
          totalCustomers: customers.pagination?.total || 0,
          totalOrders: orders.pagination?.total || 0,
          totalRevenue: totalRevenue,
          pendingProducts: pendingProducts.products?.filter((p: any) => 
            p.status === 'draft' || p.status === 'pending'
          ).length || 0,
          activeVendors: vendors.vendors?.filter((v: any) => v.status === 'active').length || 0
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading stats:', error);
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2 font-light tracking-tight">
          Dashboard
        </h1>
        <p className="text-white/50 text-sm">
          System overview and key metrics
        </p>
      </div>

      {/* Alert for pending products */}
      {stats.pendingProducts > 0 && (
        <Link 
          href="/admin/approvals"
          className="block mb-6 bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/30 p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium mb-0.5">
                {stats.pendingProducts} product{stats.pendingProducts !== 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-white/50 text-xs">
                Click to review and approve submissions
              </p>
            </div>
            <TrendingUp size={16} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      )}

      {/* Key Metrics - Full Width Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Revenue */}
        <div className="bg-[#111111] border border-white/10 p-5 hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Revenue</span>
            <DollarSign size={18} className="text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            {loading ? '—' : `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div className="text-white/30 text-xs">Total earnings</div>
        </div>

        {/* Orders */}
        <div className="bg-[#111111] border border-white/10 p-5 hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Orders</span>
            <ShoppingCart size={18} className="text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            {loading ? '—' : stats.totalOrders}
          </div>
          <div className="text-white/30 text-xs">Completed orders</div>
        </div>

        {/* Customers */}
        <div className="bg-[#111111] border border-white/10 p-5 hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Customers</span>
            <Users size={18} className="text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            {loading ? '—' : stats.totalCustomers}
          </div>
          <div className="text-white/30 text-xs">Registered users</div>
        </div>

        {/* Products */}
        <div className="bg-[#111111] border border-white/10 p-5 hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Products</span>
            <Package size={18} className="text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            {loading ? '—' : stats.totalProducts}
          </div>
          <div className="text-white/30 text-xs">Active listings</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-sm font-medium mb-1">Revenue Trend</h3>
              <p className="text-white/40 text-xs">Last 7 days</p>
            </div>
            <DollarSign size={18} className="text-white/30" />
          </div>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white/30 text-sm">Loading data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
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
                    dataKey="revenue" 
                    stroke="#ffffff" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-sm font-medium mb-1">Order Volume</h3>
              <p className="text-white/40 text-xs">Last 7 days</p>
            </div>
            <Activity size={18} className="text-white/30" />
          </div>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white/30 text-sm">Loading data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersData}>
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
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#000000', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#ffffff80' }}
                    formatter={(value: any) => [value, 'Orders']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#ffffff" 
                    strokeWidth={2}
                    dot={{ fill: '#ffffff', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* System Status */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-sm font-medium mb-1">System Status</h3>
              <p className="text-white/40 text-xs">Active vendors and inventory</p>
            </div>
            <Activity size={18} className="text-white/30" />
          </div>
          
          <div className="space-y-4">
            {/* Active Vendors */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Store size={16} className="text-white/40" />
                <span className="text-white/70 text-sm">Active Vendors</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-white font-medium">{loading ? '—' : stats.activeVendors}</div>
                <div className="w-20 bg-white/5 h-1.5">
                  <div className="bg-white h-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Package size={16} className="text-white/40" />
                <span className="text-white/70 text-sm">Products Listed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-white font-medium">{loading ? '—' : stats.totalProducts}</div>
                <div className="w-20 bg-white/5 h-1.5">
                  <div className="bg-white h-full" style={{ width: '72%' }}></div>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <ShoppingCart size={16} className="text-white/40" />
                <span className="text-white/70 text-sm">Total Orders</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-white font-medium">{loading ? '—' : stats.totalOrders}</div>
                <div className="w-20 bg-white/5 h-1.5">
                  <div className="bg-white h-full" style={{ width: '93%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="mb-6">
            <h3 className="text-white text-sm font-medium mb-1">Quick Actions</h3>
            <p className="text-white/40 text-xs">Common tasks</p>
          </div>
          
          <div className="space-y-2">
            <Link 
              href="/admin/approvals"
              className="block px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <span>Review Products</span>
                {stats.pendingProducts > 0 && (
                  <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 font-medium">
                    {stats.pendingProducts}
                  </span>
                )}
              </div>
            </Link>

            <Link 
              href="/admin/vendors"
              className="block px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm transition-all"
            >
              Manage Vendors
            </Link>

            <Link 
              href="/admin/products"
              className="block px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm transition-all"
            >
              View Products
            </Link>

            <Link 
              href="/admin/users"
              className="block px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm transition-all"
            >
              Customer List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
