"use client";

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Package, AlertTriangle } from 'lucide-react';

interface ProfitStats {
  total_products_with_cost: number;
  average_margin: number;
  total_inventory_cost: number;
  total_potential_profit: number;
  low_margin_products: number;
  high_margin_products: number;
}

export default function VendorProfitWidget() {
  const [stats, setStats] = useState<ProfitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfitStats();
  }, []);

  async function loadProfitStats() {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const response = await fetch('/api/vendor/profit-stats', {
        headers: {
          'x-vendor-id': vendorId
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load profit stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-white/5 p-6">
        <div className="text-white/40 text-sm">Loading profit data...</div>
      </div>
    );
  }

  if (!stats || stats.total_products_with_cost === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-white/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
            <DollarSign size={20} className="text-white/60" />
          </div>
          <div>
            <h3 className="text-white text-sm font-medium uppercase tracking-wider">Profit Tracking</h3>
            <p className="text-white/40 text-xs">Not Available</p>
          </div>
        </div>
        <p className="text-white/60 text-sm">
          Add cost prices to your products to track profit margins and inventory value.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center border border-green-500/20">
          <DollarSign size={20} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-white text-sm font-medium uppercase tracking-wider">Profit Overview</h3>
          <p className="text-white/40 text-xs">{stats.total_products_with_cost} products tracked</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Average Margin */}
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className={
              stats.average_margin >= 40 ? 'text-green-400' :
              stats.average_margin >= 25 ? 'text-yellow-400' : 'text-red-400'
            } />
            <div className="text-white/60 text-xs uppercase tracking-wider">Avg Margin</div>
          </div>
          <div className={`text-2xl font-light ${
            stats.average_margin >= 40 ? 'text-green-400' :
            stats.average_margin >= 25 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {stats.average_margin.toFixed(1)}%
          </div>
        </div>

        {/* Inventory Cost Value */}
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-blue-400" />
            <div className="text-white/60 text-xs uppercase tracking-wider">Inventory Cost</div>
          </div>
          <div className="text-2xl font-light text-blue-400">
            ${stats.total_inventory_cost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Potential Profit */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-4 mb-4">
        <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Potential Profit</div>
        <div className="text-3xl font-light text-green-400">
          ${stats.total_potential_profit.toLocaleString()}
        </div>
        <p className="text-white/40 text-xs mt-2">
          If all inventory sells at current prices
        </p>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {stats.low_margin_products > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3">
            <AlertTriangle size={14} className="text-red-400" />
            <div className="text-xs text-red-400">
              {stats.low_margin_products} product{stats.low_margin_products !== 1 ? 's' : ''} with low margins (&lt;25%)
            </div>
          </div>
        )}
        
        {stats.high_margin_products > 0 && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 p-3">
            <TrendingUp size={14} className="text-green-400" />
            <div className="text-xs text-green-400">
              {stats.high_margin_products} product{stats.high_margin_products !== 1 ? 's' : ''} with high margins (≥40%)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}













