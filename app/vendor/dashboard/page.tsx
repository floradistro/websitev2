"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export default function VendorDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalInventory: 0,
    lowStock: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual stats from API
    // For now, mock data
    setTimeout(() => {
      setStats({
        totalProducts: 12,
        approved: 8,
        pending: 3,
        rejected: 1,
        totalInventory: 1250,
        lowStock: 2,
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-white/60 text-sm">
          Manage your products, inventory, and orders
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Products */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Total Products</div>
            <Package size={20} className="text-white/40" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.totalProducts}
          </div>
          <div className="text-white/40 text-xs">All statuses</div>
        </div>

        {/* Approved */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Approved</div>
            <CheckCircle size={20} className="text-green-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.approved}
          </div>
          <div className="text-green-500/60 text-xs">Live on site</div>
        </div>

        {/* Pending Review */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Pending</div>
            <AlertCircle size={20} className="text-yellow-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.pending}
          </div>
          <div className="text-yellow-500/60 text-xs">Awaiting review</div>
        </div>

        {/* Rejected */}
        <div className="bg-[#2a2a2a] border border-white/10 p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Rejected</div>
            <XCircle size={20} className="text-red-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.rejected}
          </div>
          <div className="text-red-500/60 text-xs">Needs changes</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#2a2a2a] border border-white/10 rounded">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-white font-medium">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-white/60 text-sm text-center py-8">
            No recent activity. Start by adding your first product!
          </div>
        </div>
      </div>
    </div>
  );
}

