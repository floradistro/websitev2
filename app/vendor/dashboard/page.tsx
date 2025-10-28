"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, TrendingUp, DollarSign, AlertTriangle, Calendar, Store, Image, FileCode, Palette, CheckCircle, Bell, Briefcase } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import VendorProfitWidget from '@/components/VendorProfitWidget';
import { useVendorDashboard } from '@/hooks/useVendorData';
import { DashboardSkeleton } from '@/components/vendor/VendorSkeleton';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { QuickAction } from '@/components/ui/QuickAction';
import { Badge } from '@/components/ui/Badge';

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
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: dashboardData, loading, error } = useVendorDashboard();
  
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalSales30d: 0,
    lowStock: 0,
  });
  const [payout, setPayout] = useState({
    pendingEarnings: 0,
    nextPayoutDate: '',
    lastPayoutAmount: 0,
  });

  // Process dashboard data when it loads
  useEffect(() => {
    if (!dashboardData) return;
    
    // Update stats
    setStats(dashboardData.stats || {
      totalProducts: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalSales30d: 0,
      lowStock: 0,
    });

    // Set dashboard data
    setRecentProducts(dashboardData.recentProducts || []);
    
    const lowStockMapped = (dashboardData.lowStockItems || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      currentStock: item.currentStock,
      threshold: item.threshold
    }));
    setLowStockItems(lowStockMapped);

    // Set sales trend data
    setSalesData(dashboardData.sales_data || []);
    
    // Set top products
    setTopProducts(dashboardData.topProducts || []);
    
    // Generate notices from stats
    const newNotices: Notice[] = [];
    if (dashboardData.stats?.pending_review > 0) {
      newNotices.push({
        id: 1,
        type: 'info',
        message: `${dashboardData.stats.pending_review} product(s) awaiting admin approval`,
        date: new Date().toISOString()
      });
    }
    if (dashboardData.stats?.low_stock_items > 0) {
      newNotices.push({
        id: 2,
        type: 'warning',
        message: `${dashboardData.stats.low_stock_items} product(s) running low on stock`,
        date: new Date().toISOString()
      });
    }
    setNotices(newNotices);

    // Calculate payout info from LIVE stats
    setPayout({
      pendingEarnings: (dashboardData.stats?.sales_30_days || 0) * 0.85,
      nextPayoutDate: getNextPayoutDate(),
      lastPayoutAmount: 0,
    });

    // Generate action items from LIVE data
    const actions: ActionItem[] = [];
    if ((dashboardData.stats?.pending_review || 0) > 0) {
      actions.push({
        id: 1,
        title: `You have ${dashboardData.stats.pending_review} product(s) awaiting approval`,
        type: 'info',
        link: '/vendor/products'
      });
    }
    if ((dashboardData.stats?.low_stock_items || 0) > 0) {
      actions.push({
        id: 2,
        title: `${dashboardData.stats.low_stock_items} product(s) need restocking`,
        type: 'warning',
        link: '/vendor/inventory'
      });
    }
    setActionItems(actions);
  }, [dashboardData]);

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

  // Show skeleton while loading
  if (loading || authLoading) {
    return <DashboardSkeleton />;
  }

  const vendorBranding = dashboardData?.vendor;

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Hero Header with Vendor Branding */}
      <div className="mb-6 md:mb-12">
        <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.02] via-transparent to-transparent border border-white/5 rounded-3xl p-6 lg:p-10">
          {/* Subtle animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-transparent opacity-50 animate-pulse" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Vendor Logo + Info */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Vendor Logo with Glow */}
              {vendorBranding?.logo_url ? (
                <div className="relative group">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:border-white/40">
                    <img
                      src={vendorBranding.logo_url}
                      alt={vendor?.store_name || 'Vendor'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-2xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ) : (
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-white/20">
                  <Store size={32} className="text-white/60" />
                </div>
              )}

              {/* Welcome Text */}
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-white uppercase tracking-tight mb-1 bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent" style={{ fontWeight: 900 }}>
                  {vendor?.store_name || 'Dashboard'}
                </h1>
                <p className="text-white/60 text-xs lg:text-sm">
                  {vendorBranding?.store_tagline || 'Vendor Portal'} · {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Right: Quick Stats Summary */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4 w-full lg:w-auto">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Live</div>
                <div className="text-white text-lg lg:text-2xl font-bold">{stats.approved}</div>
                <div className="text-[9px] text-white/60">Products</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">30d</div>
                <div className="text-white text-lg lg:text-2xl font-bold">${stats.totalSales30d.toFixed(0)}</div>
                <div className="text-[9px] text-white/60">Revenue</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Stock</div>
                <div className="text-white text-lg lg:text-2xl font-bold">{stats.lowStock}</div>
                <div className="text-[9px] text-white/60">Low Items</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-8">
        <StatCard
          label="Live Products"
          value={loading ? '—' : stats.approved}
          sublabel="Currently Selling"
          icon={Package}
          loading={loading}
          delay="0s"
        />
        <StatCard
          label="Pending Review"
          value={loading ? '—' : stats.pending}
          sublabel="Awaiting Approval"
          icon={AlertCircle}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="Revenue (30d)"
          value={loading ? '—' : `$${stats.totalSales30d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel="This Month"
          icon={DollarSign}
          loading={loading}
          delay="0.2s"
        />
        <StatCard
          label="Low Stock"
          value={loading ? '—' : stats.lowStock}
          sublabel={stats.lowStock > 0 ? 'Need Restocking' : 'All Stocked'}
          icon={AlertTriangle}
          loading={loading}
          delay="0.3s"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 md:mb-12">
        <div className="border-b border-white/5 pb-3 mb-4">
          <h2 className="text-xs uppercase tracking-[0.15em] text-white/60 font-bold">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
          <Link
            href={`/storefront?vendor=${vendor?.slug || 'flora-distro'}`}
            target="_blank"
            className="relative group col-span-2 sm:col-span-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4 md:p-6 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-blue-400/30">
                <Store size={24} className="text-blue-300" strokeWidth={2} />
              </div>
              <div className="text-white font-bold text-sm mb-1">View Storefront</div>
              <div className="text-white/60 text-[10px] uppercase tracking-wider">Live Preview</div>
            </div>
          </Link>
          <Link
            href="/vendor/products/new"
            className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Plus size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="text-white font-bold text-sm">Add Product</div>
          </Link>
          <Link
            href="/vendor/products"
            className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Package size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="text-white font-bold text-sm">My Products</div>
          </Link>
          <Link
            href="/vendor/inventory"
            className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="text-white font-bold text-sm">Inventory</div>
          </Link>
          <Link
            href="/vendor/media-library"
            className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Image size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="text-white font-bold text-sm">Media</div>
          </Link>
          <Link
            href="/vendor/branding"
            className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Palette size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="text-white font-bold text-sm">Branding</div>
          </Link>
          <Link
            href="/vendor/component-editor"
            className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FileCode size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="text-white font-bold text-sm">Editor</div>
          </Link>
        </div>
      </div>

      {/* Recent Products & Low Stock */}
      <div className="space-y-4 md:space-y-6">
        {recentProducts.length > 0 && (
          <Card padding="none" className="">
            <CardHeader
              title="Recent Products"
              subtitle="Latest submissions"
              action={
                <Link href="/vendor/products" className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors">
                  View All
                </Link>
              }
            />
            <div className="divide-y divide-white/5">
              {recentProducts.map((product) => (
                <div key={product.id} className="list-item">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Package size={16} className="text-white/30 md:hidden" />
                          <Package size={20} className="text-white/30 hidden md:block" />
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium mb-1 text-xs md:text-sm">{product.name}</div>
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-white/40">
                        <Calendar size={10} className="md:hidden" />
                        <Calendar size={12} className="hidden md:block" />
                        <span>{product.submittedDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <Badge
                        variant={
                          product.status === 'approved' ? 'success' :
                          product.status === 'rejected' ? 'error' :
                          'neutral'
                        }
                      >
                        {product.status}
                      </Badge>
                      <Link href="/vendor/inventory" className="button-secondary px-2 md:px-3 py-1.5 md:py-2 text-[9px] md:text-[10px]">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {lowStockItems.length > 0 && (
          <Card padding="none" className="border-red-500/10">
            <div className="border-b border-white/5 p-4 md:p-6 flex items-center gap-2 md:gap-3">
              <AlertTriangle size={14} className="text-red-500 md:hidden" strokeWidth={1.5} />
              <AlertTriangle size={16} className="text-red-500 hidden md:block" strokeWidth={1.5} />
              <h2 className="text-label text-xs md:text-sm">Low Inventory Warnings</h2>
            </div>
            <div className="divide-y divide-white/5">
              {lowStockItems.map((item) => (
                <div key={item.id} className="list-item">
                  <div className="flex items-center justify-between gap-2 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium mb-1 text-xs md:text-sm">{item.name}</div>
                      <div className="text-[10px] md:text-xs text-white/60">
                        Only <span className="text-red-500 font-medium">{item.currentStock}g</span> remaining (Threshold: {item.threshold}g)
                      </div>
                    </div>
                    <Link href="/vendor/inventory" className="button-secondary px-2 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] hover:bg-white hover:text-black hover:border-white flex-shrink-0">
                      Restock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <VendorProfitWidget />
      </div>
    </div>
  );
}
