"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, Store } from 'lucide-react';

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
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <h1 className="text-2xl lg:text-4xl text-white mb-1.5 lg:mb-2 leading-tight font-light tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Complete marketplace control
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-0 lg:gap-6 mb-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        {/* Total Products */}
        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Products</div>
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

        {/* Pending Approval */}
        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-yellow-500/20 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <Link href="/admin/approvals" className="absolute inset-0 z-10"></Link>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Pending</div>
              <AlertCircle size={18} className="hidden lg:block text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-yellow-500 mb-0.5 lg:mb-1">
                {loading ? '—' : stats.pendingProducts}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Awaiting approval</div>
            </div>
          </div>
        </div>

        {/* Active Vendors */}
        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <Link href="/admin/vendors" className="absolute inset-0 z-10"></Link>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Vendors</div>
              <Store size={18} className="hidden lg:block text-white/40" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.activeVendors}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Active vendors</div>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Customers</div>
              <Users size={18} className="hidden lg:block text-white/40" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.totalCustomers}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Registered</div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Orders</div>
              <TrendingUp size={18} className="hidden lg:block text-white/40" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.totalOrders}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Total processed</div>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-green-500/20 lg:hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Revenue</div>
              <DollarSign size={18} className="hidden lg:block text-green-500" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-green-500 mb-0.5 lg:mb-1">
                {loading ? '—' : `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">All-time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-6 mb-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <Link
          href="/admin/approvals"
          className="group bg-transparent active:bg-white/5 lg:hover:bg-black border-r border-b lg:border border-white/10 lg:hover:border-yellow-500/20 p-5 lg:p-6 transition-all duration-300 relative overflow-hidden min-h-[100px] lg:min-h-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 lg:gap-4 h-full">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black group-hover:bg-yellow-500/10 flex items-center justify-center transition-all duration-300 flex-shrink-0">
              <AlertCircle size={18} className="lg:hidden text-yellow-500" />
              <AlertCircle size={24} className="hidden lg:block text-yellow-500" />
            </div>
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Approvals</div>
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
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Vendors</div>
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
            <div className="text-white/80 group-hover:text-white text-xs lg:text-base font-medium transition-colors duration-300 text-center lg:text-left">Products</div>
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

      {/* Pending Approvals Alert */}
      {stats.pendingProducts > 0 && (
        <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-yellow-500/20 mb-0 lg:mb-8">
          <div className="px-4 lg:p-6 py-4">
            <div className="flex items-start gap-4">
              <AlertCircle size={24} className="text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-white text-sm font-medium mb-1">Pending Product Approvals</h3>
                <p className="text-white/60 text-xs mb-3">
                  You have {stats.pendingProducts} product{stats.pendingProducts !== 1 ? 's' : ''} waiting for approval
                </p>
                <Link 
                  href="/admin/approvals"
                  className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 text-xs uppercase tracking-wider font-medium hover:bg-yellow-400 transition-all"
                >
                  <CheckCircle size={14} />
                  Review Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
