"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Package, Users, DollarSign, TrendingUp, AlertCircle, Store, Activity,
  ShoppingCart, Database, Cpu, HardDrive, Terminal, RefreshCw, Code,
  Zap, Eye, Wifi, Server, FileCode, Settings, Trash2, FlaskConical, Home
} from '@/lib/icons';
import { StatsGridSkeleton, ChartSkeleton } from '@/components/AdminSkeleton';
import { logger } from '@/lib/logger';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PageHeader from '@/components/dashboard/PageHeader';

// Lazy load charts - 45KB saved from initial bundle
const AreaChart = dynamic(() => import('recharts').then(m => ({ default: m.AreaChart })), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => ({ default: m.Area })), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => ({ default: m.Line })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingProducts: 0,
    activeVendors: 0,
    pendingWholesaleApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    cache: 'healthy',
    storage: 'healthy'
  });
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        // Single aggregated API call - much faster!
        const response = await fetch('/api/admin/dashboard-stats', { cache: 'no-store' });
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
          setRevenueData(data.charts.revenueByDay);
          setOrdersData(data.charts.ordersByDay);
        }
        
        setLoading(false);
      } catch (error) {
        logger.error('Error loading stats:', error);
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Dev Tools Functions
  const executeDevCommand = async (command: string) => {
    setIsExecuting(command);
    try {
      const response = await fetch('/api/admin/dev-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await response.json();
      alert(data.message || 'Command executed successfully');
    } catch (error) {
      alert('Command failed: ' + error);
    } finally {
      setIsExecuting(null);
    }
  };

  const clearCache = () => executeDevCommand('clear-cache');
  const resetDatabase = () => {
    if (confirm('Are you sure? This will reset ALL database tables to their initial state.')) {
      executeDevCommand('reset-database');
    }
  };
  const purgeOrphans = () => executeDevCommand('purge-orphans');
  const rebuildIndexes = () => executeDevCommand('rebuild-indexes');
  const clearLogs = () => executeDevCommand('clear-logs');
  const testWebhooks = () => executeDevCommand('test-webhooks');
  const syncInventory = () => executeDevCommand('sync-inventory');

  return (
    <div className="w-full px-4 lg:px-0">
      <div className="mb-12 md:mb-16">
        <div className="flex items-center gap-6 mb-8">
          <img src="/whale.png" alt="WhaleTools" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
          <div>
            <h1 className="text-3xl md:text-5xl font-extralight text-white tracking-tight mb-2">
              WhaleTools Overview
            </h1>
            <p className="text-sm font-light text-white/40">
              Platform Command Center · {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
            </p>
          </div>
        </div>
      </div>


      {/* Alert for pending products */}
      {stats.pendingProducts > 0 && (
        <Link
          href="/admin/approvals"
          className="relative block mb-4 md:mb-8 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 backdrop-filter backdrop-blur-[20px] border border-yellow-500/30 rounded-2xl md:rounded-3xl hover:from-yellow-500/15 hover:to-amber-500/15 p-4 md:p-6 transition-all duration-500 group -mx-4 lg:mx-0 overflow-hidden shadow-lg hover:shadow-yellow-500/20"
        >
          {/* Animated pulse */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 via-yellow-600/10 to-yellow-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />

          <div className="relative z-10 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500/30 to-amber-500/30 rounded-xl md:rounded-2xl flex items-center justify-center border border-yellow-400/30 animate-pulse">
              <AlertCircle size={20} className="md:hidden text-yellow-300" strokeWidth={2} />
              <AlertCircle size={24} className="hidden md:block text-yellow-300" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white text-sm md:text-base font-bold">
                  {stats.pendingProducts} product{stats.pendingProducts !== 1 ? 's' : ''} awaiting approval
                </p>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-gradient-to-r from-yellow-500/30 to-yellow-500/20 text-yellow-300 rounded-full border border-yellow-400/30">
                  {stats.pendingProducts}
                </span>
              </div>
              <p className="text-white/60 text-[10px] md:text-xs font-light tracking-wide">
                REVIEW PENDING SUBMISSIONS
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 border border-white/20">
              <TrendingUp size={16} className="md:hidden text-white" strokeWidth={2} />
              <TrendingUp size={20} className="hidden md:block text-white" strokeWidth={2} />
            </div>
          </div>
        </Link>
      )}

      {/* Key Metrics - Full Width Grid */}
      {loading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-8">
          <StatCard
            label="Revenue"
            value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sublabel="Total Earnings"
            icon={DollarSign}
            delay="0s"
          />
          <StatCard
            label="Orders"
            value={stats.totalOrders}
            sublabel="Completed"
            icon={ShoppingCart}
            delay="0.1s"
          />
          <StatCard
            label="Customers"
            value={stats.totalCustomers}
            sublabel="Registered"
            icon={Users}
            delay="0.2s"
          />
          <StatCard
            label="Products"
            value={stats.totalProducts}
            sublabel="Active"
            icon={Package}
            delay="0.3s"
          />
        </div>
      )}

      {/* Charts Section */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-8">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-8">
          {/* Revenue Chart */}
          <Card className="">
            <CardHeader
              title="Revenue Trend"
              subtitle="Last 7 Days"
              action={<div className="w-1 h-1 bg-white/20 rounded-full" />}
              noPadding
            />
            <div className="h-64">
              {revenueData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/20 text-xs font-light">NO DATA</div>
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
          </Card>

          {/* Orders Chart */}
          <Card className="">
            <CardHeader
              title="Order Volume"
              subtitle="Last 7 Days"
              action={<div className="w-1 h-1 bg-white/20 rounded-full" />}
              noPadding
            />
            <div className="h-64">
              {ordersData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/20 text-xs font-light">NO DATA</div>
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
          </Card>
        </div>
      )}

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-3">
        {/* System Status */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="System Status"
            subtitle="Active Vendors & Inventory"
            action={<div className="w-1 h-1 bg-white/20 rounded-full" />}
            noPadding
          />
          
          <div className="space-y-4">
            {/* Active Vendors */}
            <div className="flex items-center justify-between py-3 md:py-4 border-b border-white/5 hover:bg-white/[0.01] transition-all duration-300">
              <div className="flex items-center gap-2 md:gap-3">
                <Store size={12} className="md:hidden text-white/30" strokeWidth={1.5} />
                <Store size={14} className="hidden md:block text-white/30" strokeWidth={1.5} />
                <span className="text-white/60 text-[10px] md:text-xs font-light tracking-wide uppercase">Active Vendors</span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-white font-thin text-base md:text-lg">{loading ? '—' : stats.activeVendors}</div>
                <div className="w-12 md:w-16 bg-black/50 h-[2px] overflow-hidden">
                  <div className="bg-white/30 h-full transition-all duration-1000" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="flex items-center justify-between py-3 md:py-4 border-b border-white/5 hover:bg-white/[0.01] transition-all duration-300">
              <div className="flex items-center gap-2 md:gap-3">
                <Package size={12} className="md:hidden text-white/30" strokeWidth={1.5} />
                <Package size={14} className="hidden md:block text-white/30" strokeWidth={1.5} />
                <span className="text-white/60 text-[10px] md:text-xs font-light tracking-wide uppercase">Products Listed</span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-white font-thin text-base md:text-lg">{loading ? '—' : stats.totalProducts}</div>
                <div className="w-12 md:w-16 bg-black/50 h-[2px] overflow-hidden">
                  <div className="bg-white/30 h-full transition-all duration-1000" style={{ width: '72%' }}></div>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="flex items-center justify-between py-3 md:py-4 hover:bg-white/[0.01] transition-all duration-300">
              <div className="flex items-center gap-2 md:gap-3">
                <ShoppingCart size={12} className="md:hidden text-white/30" strokeWidth={1.5} />
                <ShoppingCart size={14} className="hidden md:block text-white/30" strokeWidth={1.5} />
                <span className="text-white/60 text-[10px] md:text-xs font-light tracking-wide uppercase">Total Orders</span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-white font-thin text-base md:text-lg">{loading ? '—' : stats.totalOrders}</div>
                <div className="w-12 md:w-16 bg-black/50 h-[2px] overflow-hidden">
                  <div className="bg-white/30 h-full transition-all duration-1000" style={{ width: '93%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="">
          <CardHeader
            title="Quick Actions"
            subtitle="Common Tasks"
            noPadding
          />
          
          <div className="space-y-2">
            <Link
              href="/admin/approvals"
              className="block px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 group rounded-xl md:rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="tracking-wide">Review Products</span>
                {stats.pendingProducts > 0 && (
                  <span className="bg-yellow-500/20 text-yellow-500 text-[8px] md:text-[10px] px-2 py-0.5 font-light border border-yellow-500/30">
                    {stats.pendingProducts}
                  </span>
                )}
              </div>
            </Link>

            <Link
              href="/admin/wholesale-applications"
              className="block px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 group rounded-xl md:rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="tracking-wide">Wholesale Applications</span>
                {stats.pendingWholesaleApplications > 0 && (
                  <span className="bg-yellow-500/20 text-yellow-500 text-[8px] md:text-[10px] px-2 py-0.5 font-light border border-yellow-500/30">
                    {stats.pendingWholesaleApplications}
                  </span>
                )}
              </div>
            </Link>

            <Link
              href="/admin/vendors"
              className="block px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 tracking-wide rounded-xl md:rounded-2xl"
            >
              Manage Vendors
            </Link>

            <Link
              href="/admin/products"
              className="block px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 tracking-wide rounded-xl md:rounded-2xl"
            >
              View Products
            </Link>

            <Link
              href="/admin/users"
              className="block px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 tracking-wide rounded-xl md:rounded-2xl"
            >
              Customer List
            </Link>
          </div>
        </Card>
      </div>

      {/* Developer Tools Suite */}
      <div className="mt-4 md:mt-8">
        <button
          onClick={() => setDevToolsOpen(!devToolsOpen)}
          className="w-full minimal-glass subtle-glow p-3 md:p-4 hover:bg-white/[0.03] transition-all duration-300 group flex items-center justify-between mb-2 md:mb-3 rounded-xl md:rounded-2xl"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <Terminal size={14} className="md:hidden text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
            <Terminal size={16} className="hidden md:block text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
            <h3 className="text-white/40 text-[10px] md:text-[11px] font-light tracking-[0.2em] uppercase">
              Developer Tools Suite
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/20 text-[9px] md:text-[10px] font-light tracking-wider uppercase">
              {devToolsOpen ? 'COLLAPSE' : 'EXPAND'}
            </span>
            <div className={`transform transition-transform duration-300 ${devToolsOpen ? 'rotate-180' : ''}`}>
              <Code size={12} className="md:hidden text-white/30" strokeWidth={1.5} />
              <Code size={14} className="hidden md:block text-white/30" strokeWidth={1.5} />
            </div>
          </div>
        </button>

        {devToolsOpen && (
          <div className="space-y-2 md:space-y-3">
            {/* System Health Monitor */}
            <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h3 className="text-white/40 text-[10px] md:text-[11px] font-light tracking-[0.2em] uppercase mb-1 md:mb-2">System Health</h3>
                  <p className="text-white/30 text-[9px] md:text-[10px] font-light">REAL-TIME MONITORING</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-white/40 hover:text-white/60 transition-all duration-300"
                >
                  <RefreshCw size={12} className="md:hidden" strokeWidth={1.5} />
                  <RefreshCw size={14} className="hidden md:block" strokeWidth={1.5} />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                <div className="bg-black/20 p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl md:rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <Database size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                    <Database size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                    <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-white/80 text-[10px] md:text-xs font-light">{systemHealth.database}</span>
                  </div>
                </div>

                <div className="bg-black/20 p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl md:rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <Server size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                    <Server size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                    <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.api === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-white/80 text-[10px] md:text-xs font-light">{systemHealth.api}</span>
                  </div>
                </div>

                <div className="bg-black/20 p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl md:rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <Zap size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                    <Zap size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                    <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">Cache</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.cache === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-white/80 text-[10px] md:text-xs font-light">{systemHealth.cache}</span>
                  </div>
                </div>

                <div className="bg-black/20 p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl md:rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <HardDrive size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                    <HardDrive size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                    <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.storage === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-white/80 text-[10px] md:text-xs font-light">{systemHealth.storage}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dev Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-3">
              {/* Database Tools */}
              <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <Database size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                  <Database size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                  <h4 className="text-white/40 text-[10px] md:text-[11px] font-light tracking-[0.2em] uppercase">Database</h4>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={purgeOrphans}
                    disabled={isExecuting === 'purge-orphans'}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Purge Orphans</span>
                    {isExecuting === 'purge-orphans' ? (
                      <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Trash2 size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    onClick={rebuildIndexes}
                    disabled={isExecuting === 'rebuild-indexes'}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Rebuild Indexes</span>
                    {isExecuting === 'rebuild-indexes' ? (
                      <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Settings size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    onClick={resetDatabase}
                    disabled={isExecuting === 'reset-database'}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 text-xs font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Reset Database</span>
                    {isExecuting === 'reset-database' ? (
                      <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <AlertCircle size={12} className="text-red-500/60 group-hover:text-red-500/80 transition-all duration-300" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Cache & Performance */}
              <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <Zap size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                  <Zap size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                  <h4 className="text-white/40 text-[10px] md:text-[11px] font-light tracking-[0.2em] uppercase">Performance</h4>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={clearCache}
                    disabled={isExecuting === 'clear-cache'}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Clear Cache</span>
                    {isExecuting === 'clear-cache' ? (
                      <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Trash2 size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    onClick={clearLogs}
                    disabled={isExecuting === 'clear-logs'}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Clear Logs</span>
                    {isExecuting === 'clear-logs' ? (
                      <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <FileCode size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                    )}
                  </button>

                  <Link
                    href="/admin/monitoring"
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">View Metrics</span>
                    <Eye size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>

              {/* System Operations */}
              <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <Cpu size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                  <Cpu size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                  <h4 className="text-white/40 text-[10px] md:text-[11px] font-light tracking-[0.2em] uppercase">Operations</h4>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={syncInventory}
                    disabled={isExecuting === 'sync-inventory'}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Sync Inventory</span>
                    {isExecuting === 'sync-inventory' ? (
                      <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <RefreshCw size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    onClick={testWebhooks}
                    disabled={isExecuting === 'test-webhooks'}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Test Webhooks</span>
                    {isExecuting === 'test-webhooks' ? (
                      <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Wifi size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    onClick={() => window.open('/api/health', '_blank')}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 flex items-center justify-between group rounded-xl md:rounded-2xl"
                  >
                    <span className="tracking-wide">Health Check</span>
                    <Activity size={12} className="text-white/40 group-hover:text-white/60 transition-all duration-300" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            {/* API Playground */}
            <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h3 className="text-white/40 text-[10px] md:text-[11px] font-light tracking-[0.2em] uppercase mb-1 md:mb-2">API Playground</h3>
                  <p className="text-white/30 text-[9px] md:text-[10px] font-light">TEST ENDPOINTS</p>
                </div>
                <Terminal size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                <Terminal size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                <div className="space-y-2">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider mb-2 md:mb-3">Quick Tests</p>
                  <button
                    onClick={() => window.open('/api/products', '_blank')}
                    className="w-full px-3 md:px-4 py-2 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 text-left rounded-xl md:rounded-2xl"
                  >
                    <span className="text-white/60">GET</span> /api/products
                  </button>
                  <button
                    onClick={() => window.open('/api/vendors', '_blank')}
                    className="w-full px-3 md:px-4 py-2 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 text-left rounded-xl md:rounded-2xl"
                  >
                    <span className="text-white/60">GET</span> /api/vendors
                  </button>
                  <button
                    onClick={() => window.open('/api/categories', '_blank')}
                    className="w-full px-3 md:px-4 py-2 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 text-left rounded-xl md:rounded-2xl"
                  >
                    <span className="text-white/60">GET</span> /api/categories
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider mb-2 md:mb-3">Admin Endpoints</p>
                  <button
                    onClick={() => window.open('/api/admin/dashboard-stats', '_blank')}
                    className="w-full px-3 md:px-4 py-2 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 text-left rounded-xl md:rounded-2xl"
                  >
                    <span className="text-white/60">GET</span> /api/admin/dashboard-stats
                  </button>
                  <button
                    onClick={() => window.open('/api/admin/products', '_blank')}
                    className="w-full px-3 md:px-4 py-2 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 text-left rounded-xl md:rounded-2xl"
                  >
                    <span className="text-white/60">GET</span> /api/admin/products
                  </button>
                  <button
                    onClick={() => window.open('/api/admin/vendors', '_blank')}
                    className="w-full px-3 md:px-4 py-2 bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 text-left rounded-xl md:rounded-2xl"
                  >
                    <span className="text-white/60">GET</span> /api/admin/vendors
                  </button>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Server size={12} className="md:hidden text-white/40" strokeWidth={1.5} />
                <Server size={14} className="hidden md:block text-white/40" strokeWidth={1.5} />
                <h3 className="text-white/40 text-[10px] md:text-[11px] font-light tracking-[0.2em] uppercase">System Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="space-y-1">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">Environment</p>
                  <p className="text-white/80 text-[10px] md:text-xs font-light">{process.env.NODE_ENV || 'development'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">Node Version</p>
                  <p className="text-white/80 text-[10px] md:text-xs font-light">{process.version || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">Platform</p>
                  <p className="text-white/80 text-[10px] md:text-xs font-light">{process.platform || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">Uptime</p>
                  <p className="text-white/80 text-[10px] md:text-xs font-light">{Math.floor(performance.now() / 1000 / 60)} min</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
