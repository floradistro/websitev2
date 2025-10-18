"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp, DollarSign, AlertTriangle, Bell, Calendar, ArrowUpRight, ArrowDownRight, FileText, MessageSquare } from 'lucide-react';

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
    // TODO: Fetch actual data from API: /vendor-marketplace/v1/dashboard
    // For now, mock data
    setTimeout(() => {
      setStats({
        totalProducts: 12,
        approved: 10,
        pending: 1,
        rejected: 1,
        totalSales30d: 8247.68,
        lowStock: 3,
      });

      setRecentProducts([
        {
          id: 50009,
          name: "Wedding Cake",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-17"
        },
        {
          id: 50010,
          name: "Durban Poison",
          image: "/placeholder.jpg",
          status: "pending",
          submittedDate: "2025-10-18"
        },
        {
          id: 50005,
          name: "Gelato",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-16"
        },
        {
          id: 50006,
          name: "Sunset Sherbet",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-15"
        },
        {
          id: 50001,
          name: "OG Kush",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-14"
        },
        {
          id: 50002,
          name: "Blue Dream",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-13"
        },
      ]);

      setLowStockItems([
        {
          id: 50006,
          name: "Sunset Sherbet",
          currentStock: 8.5,
          threshold: 20
        },
        {
          id: 50008,
          name: "Zkittlez",
          currentStock: 12.25,
          threshold: 20
        },
        {
          id: 50007,
          name: "Purple Punch",
          currentStock: 15.0,
          threshold: 20
        },
      ]);

      setNotices([
        {
          id: 1,
          message: "Your product 'Wedding Cake' was approved and is now live!",
          type: "success",
          date: "2 hours ago"
        },
        {
          id: 2,
          message: "New order from Zachariah Kryger - $71.96 (Order #41778)",
          type: "success",
          date: "3 hours ago"
        },
        {
          id: 3,
          message: "Product 'Durban Poison' is pending admin review",
          type: "info",
          date: "1 day ago"
        },
        {
          id: 4,
          message: "Low stock alert: 'Sunset Sherbet' has only 8.5g remaining",
          type: "warning",
          date: "2 days ago"
        },
        {
          id: 5,
          message: "Commission payout for October ($7,010.36) is scheduled for Nov 5th.",
          type: "info",
          date: "3 days ago"
        },
        {
          id: 6,
          message: "Your product 'Blue Dream' received a 5-star review from Jordan Cooper",
          type: "success",
          date: "4 days ago"
        },
      ]);

      // Sales data for last 30 days
      setSalesData([
        { date: '2025-10-01', revenue: 127.50 },
        { date: '2025-10-02', revenue: 89.25 },
        { date: '2025-10-03', revenue: 245.80 },
        { date: '2025-10-04', revenue: 312.45 },
        { date: '2025-10-05', revenue: 198.60 },
        { date: '2025-10-06', revenue: 276.30 },
        { date: '2025-10-07', revenue: 423.75 },
        { date: '2025-10-08', revenue: 356.20 },
        { date: '2025-10-09', revenue: 289.90 },
        { date: '2025-10-10', revenue: 412.35 },
        { date: '2025-10-11', revenue: 478.60 },
        { date: '2025-10-12', revenue: 521.85 },
        { date: '2025-10-13', revenue: 398.40 },
        { date: '2025-10-14', revenue: 445.75 },
        { date: '2025-10-15', revenue: 502.20 },
        { date: '2025-10-16', revenue: 567.90 },
        { date: '2025-10-17', revenue: 612.45 },
        { date: '2025-10-18', revenue: 654.80 },
      ]);

      setTopProducts([
        { id: 50001, name: 'OG Kush', unitsSold: 28, revenue: 2247.52 },
        { id: 50005, name: 'Gelato', unitsSold: 22, revenue: 2093.78 },
        { id: 50002, name: 'Blue Dream', unitsSold: 19, revenue: 1423.81 },
        { id: 50009, name: 'Wedding Cake', unitsSold: 16, revenue: 1519.84 },
        { id: 50004, name: 'Girl Scout Cookies', unitsSold: 14, revenue: 1259.86 },
      ]);

      setPayout({
        pendingEarnings: 7010.36,
        nextPayoutDate: '2025-11-05',
        lastPayoutAmount: 6234.52,
      });

      setActionItems([
        { id: 1, title: '1 COA expiring soon (OG Kush)', type: 'warning', link: '/vendor/lab-results' },
        { id: 2, title: '3 products low on stock', type: 'warning', link: '/vendor/inventory' },
        { id: 3, title: '1 product pending approval (Durban Poison)', type: 'info', link: '/vendor/products' },
        { id: 4, title: 'New customer review to respond to', type: 'info', link: '/vendor/reviews' },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      default:
        return <Bell size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* Welcome Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-4xl text-white mb-2" style={{ fontFamily: 'Lobster' }}>
          Welcome Back, Yacht Club
        </h1>
        <p className="text-white/60 text-sm">
          Here's what's happening with your store today
        </p>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        {/* Total Products */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Live Products</div>
            <Package size={20} className="text-white/40" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.approved}
          </div>
          <div className="text-white/40 text-xs">Currently selling</div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Pending Review</div>
            <AlertCircle size={20} className="text-yellow-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.pending}
          </div>
          <div className="text-yellow-500/60 text-xs">Awaiting approval</div>
          </div>
        </div>

        {/* Total Sales (30 Days) */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Sales (30 Days)</div>
            <DollarSign size={20} className="text-green-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : `$${stats.totalSales30d.toLocaleString()}`}
          </div>
          <div className="text-green-500/60 text-xs">Revenue this month</div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Low Stock</div>
            <AlertTriangle size={20} className="text-red-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.lowStock}
          </div>
          <div className="text-red-500/60 text-xs">Items need restocking</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <Link
          href="/vendor/products/new"
          className="group bg-transparent hover:bg-black border border-white/10 hover:border-white/20 p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <Plus size={24} className="text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white font-medium transition-colors duration-300">Add Product</div>
          </div>
        </Link>

        <Link
          href="/vendor/products"
          className="group bg-transparent hover:bg-black border border-white/10 hover:border-white/20 p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <Package size={24} className="text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white font-medium transition-colors duration-300">My Products</div>
          </div>
        </Link>

        <Link
          href="/vendor/inventory"
          className="group bg-transparent hover:bg-black border border-white/10 hover:border-white/20 p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <TrendingUp size={24} className="text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white font-medium transition-colors duration-300">Inventory</div>
          </div>
        </Link>

        <Link
          href="/vendor/branding"
          className="group bg-transparent hover:bg-black border border-white/10 hover:border-white/20 p-6 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
              <Package size={24} className="text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white font-medium transition-colors duration-300">Branding</div>
          </div>
        </Link>
      </div>

      {/* Action Items */}
      <div className="mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        <div className="bg-[#1a1a1a] border border-white/5">
          <div className="border-b border-white/5 p-4">
            <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Action Items</h2>
          </div>
          <div className="divide-y divide-white/5">
            {actionItems.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className="flex items-center justify-between p-4 hover:bg-[#303030] transition-all group"
              >
                <div className="flex items-center gap-3">
                  {item.type === 'warning' ? (
                    <AlertTriangle size={16} className="text-yellow-500/80" />
                  ) : (
                    <Bell size={16} className="text-blue-500/80" />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart */}
          <div className="bg-[#1a1a1a] border border-white/5">
            <div className="border-b border-white/5 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Sales Trend</h2>
                <p className="text-white/50 text-xs mt-1">Last 18 days</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" />
                <span className="text-green-500 text-sm font-medium">+24%</span>
              </div>
            </div>
            <div className="p-6">
              {/* Simple Bar Chart */}
              <div className="flex items-end justify-between gap-1 h-32">
                {salesData.map((data, index) => {
                  const maxRevenue = Math.max(...salesData.map(d => d.revenue));
                  const height = (data.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-sky-500/40 to-sky-500/20 hover:from-sky-500/60 hover:to-sky-500/40 transition-all duration-300 cursor-pointer border-t border-sky-500/30 relative group"
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
          <div className="bg-[#1a1a1a] border border-white/5">
            <div className="border-b border-white/5 p-6">
              <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Top Performing Products</h2>
            </div>
            <div className="divide-y divide-white/5">
              {topProducts.map((product, index) => (
                <div key={product.id} className="p-4 hover:bg-[#303030] transition-all flex items-center gap-4">
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
          <div className="bg-[#1a1a1a] border border-white/5">
            <div className="border-b border-white/5 p-6 flex justify-between items-center">
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
                  <div key={product.id} className="p-4 hover:bg-white/5 transition-colors">
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
            <div className="bg-[#1a1a1a] border border-red-500/10">
              <div className="border-b border-white/5 p-6 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500/80" strokeWidth={1.5} />
                <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Low Inventory Warnings</h2>
              </div>
              <div className="divide-y divide-white/5">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-white/5 transition-colors">
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
          <div className="bg-[#1a1a1a] border border-white/5">
            <div className="border-b border-white/5 p-6">
              <h2 className="text-white/90 text-sm uppercase tracking-wider font-light">Payout Summary</h2>
            </div>
            <div className="p-6 space-y-4">
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
                <div className="text-green-500 font-medium">${payout.lastPayoutAmount.toLocaleString()}</div>
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
          <div className="bg-[#1a1a1a] border border-white/5">
            <div className="border-b border-white/5 p-6">
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
                  <div key={notice.id} className="p-4 hover:bg-white/5 transition-colors">
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

