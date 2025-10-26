"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp, DollarSign, AlertTriangle, Bell, Calendar, ArrowUpRight, ArrowDownRight, FileText, MessageSquare, Store, Image, FileCode, Palette } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import VendorProfitWidget from '@/components/VendorProfitWidget';
import { useVendorDashboard } from '@/hooks/useVendorData';
import { DashboardSkeleton } from '@/components/vendor/VendorSkeleton';

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

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-white/5 text-white/60 border-white/10",
      pending: "bg-white/5 text-white/60 border-white/10",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      draft: "bg-white/5 text-white/60 border-white/10",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded-[14px] ${styles[status as keyof typeof styles] || styles.draft}`}>
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

  // Show skeleton while loading
  if (loading || authLoading) {
    return <DashboardSkeleton />;
  }

  const vendorBranding = dashboardData?.vendor;

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Header */}
      <div className="mb-12 fade-in">
        <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
          {vendor?.store_name || 'Dashboard'}
        </h1>
        <p className="text-white/40 text-xs font-light tracking-wide">
          {vendorBranding?.store_tagline?.toUpperCase() || 'VENDOR PORTAL'} · {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {/* Live Products */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Live Products</span>
            <Package size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            {loading ? '—' : stats.approved}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Currently Selling</div>
        </div>

        {/* Pending Review */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Pending Review</span>
            <AlertCircle size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            {loading ? '—' : stats.pending}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Awaiting Approval</div>
        </div>

        {/* Sales (30 Days) */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Revenue (30d)</span>
            <DollarSign size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            ${loading ? '—' : stats.totalSales30d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">This Month</div>
        </div>

        {/* Low Stock */}
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Low Stock</span>
            <AlertTriangle size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-thin text-white/90 mb-2">
            {loading ? '—' : stats.lowStock}
          </div>
          <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">
            {stats.lowStock > 0 ? 'Need Restocking' : 'All Stocked'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8 fade-in" style={{ animationDelay: '0.4s' }}>
        <Link
          href={`/storefront?vendor=${vendor?.slug || 'flora-distro'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 relative overflow-hidden flex items-center gap-4 col-span-2 lg:col-span-2 border-white/10"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-blue-500/20 group-hover:border-blue-500/30">
            <Store size={20} className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="text-white/90 group-hover:text-white text-sm uppercase tracking-[0.15em] font-light transition-colors duration-300 mb-1">View Storefront</div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider">Live Preview</div>
          </div>
          <ArrowUpRight size={16} className="text-white/30 group-hover:text-white/60 transition-all duration-300" />
        </Link>

        <Link
          href="/vendor/products/new"
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 relative overflow-hidden flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
            <Plus size={20} className="text-white/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">Add Product</div>
        </Link>

        <Link
          href="/vendor/products"
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
            <Package size={20} className="text-white/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">My Products</div>
        </Link>

        <Link
          href="/vendor/inventory"
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
            <TrendingUp size={20} className="text-white/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">Inventory</div>
        </Link>

        <Link
          href="/vendor/media-library"
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
            <Image size={20} className="text-white/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">Media</div>
        </Link>

        <Link
          href="/vendor/branding"
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
            <Palette size={20} className="text-white/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">Branding</div>
        </Link>

        <Link
          href="/vendor/component-editor"
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
            <FileCode size={20} className="text-white/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">Editor</div>
        </Link>
      </div>

      {/* Recent Products & Low Stock */}
      <div className="space-y-6">
        {recentProducts.length > 0 && (
          <div className="minimal-glass">
            <div className="border-b border-white/5 p-6 flex justify-between items-center">
              <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">Recent Products</h2>
              <Link href="/vendor/products" className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors">
                View All
              </Link>
            </div>
            <div className="divide-y divide-white/10">
              {recentProducts.map((product) => (
                <div key={product.id} className="p-6 hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-white/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium mb-1 text-sm">{product.name}</div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar size={12} />
                        <span>{product.submittedDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(product.status)}
                      <Link href="/vendor/inventory" className="text-white/60 hover:text-white text-xs transition-colors">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="minimal-glass border-red-500/10">
            <div className="border-b border-white/5 p-6 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-500" strokeWidth={1.5} />
              <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">Low Inventory Warnings</h2>
            </div>
            <div className="divide-y divide-white/5">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-6 hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium mb-1">{item.name}</div>
                      <div className="text-xs text-white/60">
                        Only <span className="text-red-500 font-medium">{item.currentStock}g</span> remaining (Threshold: {item.threshold}g)
                      </div>
                    </div>
                    <Link href="/vendor/inventory" className="text-xs text-white bg-black border border-white/20 hover:bg-white hover:text-black hover:border-white px-4 py-2 uppercase tracking-wider transition-all duration-300">
                      Restock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <VendorProfitWidget />
      </div>
    </div>
  );
}
