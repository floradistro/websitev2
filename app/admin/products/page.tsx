"use client";

import { useState, useEffect } from 'react';
import { Search, Package, Eye, Edit2 } from 'lucide-react';
import Image from 'next/image';

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

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl text-white font-light tracking-tight mb-2">Products</h1>
        <p className="text-white/50 text-sm">{filteredProducts.length} in catalog</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/40 pl-9 pr-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              statusFilter === 'all' ? 'bg-white text-black' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              statusFilter === 'published' ? 'bg-white/10 text-white border border-white' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              statusFilter === 'draft' ? 'bg-white/10 text-white border border-white' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            Draft
          </button>
        </div>
      </div>

      {/* Products List - Edge to edge on mobile */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <Package size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm">No products found</div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10 -mx-4 lg:mx-0">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`px-4 py-4 hover:bg-white/5 transition-colors ${
                index !== filteredProducts.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden rounded">
                    {product.images?.[0] ? (
                      <Image 
                        src={product.images[0].src} 
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Package size={20} className="text-white/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium mb-1">{product.name}</div>
                    <div className="text-white/40 text-xs mb-2">{product.vendor?.store_name || 'Yacht Club'}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-white/60">${parseFloat(product.price || 0).toFixed(2)}</div>
                      <div className={`${product.stock_quantity > 0 ? 'text-white/60' : 'text-red-500'}`}>
                        Stock: {product.stock_quantity || 0}
                      </div>
                      <div className="flex-1"></div>
                      {product.status === 'published' ? (
                        <span className="px-2 py-1 text-xs text-white/60 border border-white/10 rounded">Active</span>
                      ) : (
                        <span className="px-2 py-1 text-xs text-white/40 border border-white/10 rounded">Draft</span>
                      )}
                      <a 
                        href={`/products/${product.slug || product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 transition-all rounded"
                      >
                        <Eye size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <Image 
                      src={product.images[0].src} 
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Package size={18} className="text-white/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{product.name}</div>
                  <div className="text-white/40 text-xs">{product.vendor?.store_name || 'Yacht Club'}</div>
                </div>
                <div className="text-white/60 text-xs">${parseFloat(product.price || 0).toFixed(2)}</div>
                <div className={`text-xs ${product.stock_quantity > 0 ? 'text-white/60' : 'text-red-500'}`}>
                  Stock: {product.stock_quantity || 0}
                </div>
                <div className="flex-shrink-0">
                  {product.status === 'published' ? (
                    <span className="px-2 py-1 text-xs text-white/60 border border-white/10">Active</span>
                  ) : (
                    <span className="px-2 py-1 text-xs text-white/40 border border-white/10">Draft</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`/products/${product.slug || product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Eye size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
