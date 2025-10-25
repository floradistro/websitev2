"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Search,
  Edit2,
  Award,
  Store,
  AlertCircle
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string;
  regular_price: number;
  wholesale_price?: number;
  is_wholesale: boolean;
  wholesale_only: boolean;
  minimum_wholesale_quantity: number;
  vendor?: {
    store_name: string;
  };
  tier_count?: number;
}

export default function BulkWholesalePricing() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'wholesale' | 'retail'>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/products?with_wholesale=true');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'wholesale' && p.is_wholesale) ||
      (filter === 'retail' && !p.is_wholesale);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: products.length,
    wholesale: products.filter(p => p.is_wholesale).length,
    wholesaleOnly: products.filter(p => p.wholesale_only).length,
    withTiers: products.filter(p => p.tier_count && p.tier_count > 0).length
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">Wholesale Pricing Management</h1>
          <p className="text-white/60">Manage pricing for all wholesale products</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <Package className="text-white/40 mb-2" size={20} />
            <p className="text-2xl font-light mb-1">{stats.total}</p>
            <p className="text-xs text-white/40 uppercase tracking-wider">Total Products</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <Store className="text-green-400 mb-2" size={20} />
            <p className="text-2xl font-light mb-1">{stats.wholesale}</p>
            <p className="text-xs text-green-400 uppercase tracking-wider">Wholesale Enabled</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <DollarSign className="text-blue-400 mb-2" size={20} />
            <p className="text-2xl font-light mb-1">{stats.wholesaleOnly}</p>
            <p className="text-xs text-blue-400 uppercase tracking-wider">Wholesale Only</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <TrendingUp className="text-purple-400 mb-2" size={20} />
            <p className="text-2xl font-light mb-1">{stats.withTiers}</p>
            <p className="text-xs text-purple-400 uppercase tracking-wider">With Tier Pricing</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white/5 border border-white/10 rounded-[14px] pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-[14px] px-4 py-2 text-white focus:outline-none focus:border-white/30"
            >
              <option value="all">All Products</option>
              <option value="wholesale">Wholesale Only</option>
              <option value="retail">Retail Only</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/60">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/60">No products found</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Vendor</th>
                  <th className="text-right px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Retail</th>
                  <th className="text-right px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Wholesale</th>
                  <th className="text-center px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Min Qty</th>
                  <th className="text-center px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Tiers</th>
                  <th className="text-center px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Type</th>
                  <th className="text-right px-4 py-3 text-xs text-white/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-white/40">SKU: {product.sku}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {product.vendor?.store_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${product.regular_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.wholesale_price ? (
                        <div>
                          <p className="font-mono text-green-400">${product.wholesale_price.toFixed(2)}</p>
                          <p className="text-xs text-green-400/60">
                            {Math.round(((product.regular_price - product.wholesale_price) / product.regular_price) * 100)}% off
                          </p>
                        </div>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-white/60">
                      {product.is_wholesale ? product.minimum_wholesale_quantity || 1 : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.tier_count && product.tier_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-[14px] text-xs">
                          <Award size={12} />
                          {product.tier_count}
                        </span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.wholesale_only ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-[14px] text-xs">
                          Wholesale
                        </span>
                      ) : product.is_wholesale ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-[14px] text-xs">
                          Both
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/60 rounded-[14px] text-xs">
                          Retail
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => router.push(`/admin/products/${product.id}/wholesale-pricing`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-[14px] text-sm transition-all"
                      >
                        <Edit2 size={14} />
                        Edit Pricing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Help */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-400">
              <p className="font-medium mb-1">Pricing Tips:</p>
              <ul className="space-y-1 text-blue-400/80">
                <li>• Set wholesale prices 20-40% below retail for bulk orders</li>
                <li>• Use tier pricing to reward larger orders</li>
                <li>• Mark products "wholesale only" to hide from retail customers</li>
                <li>• Set minimum quantities to ensure profitable orders</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

