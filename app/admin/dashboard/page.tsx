"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Store, DollarSign, AlertCircle, CheckCircle, TrendingUp, Shield } from 'lucide-react';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingProducts: 0,
    totalProducts: 0,
    activeVendors: 0,
    revenue30d: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const pendingResponse = await axios.get(
        `${baseUrl}/wp-json/flora-im/v1/vendor-dev/pending-products?${authParams}&_t=${Date.now()}`
      );

      const productsResponse = await axios.get(
        `${baseUrl}/wp-json/wc/v3/products?${authParams}&per_page=1`
      );

      setStats({
        pendingProducts: Array.isArray(pendingResponse.data) ? pendingResponse.data.length : 0,
        totalProducts: parseInt(productsResponse.headers['x-wp-total'] || '0'),
        activeVendors: 0,
        revenue30d: 0,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl text-white mb-2 font-light">Admin Dashboard</h1>
      <p className="text-white/60 text-sm mb-8">Complete marketplace control</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] border border-red-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-red-500/80 text-xs uppercase tracking-wider">Pending Approval</div>
            <AlertCircle size={18} className="text-red-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.pendingProducts}
          </div>
          <div className="text-white/40 text-xs">Products awaiting review</div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Total Products</div>
            <Package size={18} className="text-white/40" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.totalProducts}
          </div>
          <div className="text-white/40 text-xs">Live on marketplace</div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Active Vendors</div>
            <Store size={18} className="text-white/40" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : stats.activeVendors}
          </div>
          <div className="text-white/40 text-xs">Registered vendors</div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-xs uppercase tracking-wider">Revenue (30 Days)</div>
            <DollarSign size={18} className="text-green-500/60" />
          </div>
          <div className="text-3xl font-light text-white mb-1">
            {loading ? '—' : `$${stats.revenue30d.toLocaleString()}`}
          </div>
          <div className="text-white/40 text-xs">Total marketplace revenue</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/admin/approvals"
          className="bg-[#1a1a1a] border border-red-500/20 hover:border-red-500/40 p-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 flex items-center justify-center">
              <CheckCircle size={24} className="text-red-500" />
            </div>
            <div className="text-white font-medium">Product Approvals</div>
          </div>
        </Link>

        <Link
          href="/admin/vendors"
          className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 p-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
              <Store size={24} className="text-white/60" />
            </div>
            <div className="text-white font-medium">Manage Vendors</div>
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 p-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
              <Package size={24} className="text-white/60" />
            </div>
            <div className="text-white font-medium">All Products</div>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 p-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-white/60" />
            </div>
            <div className="text-white font-medium">Analytics</div>
          </div>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-red-500/20 p-6">
          <h2 className="text-white text-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            Pending Approvals
          </h2>
          <div className="text-center py-8">
            <div className="text-4xl font-light text-red-500 mb-2">{stats.pendingProducts}</div>
            <p className="text-white/60 text-sm mb-4">Products waiting for approval</p>
            <Link
              href="/admin/approvals"
              className="inline-block px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-wider transition-all"
            >
              Review Now
            </Link>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <h2 className="text-white text-lg mb-4 flex items-center gap-2">
            <Shield size={18} className="text-green-500" />
            System Health
          </h2>
          <div className="space-y-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}
