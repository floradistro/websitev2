"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp, DollarSign, AlertTriangle, Bell, Calendar, ArrowUpRight, ArrowDownRight, FileText, MessageSquare, Store, Image, FileCode, Palette } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import VendorProfitWidget from '@/components/VendorProfitWidget';
import axios from 'axios';

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
  const [vendorLogo, setVendorLogo] = useState<string | null>(null);
  const [vendorBranding, setVendorBranding] = useState<any>(null);

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

  // Load dashboard once on mount - no auto-refresh to prevent slowness
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDashboard();
    }
  }, [authLoading, isAuthenticated]);

  async function loadDashboard() {
      // Don't load if auth is still loading or not authenticated
      if (authLoading || !isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get vendor ID from localStorage
        const vendorId = localStorage.getItem('vendor_id');
        if (!vendorId) {
          setLoading(false);
          return;
        }

        // Use bulk endpoint - gets branding + dashboard data in ONE call
        const response = await axios.get('/api/page-data/vendor-dashboard', {
          headers: {
            'x-vendor-id': vendorId
          }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to load dashboard');
        }
        
        const data = response.data.data;
        
        // Set vendor branding
        if (data.vendor) {
          setVendorBranding(data.vendor);
          setVendorLogo(data.vendor.logo_url || null);
        }
        
        // Update stats
        setStats(data.stats || {
          totalProducts: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          totalSales30d: 0,
          lowStock: 0,
        });

        // Set dashboard data
        setRecentProducts(data.recentProducts || []);
        
        const lowStockMapped = (data.lowStockItems || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          currentStock: item.currentStock,
          threshold: item.threshold
        }));
        setLowStockItems(lowStockMapped);

        // Set sales trend data
        setSalesData(data.sales_data || []);
        
        // Generate notices from stats
        const newNotices: Notice[] = [];
        if (data.stats?.pending_review > 0) {
          newNotices.push({
            id: 1,
            type: 'info',
            message: `${data.stats.pending_review} product(s) awaiting admin approval`,
            date: new Date().toISOString()
          });
        }
        if (data.stats?.low_stock_items > 0) {
          newNotices.push({
            id: 2,
            type: 'warning',
            message: `${data.stats.low_stock_items} product(s) running low on stock`,
            date: new Date().toISOString()
          });
        }
        setNotices(newNotices);

        // Calculate payout info from LIVE stats
        setPayout({
          pendingEarnings: (data.stats?.sales_30_days || 0) * 0.85, // After 15% commission
          nextPayoutDate: getNextPayoutDate(),
          lastPayoutAmount: 0,
        });
        
        console.log('✅ Dashboard loaded successfully');

        // Generate action items from LIVE data
        const actions: ActionItem[] = [];
        if ((data.stats?.pending_review || 0) > 0) {
          actions.push({
            id: 1,
            title: `You have ${data.stats.pending_review} product(s) awaiting approval`,
            type: 'info',
            link: '/vendor/products'
          });
        }
        if ((data.stats?.low_stock_items || 0) > 0) {
          actions.push({
            id: 2,
            title: `${data.stats.low_stock_items} product(s) need restocking`,
            type: 'warning',
            link: '/vendor/inventory'
          });
        }
        setActionItems(actions);

        setLoading(false);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading dashboard:', error);
        }
        setLoading(false);
      }
  }

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
          className="group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4 col-span-2 lg:col-span-1"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
            <FileCode size={20} className="text-white/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
          </div>
          <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">Editor</div>
        </Link>
      </div>

      {/* Action Items */}
      <div className="mb-8 fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="minimal-glass">
          <div className="border-b border-white/5 p-6">
            <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">Action Items</h2>
          </div>
          <div className="divide-y divide-white/5">
            {actionItems.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group"
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 xl:gap-3 mb-8 fade-in" style={{ animationDelay: '0.6s' }}>
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-3">
          {/* Sales Chart */}
          <div className="minimal-glass">
            <div className="border-b border-white/5 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Sales Trend</h2>
                <p className="text-white/30 text-[10px] font-light">LAST 18 DAYS</p>
              </div>
              {salesData.length > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-white/60" />
                  <span className="text-white/60 text-sm font-medium">+24%</span>
                </div>
              )}
            </div>
            <div className="p-6">
              {/* Simple Bar Chart */}
              <div className="flex items-end justify-between gap-1 lg:gap-2 h-32 lg:h-48">
                {salesData.length > 0 ? (
                  salesData.map((data, index) => {
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
                  })
                ) : (
                  // No sales data - show empty state message
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white/40 text-xs text-center">
                      No sales data available
                    </div>
                  </div>
                )}
              </div>
              {salesData.length > 0 && (
                <div className="mt-4 flex justify-between text-xs text-white/40">
                  <span>{new Date(salesData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>Today</span>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="minimal-glass">
            <div className="border-b border-white/5 p-6">
              <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">Top Performing Products</h2>
            </div>
            <div className="divide-y divide-white/5">
              {topProducts.map((product, index) => (
                <div key={product.id} className="p-6 hover:bg-white/[0.02] transition-all flex items-center gap-4">
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
          <div className="minimal-glass">
            <div className="border-b border-white/5 p-6 flex justify-between items-center">
              <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">Recent Product Submissions</h2>
              <Link href="/vendor/products" className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors">
                View All
              </Link>
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-12 text-center text-white/40 text-xs">Loading...</div>
              ) : recentProducts.length === 0 ? (
                <div className="p-12 text-center text-white/40 text-xs">
                  No products yet. Add your first product to get started!
                </div>
              ) : (
                recentProducts.map((product) => (
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
                        <Link
                          href="/vendor/inventory"
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
        <div className="space-y-3">
          {/* Profit Margin Widget */}
          <VendorProfitWidget />

          {/* Payout Summary */}
          <div className="minimal-glass">
            <div className="border-b border-white/5 p-6">
              <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">Payout Summary</h2>
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
                <div className="text-white font-medium">${payout.lastPayoutAmount.toLocaleString()}</div>
              </div>

              <Link
                href="/vendor/payouts"
                className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-white/10 to-white/5 text-white/70 border border-white/10 hover:border-white/20 hover:text-white rounded-[14px] text-xs uppercase tracking-wider transition-all duration-300 mt-4"
              >
                View Payout History
              </Link>
            </div>
          </div>

          {/* Vendor Notices */}
          <div className="minimal-glass">
            <div className="border-b border-white/5 p-6">
              <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">Notices</h2>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-6 text-center text-white/40 text-xs">Loading...</div>
              ) : notices.length === 0 ? (
                <div className="p-6 text-center text-white/40 text-xs">
                  No new notices
                </div>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className="p-6 hover:bg-white/[0.02] transition-all">
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

