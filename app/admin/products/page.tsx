"use client";

import { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/supabase/products?per_page=200');
        const data = await response.json();
        setProducts(data.products || []);
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      published: { className: 'border-green-500 text-green-500', text: 'Published' },
      draft: { className: 'border-white/20 text-white/40', text: 'Draft' },
      pending: { className: 'border-yellow-500 text-yellow-500', text: 'Pending' },
      archived: { className: 'border-red-500 text-red-500', text: 'Archived' },
    };

    const { className, text } = config[status as keyof typeof config] || config.draft;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] lg:text-xs font-medium uppercase tracking-wider border ${className}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
          All Products
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 lg:py-4 mb-0 lg:mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="lg:w-[18px] lg:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-white/40 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/20 transition-colors text-sm lg:text-base"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-shrink-0 px-3 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1a1a1a] text-white/60 active:text-white lg:hover:text-white border border-white/5 active:border-white/10 lg:hover:border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`flex-shrink-0 px-3 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border ${
                statusFilter === 'published'
                  ? 'border-green-500 text-green-500'
                  : 'border-white/10 text-white/60 active:text-white active:border-white/20 lg:hover:text-white lg:hover:border-white/20'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`flex-shrink-0 px-3 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border ${
                statusFilter === 'draft'
                  ? 'border-white text-white'
                  : 'border-white/10 text-white/60 active:text-white active:border-white/20 lg:hover:text-white lg:hover:border-white/20'
              }`}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      {/* Products Table - Desktop */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center text-white/60">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center">
          <Package size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-4">No products found</div>
        </div>
      ) : (
        <div className="hidden lg:block bg-[#1a1a1a] border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Price</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Stock</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-[#303030] transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 flex items-center justify-center">
                        <Package size={20} className="text-white/40" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{product.name}</div>
                        <div className="text-white/40 text-xs">ID: {product.wordpress_id || product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm">${parseFloat(product.price || 0).toFixed(2)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${product.stock_quantity > 0 ? 'text-white' : 'text-red-500'}`}>
                      {product.stock_quantity || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-sm">{product.vendor?.store_name || 'Yacht Club'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Products List - Mobile */}
      <div className="lg:hidden">
        {loading ? (
          <div className="bg-[#1a1a1a] border-b border-white/5 p-12 text-center text-white/60">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-[#1a1a1a] border-b border-white/5 p-12 text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60">No products found</div>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#1a1a1a] border-b border-white/5 p-4 active:bg-white/5 transition-all"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Package size={28} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-base font-medium mb-2">{product.name}</div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(product.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-white font-medium">${parseFloat(product.price || 0).toFixed(2)}</span>
                    <span className={`${product.stock_quantity > 0 ? 'text-white/60' : 'text-red-500'}`}>
                      Stock: {product.stock_quantity || 0}
                    </span>
                  </div>
                  <div className="text-white/40 text-xs mt-1">
                    {product.vendor?.store_name || 'Yacht Club'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
