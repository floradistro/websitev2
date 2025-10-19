"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp, DollarSign, AlertTriangle, Bell, Calendar, ArrowUpRight, ArrowDownRight, FileText, MessageSquare } from 'lucide-react';
import { getVendorDashboard } from '@/lib/wordpress';
import { useVendorAuth } from '@/context/VendorAuthContext';

interface RecentProduct {
  id: number;
  name: string;
  image: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedDate: string;
}

interface LowStockItem {
  id: number;
  name: string;
  currentStock: number;
  threshold: number;
}

interface Notice {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'info';
  date: string;
}

interface SalesData {
  date: string;
  revenue: number;
}

interface TopProduct {
  id: number;
  name: string;
  unitsSold: number;
  revenue: number;
}

interface ActionItem {
  id: number;
  title: string;
  type: 'warning' | 'info';
  link: string;
}

export default function VendorDashboard() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalSales30d: 0,
    lowStock: 0,
  });

  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [payout, setPayout] = useState({
    pendingEarnings: 0,
    nextPayoutDate: '',
    lastPayoutAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      // Don't load if auth is still loading or not authenticated
      if (authLoading || !isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getVendorDashboard();
        
        // Update stats
        setStats({
          totalProducts: data.stats.total_products + data.stats.pending_products,
          approved: data.stats.total_products,
          pending: data.stats.pending_products,
          rejected: 0,
          totalSales30d: data.stats.total_sales_30d,
          lowStock: data.low_stock?.length || 0,
        });

        // Map recent products
        const mappedProducts = data.recent_products.map((p: any) => ({
          id: p.product_id,
          name: p.name,
          image: p.image || "/logoprint.png",
          status: p.status,
          submittedDate: new Date(p.submitted_date).toLocaleDateString()
        }));
        setRecentProducts(mappedProducts);

        // Map low stock items
        const mappedLowStock = (data.low_stock || []).map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          currentStock: parseFloat(item.quantity),
          threshold: parseFloat(item.threshold) || 20
        }));
        setLowStockItems(mappedLowStock);

        // Map notifications
        const mappedNotices = (data.notifications || []).map((n: any) => ({
          id: n.id,
          message: n.message,
          type: n.type.includes('success') || n.type.includes('approved') ? 'success' : 
                 n.type.includes('warning') || n.type.includes('low') ? 'warning' : 'info',
          date: getRelativeTime(n.created_at)
        }));
        setNotices(mappedNotices);

        // Map recent orders for sales data (mock for now - can enhance later)
        const mappedSalesData = (data.recent_orders || []).map((order: any) => ({
          date: order.order_date,
          revenue: parseFloat(order.net_earnings)
        }));
        if (mappedSalesData.length > 0) {
          setSalesData(mappedSalesData);
        }

        // Calculate payout info from stats
        setPayout({
          pendingEarnings: data.stats.total_sales_30d * 0.85, // After 15% commission
          nextPayoutDate: getNextPayoutDate(),
          lastPayoutAmount: 0, // TODO: Get from payouts endpoint
        });

        // Generate action items from data
        const actions: ActionItem[] = [];
        if (data.stats.pending_products > 0) {
          actions.push({
            id: 1,
            title: `${data.stats.pending_products} product${data.stats.pending_products > 1 ? 's' : ''} pending approval`,
            type: 'info',
            link: '/vendor/products'
          });
        }
        if (data.low_stock && data.low_stock.length > 0) {
          actions.push({
            id: 2,
            title: `${data.low_stock.length} products low on stock`,
            type: 'warning',
            link: '/vendor/inventory'
          });
        }
        setActionItems(actions);

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    }

    loadDashboard();
  }, [authLoading, isAuthenticated]);

  // Helper function to get relative time
  function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // Helper function to get next payout date
  function getNextPayoutDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
    return nextMonth.toISOString().split('T')[0];
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-white/5 text-white/60 border-white/10",
      pending: "bg-white/5 text-white/60 border-white/10",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      draft: "bg-white/5 text-white/60 border-white/10",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status}
      </span>
    );
  };

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-white/60" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-white/60" />;
      default:
        return <Bell size={20} className="text-white/60" />;
    }
  };

  return (
    <div className="lg:max-w-7xl lg:mx-auto animate-fadeIn overflow-x-hidden">
      {/* Welcome Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-3xl lg:text-4xl text-white mb-2" style={{ fontFamily: 'Lobster' }}>
          Welcome Back, {vendor?.store_name || 'Vendor'}
        </h1>
        <p className="text-white/60 text-sm">
          Here's what's happening with your store today
        </p>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-4 mb-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        {/* Total Products */}
        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
            <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Live Products</div>
            <Package size={18} className="hidden lg:block text-white/40" />
          </div>
          <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
            {loading ? '—' : stats.approved}
          </div>
          <div className="text-white/40 text-[10px] lg:text-xs">Currently selling</div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
            <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Pending Review</div>
            <AlertCircle size={18} className="hidden lg:block text-white/40" />
          </div>
          <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
            {loading ? '—' : stats.pending}
          </div>
          <div className="text-white/40 text-[10px] lg:text-xs">Awaiting approval</div>
          </div>
        </div>

        {/* Total Sales (30 Days) */}
        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
            <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Sales (30 Days)</div>
            <DollarSign size={18} className="hidden lg:block text-white/40" />
          </div>
          <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
            {loading ? '—' : `$${stats.totalSales30d.toLocaleString()}`}
          </div>
          <div className="text-white/40 text-[10px] lg:text-xs">Revenue this month</div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
            <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Low Stock</div>
            <AlertTriangle size={18} className="hidden lg:block text-red-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
            {loading ? '—' : stats.lowStock}
          </div>
          <div className="text-red-500 text-[10px] lg:text-xs">Items need restocking</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-4 mb-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <Link
          href="/vendor/products/new"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-r border-b lg:border border-white/10 lg:hover:border-white/20 p-4 lg:p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center gap-2 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <Plus size={20} className="lg:hidden text-white/60 group-hover:text-white transition-colors duration-300" />
              <Plus size={24} className="hidden lg:block text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Add Product</div>
          </div>
        </Link>

        <Link
          href="/vendor/products"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-b lg:border border-white/10 lg:hover:border-white/20 p-4 lg:p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center gap-2 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <Package size={20} className="lg:hidden text-white/60 group-hover:text-white transition-colors duration-300" />
              <Package size={24} className="hidden lg:block text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">My Products</div>
          </div>
        </Link>

        <Link
          href="/vendor/inventory"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-r border-b lg:border border-white/10 lg:hover:border-white/20 p-4 lg:p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center gap-2 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <TrendingUp size={20} className="lg:hidden text-white/60 group-hover:text-white transition-colors duration-300" />
              <TrendingUp size={24} className="hidden lg:block text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Inventory</div>
          </div>
        </Link>

        <Link
          href="/vendor/branding"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-b lg:border border-white/10 lg:hover:border-white/20 p-4 lg:p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center gap-2 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <Package size={20} className="lg:hidden text-white/60 group-hover:text-white transition-colors duration-300" />
              <Package size={24} className="hidden lg:block text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Branding</div>
          </div>
        </Link>
      </div>

      {/* Action Items */}
      <div className="mb-0 lg:mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        <div className="bg-[#1a1a1a] lg:border border-white/5">
          <div className="border-b border-white/5 px-4 lg:p-4 py-3">
            <h2 className="text-white/90 text-xs lg:text-sm uppercase tracking-wider font-light">Action Items</h2>
          </div>
          <div className="divide-y divide-white/5">
            {actionItems.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className="flex items-center justify-between px-4 lg:p-4 py-3 active:bg-white/5 lg:hover:bg-[#303030] transition-all group"
              >
                <div className="flex items-center gap-3">
                  {item.type === 'warning' ? (
                    <AlertTriangle size={16} className="text-white/60" />
                  ) : (
                    <Bell size={16} className="text-white/60" />
                  )}
                  <span className="text-white/80 text-sm group-hover:text-white transition-colors">{item.title}</span>
                </div>
                <ArrowUpRight size={14} className="text-white/40 group-hover:text-white/60 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 mb-0 lg:mb-8" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart */}
          <div className="bg-[#1a1a1a] lg:border border-t border-white/5">
            <div className="border-b border-white/5 px-4 lg:p-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Sales Trend</h2>
                <p className="text-white/50 text-xs mt-1">Last 18 days</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-white/60" />
                <span className="text-white/60 text-sm font-medium">+24%</span>
              </div>
            </div>
            <div className="px-4 lg:p-6 py-4">
              {/* Simple Bar Chart */}
              <div className="flex items-end justify-between gap-1 h-32">
                {salesData.map((data, index) => {
                  const maxRevenue = Math.max(...salesData.map(d => d.revenue));
                  const height = (data.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer border-t border-white/20 relative group"
                      style={{ height: `${height}%` }}
                      title={`${new Date(data.date).toLocaleDateString()}: $${data.revenue.toFixed(2)}`}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 px-2 py-1 text-xs text-white whitespace-nowrap">
                        ${data.revenue.toFixed(0)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-between text-xs text-white/40">
                <span>{salesData[0]?.date ? new Date(salesData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-white/5">
            <div className="border-b border-white/5 px-4 lg:p-6 py-4">
              <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Top Performing Products</h2>
            </div>
            <div className="divide-y divide-white/5">
              {topProducts.map((product, index) => (
                <div key={product.id} className="px-4 lg:p-4 py-3 active:bg-white/5 lg:hover:bg-[#303030] transition-all flex items-center gap-4">
                  <div className="w-8 h-8 bg-white/5 flex items-center justify-center text-white/40 text-sm font-medium">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/vendor/products/${product.id}/edit`} className="text-white text-sm hover:text-white/80 transition-colors">
                      {product.name}
                    </Link>
                    <div className="text-white/50 text-xs mt-0.5">{product.unitsSold} units sold</div>
                  </div>
                  <div className="text-white font-medium">${product.revenue.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Recent Product Submissions */}
          <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-white/5">
            <div className="border-b border-white/5 px-4 lg:p-6 py-4 flex justify-between items-center">
              <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Recent Product Submissions</h2>
              <Link href="/vendor/products" className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors">
                View All
              </Link>
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-12 text-center text-white/60">Loading...</div>
              ) : recentProducts.length === 0 ? (
                <div className="p-12 text-center text-white/60">
                  No products yet. Add your first product to get started!
                </div>
              ) : (
                recentProducts.map((product) => (
                  <div key={product.id} className="px-4 lg:p-4 py-3 active:bg-white/5 lg:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                        <Package size={24} className="text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium mb-1">{product.name}</div>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Calendar size={12} />
                          <span>Submitted {product.submittedDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(product.status)}
                        <Link
                          href={`/vendor/products/${product.id}/edit`}
                          className="text-white/60 hover:text-white text-xs transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Inventory Warnings */}
          {lowStockItems.length > 0 && (
            <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-red-500/10">
              <div className="border-b border-white/5 px-4 lg:p-6 py-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500" strokeWidth={1.5} />
                <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Low Inventory Warnings</h2>
              </div>
              <div className="divide-y divide-white/5">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="px-4 lg:p-4 py-3 active:bg-white/5 lg:hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium mb-1">{item.name}</div>
                        <div className="text-xs text-white/60">
                          Only <span className="text-red-500 font-medium">{item.currentStock}g</span> remaining (Threshold: {item.threshold}g)
                        </div>
                      </div>
                      <Link
                        href="/vendor/inventory"
                        className="text-xs text-white bg-black border border-white/20 hover:bg-white hover:text-black hover:border-white px-4 py-2 uppercase tracking-wider transition-all duration-300"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Payout Summary */}
          <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-white/5">
            <div className="border-b border-white/5 px-4 lg:p-6 py-4">
              <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Payout Summary</h2>
            </div>
            <div className="px-4 lg:p-6 py-4 space-y-4">
              {/* Pending Earnings */}
              <div>
                <div className="text-white/60 text-xs mb-2">Pending Earnings</div>
                <div className="text-3xl font-light text-white mb-1">${payout.pendingEarnings.toLocaleString()}</div>
                <div className="text-white/40 text-xs">After commission</div>
              </div>

              {/* Next Payout */}
              <div className="pt-4 border-t border-white/5">
                <div className="text-white/60 text-xs mb-2">Next Payout</div>
                <div className="text-white text-sm mb-1">{new Date(payout.nextPayoutDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div className="text-white/40 text-xs">Direct deposit to bank account</div>
              </div>

              {/* Last Payout */}
              <div className="pt-4 border-t border-white/5">
                <div className="text-white/60 text-xs mb-2">Last Payout</div>
                <div className="text-white font-medium">${payout.lastPayoutAmount.toLocaleString()}</div>
              </div>

              <Link
                href="/vendor/payouts"
                className="block w-full text-center px-4 py-2.5 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs uppercase tracking-wider transition-all duration-300 mt-4"
              >
                View Payout History
              </Link>
            </div>
          </div>

          {/* Vendor Notices */}
          <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-white/5">
            <div className="border-b border-white/5 px-4 lg:p-6 py-4">
              <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Notices</h2>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-6 text-center text-white/60 text-sm">Loading...</div>
              ) : notices.length === 0 ? (
                <div className="p-6 text-center text-white/60 text-sm">
                  No new notices
                </div>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className="px-4 lg:p-4 py-3 active:bg-white/5 lg:hover:bg-white/5 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNoticeIcon(notice.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm mb-2 leading-relaxed">{notice.message}</p>
                        <p className="text-white/40 text-xs">{notice.date}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

