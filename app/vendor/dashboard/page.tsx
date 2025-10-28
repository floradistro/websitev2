"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, TrendingUp, DollarSign, AlertTriangle, Calendar, Store, Image, FileCode, Palette, CheckCircle, Bell } from 'lucide-react';
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
      {/* Header */}
      <div className="mb-6 md:mb-12">
        <h1 className="text-xl md:text-3xl font-thin text-white/90 tracking-tight mb-2">
          {vendor?.store_name || 'Dashboard'}
        </h1>
        <p className="text-white/40 text-[10px] md:text-xs font-light tracking-wide">
          {vendorBranding?.store_tagline?.toUpperCase() || 'VENDOR PORTAL'} · {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
        </p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3 mb-4 md:mb-8">
        <QuickAction
          href={`/storefront?vendor=${vendor?.slug || 'flora-distro'}`}
          icon={Store}
          label="View Storefront"
          sublabel="Live Preview"
          variant="highlight"
          external
          cols={2}
        />
        <QuickAction
          href="/vendor/products/new"
          icon={Plus}
          label="Add Product"
        />
        <QuickAction
          href="/vendor/products"
          icon={Package}
          label="My Products"
        />
        <QuickAction
          href="/vendor/inventory"
          icon={TrendingUp}
          label="Inventory"
        />
        <QuickAction
          href="/vendor/media-library"
          icon={Image}
          label="Media"
        />
        <QuickAction
          href="/vendor/branding"
          icon={Palette}
          label="Branding"
        />
        <QuickAction
          href="/vendor/component-editor"
          icon={FileCode}
          label="Editor"
        />
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
