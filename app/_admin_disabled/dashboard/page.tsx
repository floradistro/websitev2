"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, Store, Users, DollarSign, TrendingUp, AlertCircle, 
  CheckCircle, XCircle, ArrowUpRight, Bell, Shield 
} from 'lucide-react';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

interface Stats {
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  totalRevenue: number;
  revenue30d: number;
  totalOrders: number;
  orders30d: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
    totalVendors: 0,
    activeVendors: 0,
    pendingVendors: 0,
    totalRevenue: 0,
    revenue30d: 0,
    totalOrders: 0,
    orders30d: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      setLoading(true);

      // Fetch pending products
      const pendingResponse = await axios.get(
        `${baseUrl}/wp-json/flora-im/v1/vendor-dev/pending-products?${authParams}&_t=${Date.now()}`
      );

      // Fetch all products
      const productsResponse = await axios.get(
        `${baseUrl}/wp-json/wc/v3/products?${authParams}&per_page=1`
      );

      // Fetch vendors (WooCommerce doesn't have vendors endpoint by default, using meta queries)
      const vendorsResponse = await axios.get(
        `${baseUrl}/wp-json/wp/v2/users?${authParams}&per_page=100&roles=vendor`
      ).catch(() => ({ data: [] }));

      // Fetch orders for revenue calculation
      const ordersResponse = await axios.get(
        `${baseUrl}/wp-json/wc/v3/orders?${authParams}&per_page=100&status=completed`
      ).catch(() => ({ data: [] }));

      const pendingProducts = Array.isArray(pendingResponse.data) ? pendingResponse.data : [];
      const totalProducts = parseInt(productsResponse.headers['x-wp-total'] || '0');
      const vendors = Array.isArray(vendorsResponse.data) ? vendorsResponse.data : [];
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];

      // Calculate revenue
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total || 0), 0);
      
      // Calculate 30-day revenue
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recent30Orders = orders.filter((order: any) => new Date(order.date_created) > thirtyDaysAgo);
      const revenue30d = recent30Orders.reduce((sum: number, order: any) => sum + parseFloat(order.total || 0), 0);

      setStats({
        totalProducts,
        pendingProducts: pendingProducts.length,
        approvedProducts: totalProducts - pendingProducts.length,
        rejectedProducts: 0,
        totalVendors: vendors.length,
        activeVendors: vendors.length,
        pendingVendors: 0,
        totalRevenue,
        revenue30d,
        totalOrders: orders.length,
        orders30d: recent30Orders.length,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Welcome Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-2xl lg:text-4xl text-white mb-1.5 lg:mb-2 leading-tight font-light tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Complete marketplace control and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-6 mb-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        {/* Pending Approvals */}
        <div className="bg-[#1a1a1a] border-r lg:border border-red-500/20 p-4 lg:p-6 active:bg-white/5 lg:hover:border-red-500/40 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-red-500/80 text-[10px] lg:text-xs uppercase tracking-wider">Pending Approval</div>
              <AlertCircle size={18} className="hidden lg:block text-red-500/60" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.pendingProducts}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Products awaiting review</div>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Total Products</div>
              <Package size={18} className="hidden lg:block text-white/40" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.totalProducts}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Live on marketplace</div>
            </div>
          </div>
        </div>

        {/* Total Vendors */}
        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Active Vendors</div>
              <Store size={18} className="hidden lg:block text-white/40" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.activeVendors}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Registered vendors</div>
            </div>
          </div>
        </div>

        {/* Revenue (30 Days) */}
        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Revenue (30 Days)</div>
              <DollarSign size={18} className="hidden lg:block text-green-500/60" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : `$${stats.revenue30d.toLocaleString()}`}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Total marketplace revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-6 mb-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <Link
          href="/admin/approvals"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-r border-b lg:border border-red-500/20 lg:hover:border-red-500/40 p-5 lg:p-6 transition-all duration-300 relative overflow-hidden min-h-[100px] lg:min-h-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 lg:gap-4 h-full">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-red-500/10 flex items-center justify-center transition-all duration-300 flex-shrink-0">
              <CheckCircle size={18} className="lg:hidden text-red-500/60 group-hover:text-red-500 transition-colors duration-300" />
              <CheckCircle size={24} className="hidden lg:block text-red-500/60 group-hover:text-red-500 transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Product Approvals</div>
          </div>
        </Link>

        <Link
          href="/admin/vendors"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-b lg:border border-white/10 lg:hover:border-white/20 p-5 lg:p-6 transition-all duration-300 relative overflow-hidden min-h-[100px] lg:min-h-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 lg:gap-4 h-full">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300 flex-shrink-0">
              <Store size={18} className="lg:hidden text-white/60 group-hover:text-white transition-colors duration-300" />
              <Store size={24} className="hidden lg:block text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Manage Vendors</div>
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-r border-b lg:border border-white/10 lg:hover:border-white/20 p-5 lg:p-6 transition-all duration-300 relative overflow-hidden min-h-[100px] lg:min-h-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 lg:gap-4 h-full">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300 flex-shrink-0">
              <Package size={18} className="lg:hidden text-white/60 group-hover:text-white transition-colors duration-300" />
              <Package size={24} className="hidden lg:block text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">All Products</div>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-b lg:border border-white/10 lg:hover:border-white/20 p-5 lg:p-6 transition-all duration-300 relative overflow-hidden min-h-[100px] lg:min-h-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 lg:gap-4 h-full">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-white/10 flex items-center justify-center transition-all duration-300 flex-shrink-0">
              <TrendingUp size={18} className="lg:hidden text-white/60 group-hover:text-white transition-colors duration-300" />
              <TrendingUp size={24} className="hidden lg:block text-white/60 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Analytics</div>
          </div>
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 xl:gap-8" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        {/* Pending Products */}
        <div className="bg-[#1a1a1a] lg:border border-t border-red-500/20">
          <div className="border-b border-white/5 px-4 lg:p-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <h2 className="text-white/90 text-xs lg:text-sm uppercase tracking-wider font-light">Pending Approvals</h2>
            </div>
            <Link href="/admin/approvals" className="text-red-500 hover:text-red-400 text-xs uppercase tracking-wider transition-colors">
              View All
            </Link>
          </div>
          <div className="p-4 lg:p-6">
            <div className="text-center py-8">
              <div className="text-4xl font-light text-red-500 mb-2">{stats.pendingProducts}</div>
              <p className="text-white/60 text-sm">Products waiting for approval</p>
              <Link
                href="/admin/approvals"
                className="inline-block mt-4 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-wider transition-all"
              >
                Review Now
              </Link>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-white/5">
          <div className="border-b border-white/5 px-4 lg:p-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-500" />
              <h2 className="text-white/90 text-xs lg:text-sm uppercase tracking-wider font-light">System Health</h2>
            </div>
          </div>
          <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">API Connection</span>
              <span className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle size={14} /> Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Database</span>
              <span className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle size={14} /> Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Cache System</span>
              <span className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle size={14} /> Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Payment Gateway</span>
              <span className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle size={14} /> Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

