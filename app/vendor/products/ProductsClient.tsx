"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Package, Eye, DollarSign, FileText, Trash2
} from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { ProductQuickView } from '@/components/vendor/ProductQuickView';
import axios from 'axios';

// Types
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost_price?: number;
  description?: string;
  status: 'approved' | 'pending' | 'rejected';
  total_stock: number;
  custom_fields: any[];
  pricing_tiers: any[];
  images: string[];
}

export default function ProductsClient() {
  const { isAuthenticated, vendor } = useAppAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Load products
  const loadProducts = async () => {
    try {
      const vendorId = vendor?.id;
      if (!vendorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await axios.get('/api/vendor/products/full', {
        headers: { 'x-vendor-id': vendorId },
        timeout: 30000
      });

      if (response.data.success) {
        setProducts(response.data.products || []);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Products load error:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.response?.data?.error || 'Failed to load products'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let items = [...products];

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(s) ||
        (p.sku && p.sku.toLowerCase().includes(s))
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter(p => p.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      items = items.filter(p => p.category === categoryFilter);
    }

    return items;
  }, [products, search, statusFilter, categoryFilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const approved = products.filter(p => p.status === 'approved').length;
    const pending = products.filter(p => p.status === 'pending').length;
    const rejected = products.filter(p => p.status === 'rejected').length;

    return { total, approved, pending, rejected };
  }, [products]);


  // Delete product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    await showConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"? This will remove it from all locations.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const vendorId = vendor?.id;
          const response = await axios.delete(`/api/vendor/products?product_id=${productId}`, {
            headers: { 'x-vendor-id': vendorId }
          });

          if (response.data.success) {
            showNotification({
              type: 'success',
              title: 'Deleted',
              message: 'Product deleted successfully'
            });
            loadProducts();
          }
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete product'
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="w-full px-4 lg:px-0 py-12">
        <div className="minimal-glass p-12 text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm uppercase tracking-wider">Loading Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          vendorId={vendor?.id || ''}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onSave={() => {
            loadProducts();
            setQuickViewProduct(null);
          }}
          onDelete={() => {
            loadProducts();
            setQuickViewProduct(null);
          }}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
              Product Catalog
            </h1>
            <p className="text-white/40 text-xs font-light tracking-wide uppercase">
              {filteredProducts.length} of {products.length} Products · Full Builder
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/vendor/pricing"
              className="px-6 py-3 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-[14px] text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <DollarSign size={14} />
              Pricing
            </Link>
            <Link
              href="/vendor/products/new"
              className="px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-[14px] text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Plus size={14} />
              Add Product
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Total</div>
            <div className="text-3xl font-thin text-white">{stats.total}</div>
          </div>
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Approved</div>
            <div className="text-3xl font-thin text-white">{stats.approved}</div>
          </div>
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Pending</div>
            <div className="text-3xl font-thin text-white/70">{stats.pending}</div>
          </div>
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Rejected</div>
            <div className="text-3xl font-thin text-white/50">{stats.rejected}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="minimal-glass p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="minimal-glass p-16 text-center">
          <Package size={64} className="text-white/20 mx-auto mb-6" />
          <p className="text-white/60 text-lg mb-2">No products found</p>
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all rounded-[14px] text-sm uppercase tracking-wider mt-4"
          >
            <Plus size={16} />
            Add Your First Product
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedProducts.map((product) => {
            const margin = product.cost_price
              ? ((product.price - product.cost_price) / product.price * 100).toFixed(1)
              : null;

            const stockStatus = product.total_stock === 0 ? 'OUT' :
                               product.total_stock <= 10 ? 'LOW' : 'OK';

            const stockColor = stockStatus === 'OUT' ? 'border-red-500/30 text-red-500' :
                              stockStatus === 'LOW' ? 'border-yellow-500/30 text-yellow-500' :
                              'border-green-500/30 text-green-500';

            return (
              <div key={product.id} className="minimal-glass overflow-hidden hover:bg-white/[0.03] transition-all group">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg mb-2 group-hover:text-white/90 transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 text-[10px] uppercase tracking-wider border rounded-[8px] ${stockColor}`}>
                          {stockStatus}
                        </span>
                        <span className="px-2 py-1 text-[10px] uppercase tracking-wider border border-white/20 text-white/60 rounded-[8px]">
                          {product.status}
                        </span>
                        {margin && (
                          <span className="px-2 py-1 text-[10px] uppercase tracking-wider border border-white/20 text-white/60 rounded-[8px]">
                            {margin}% margin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Price</div>
                      <div className="text-white text-xl font-light">${product.price.toFixed(2)}/g</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Stock</div>
                      <div className="text-white text-xl font-light">{product.total_stock.toFixed(2)}g</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Category</div>
                      <div className="text-white text-sm">{product.category}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">SKU</div>
                      <div className="text-white text-sm">{product.sku || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all rounded-[14px] text-xs uppercase tracking-wider flex items-center justify-center gap-2 font-medium"
                    >
                      <Eye size={14} />
                      Quick View
                    </button>
                    <Link
                      href={`/vendor/inventory?product=${product.id}`}
                      className="px-4 py-3 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all rounded-[14px] text-xs uppercase tracking-wider"
                    >
                      Stock
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="minimal-glass p-4 mt-6 flex items-center justify-between">
              <div className="text-white/60 text-sm">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-[10px] text-sm transition-all ${
                          page === pageNum
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-white/40 px-2">...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`w-10 h-10 rounded-[10px] text-sm transition-all ${
                          page === totalPages
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

