"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp, DollarSign, AlertTriangle, Bell, Calendar } from 'lucide-react';

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
          id: 41735,
          name: "Lemon Cherry Diesel",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-16"
        },
        {
          id: 41733,
          name: "Detroit Runts",
          image: "/placeholder.jpg",
          status: "pending",
          submittedDate: "2025-10-17"
        },
        {
          id: 41588,
          name: "Black Jack",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-14"
        },
        {
          id: 41587,
          name: "Space Runtz",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-15"
        },
        {
          id: 41586,
          name: "Black Ice Runtz",
          image: "/placeholder.jpg",
          status: "rejected",
          submittedDate: "2025-10-13"
        },
        {
          id: 41734,
          name: "Blue Zushi",
          image: "/placeholder.jpg",
          status: "approved",
          submittedDate: "2025-10-12"
        },
      ]);

      setLowStockItems([
        {
          id: 41733,
          name: "Detroit Runts",
          currentStock: 8.5,
          threshold: 20
        },
        {
          id: 41585,
          name: "Mango Gusher",
          currentStock: 12.25,
          threshold: 20
        },
        {
          id: 41732,
          name: "Dirty Sprite",
          currentStock: 4.0,
          threshold: 15
        },
      ]);

      setNotices([
        {
          id: 1,
          message: "Your product 'Lemon Cherry Diesel' was approved and is now live!",
          type: "success",
          date: "2 hours ago"
        },
        {
          id: 2,
          message: "New order from Zachariah Kryger - $50.75 (Order #41778)",
          type: "success",
          date: "3 hours ago"
        },
        {
          id: 3,
          message: "Product 'Black Ice Runtz' needs better photos and COA. Please resubmit.",
          type: "warning",
          date: "1 day ago"
        },
        {
          id: 4,
          message: "Low stock alert: 'Detroit Runts' has only 8.5g remaining",
          type: "warning",
          date: "2 days ago"
        },
        {
          id: 5,
          message: "Commission payout for October ($3,482.35) is scheduled for Nov 5th.",
          type: "info",
          date: "3 days ago"
        },
        {
          id: 6,
          message: "Your product 'Blue Zushi' received a 5-star review from Jordan Cooper",
          type: "success",
          date: "4 days ago"
        },
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
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-white/60 text-sm">
          Here's what's happening with your store today
        </p>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Products */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Live Products</div>
            <Package size={20} className="text-white/40" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.approved}
          </div>
          <div className="text-white/40 text-xs">Currently selling</div>
        </div>

        {/* Pending Review */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Pending Review</div>
            <AlertCircle size={20} className="text-yellow-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.pending}
          </div>
          <div className="text-yellow-500/60 text-xs">Awaiting approval</div>
        </div>

        {/* Total Sales (30 Days) */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Sales (30 Days)</div>
            <DollarSign size={20} className="text-green-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : `$${stats.totalSales30d.toLocaleString()}`}
          </div>
          <div className="text-green-500/60 text-xs">Revenue this month</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/vendor/products/new"
          className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-6 rounded transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Plus size={24} className="text-white" />
            </div>
            <div>
              <div className="text-white font-medium">Add Product</div>
              <div className="text-white/60 text-xs">Submit new product</div>
            </div>
          </div>
        </Link>

        <Link
          href="/vendor/products"
          className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-6 rounded transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <div className="text-white font-medium">My Products</div>
              <div className="text-white/60 text-xs">View all products</div>
            </div>
          </div>
        </Link>

        <Link
          href="/vendor/inventory"
          className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-6 rounded transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <div className="text-white font-medium">Inventory</div>
              <div className="text-white/60 text-xs">Manage stock</div>
            </div>
          </div>
        </Link>

        <Link
          href="/vendor/settings"
          className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-6 rounded transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <div className="text-white font-medium">Settings</div>
              <div className="text-white/60 text-xs">Edit profile</div>
            </div>
          </div>
        </Link>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Product Submissions */}
          <div className="bg-[#2a2a2a] border border-white/10 rounded">
            <div className="border-b border-white/10 p-6 flex justify-between items-center">
              <h2 className="text-white font-medium">Recent Product Submissions</h2>
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
            <div className="bg-[#2a2a2a] border border-red-500/20 rounded">
              <div className="border-b border-white/10 p-6 flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-500" />
                <h2 className="text-white font-medium">Low Inventory Warnings</h2>
              </div>
              <div className="divide-y divide-white/10">
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
                        className="text-xs text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors"
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
          {/* Vendor Notices */}
          <div className="bg-[#2a2a2a] border border-white/10 rounded">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-white font-medium">Notices</h2>
            </div>
            <div className="divide-y divide-white/10">
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

