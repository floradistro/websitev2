"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Package, FileText, CheckCircle, AlertCircle, XCircle, Sparkles, Trash2, DollarSign } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';

interface Product {
  id: number;
  submissionId?: number;
  name: string;
  image: string;
  status: 'approved' | 'pending' | 'rejected';
  quantity: number;
  price: string;
  category: string;
  coaStatus?: 'approved' | 'pending' | 'missing' | 'expired';
  submittedDate?: string;
  rejectionReason?: string;
}

export default function VendorProducts() {
  const { isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function loadProducts() {
    // Wait for auth to complete
    if (authLoading || !isAuthenticated) {
      setLoading(false);
      return;
    }
      
      try {
        setLoading(true);
        
        // Get vendor ID from localStorage
        const vendorId = localStorage.getItem('vendor_id');
        if (!vendorId) {
          setLoading(false);
          return;
        }

        // Use bulk endpoint for faster loading
        const response = await axios.get('/api/page-data/vendor-products', {
          headers: {
            'x-vendor-id': vendorId
          }
        });
        
        if (response.data && response.data.products) {
          // Products are already formatted by bulk endpoint
          setProducts(response.data.products);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setLoading(false);
      }
    }

  useEffect(() => {
    loadProducts();
  }, [authLoading, isAuthenticated]);

  const getStatusBadge = (status: string) => {
    const config = {
      approved: {
        className: "border-green-500 text-green-500",
        icon: CheckCircle,
        text: "Approved"
      },
      pending: {
        className: "border-yellow-500 text-yellow-500",
        icon: AlertCircle,
        text: "Pending Review"
      },
      rejected: {
        className: "border-red-500 text-red-500",
        icon: XCircle,
        text: "Rejected"
      },
    };

    const { className, icon: Icon, text } = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`inline-flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 py-0.5 lg:py-1 text-[10px] lg:text-xs font-medium uppercase tracking-wider border ${className}`}>
        <Icon size={10} className="lg:w-3 lg:h-3" />
        <span className="hidden sm:inline">{text}</span>
        <span className="sm:hidden">{text.split(' ')[0]}</span>
      </span>
    );
  };

  const getCOABadge = (coaStatus?: string) => {
    if (!coaStatus) return null;

    const config = {
      approved: { icon: CheckCircle, text: 'COA', className: 'text-white/40', showText: true },
      pending: { icon: AlertCircle, text: 'COA', className: 'text-white/40', showText: true },
      missing: { icon: XCircle, text: 'No COA', className: 'text-red-500', showText: false },
      expired: { icon: AlertCircle, text: 'Expired', className: 'text-red-500', showText: true },
    };

    const { icon: Icon, text, className, showText } = config[coaStatus as keyof typeof config] || config.missing;

    return (
      <div className={`flex items-center gap-1 ${className}`} title={`COA Status: ${coaStatus}`}>
        <Icon size={12} className="lg:w-3.5 lg:h-3.5" />
        {showText && <span className="text-[10px] lg:text-xs">{text}</span>}
      </div>
    );
  };

  const filteredProducts = products.filter(product => {
    if (filter !== 'all' && product.status !== filter) return false;
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.submissionId?.toString() || p.id.toString())));
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    await showConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}" from your catalog? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const vendorId = localStorage.getItem('vendor_id');
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

  const handleAIAutofill = async () => {
    if (selectedIds.size === 0) return;
    
    // Dispatch event to open AI monitor
    window.dispatchEvent(new CustomEvent('ai-autofill-start', {
      detail: { productCount: selectedIds.size }
    }));

    try {
      const response = await fetch('/api/ai/autofill-strain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productIds: Array.from(selectedIds)
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start AI autofill');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message) {
                window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
                  detail: { message: data.message }
                }));
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      window.dispatchEvent(new CustomEvent('ai-autofill-complete'));
      setSelectedIds(new Set());
      
      // Reload products
      setTimeout(() => {
        loadProducts();
      }, 1000);
    } catch (error: any) {
      console.error('AI Autofill error:', error);
      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: { message: `\n\n❌ Error: ${error.message}` }
      }));
      window.dispatchEvent(new CustomEvent('ai-autofill-complete'));
    }
  };


  return (
    <div className="w-full px-4 lg:px-0">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Header */}
      <div className="mb-12 fade-in flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
            Product Catalog
          </h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'PRODUCT' : 'PRODUCTS'} · MANAGE INVENTORY
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/vendor/pricing"
            className="group flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 rounded-[14px] px-4 py-3 text-xs uppercase tracking-wider font-light whitespace-nowrap"
          >
            <DollarSign size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Pricing</span>
          </Link>
          <Link
            href="/vendor/products/new"
            className="group flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 rounded-[14px] px-4 py-3 text-xs uppercase tracking-wider font-light whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={1.5} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:static bg-black/98 backdrop-blur-xl lg:bg-white/[0.02] lg:backdrop-filter lg:backdrop-blur-[20px] border-t lg:border border-white/20 lg:border-white/5 lg:rounded-[20px] p-4 z-50 mb-0 lg:mb-8" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{selectedIds.size} selected</span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Clear
              </button>
            </div>
            <button
              onClick={handleAIAutofill}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 font-medium hover:from-purple-700 hover:to-blue-700 transition-all rounded-[14px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Autofill Strain Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="minimal-glass p-6 mb-8 fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="lg:w-[18px] lg:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm lg:text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] lg:min-h-0 rounded-[14px] ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border-white/20 border'
                  : 'bg-black/20 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border min-h-[44px] lg:min-h-0 rounded-[14px] ${
                filter === 'approved'
                  ? 'border-green-500 text-green-500 bg-green-500/10'
                  : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <CheckCircle size={12} className="lg:w-3.5 lg:h-3.5" />
              <span className="hidden sm:inline">Approved</span>
              <span className="sm:hidden">App.</span>
              <span className="hidden lg:inline">({products.filter(p => p.status === 'approved').length})</span>
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border min-h-[44px] lg:min-h-0 rounded-[14px] ${
                filter === 'pending'
                  ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                  : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <AlertCircle size={12} className="lg:w-3.5 lg:h-3.5" />
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">Pend.</span>
              <span className="hidden lg:inline">({products.filter(p => p.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border min-h-[44px] lg:min-h-0 rounded-[14px] ${
                filter === 'rejected'
                  ? 'border-red-500 text-red-500 bg-red-500/10'
                  : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <XCircle size={12} className="lg:w-3.5 lg:h-3.5" />
              <span className="hidden sm:inline">Rejected</span>
              <span className="sm:hidden">Rej.</span>
              <span className="hidden lg:inline">({products.filter(p => p.status === 'rejected').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="minimal-glass p-12 lg:p-16 text-center">
          <div className="text-white/40 text-xs">Loading products...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="minimal-glass p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-4">No products found</div>
            <Link
              href="/vendor/products/new"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 rounded-[14px] px-6 py-3 text-xs font-light uppercase tracking-[0.15em]"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              Add Your First Product
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile List View - Full Width */}
          <div className="lg:hidden">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="block hover:bg-white/[0.02] transition-all bg-black border-b border-white/5"
              >
                <Link
                  href={product.status === 'approved' ? `/vendor/inventory?expand=${product.id}` : '#'}
                  className="flex gap-4 p-4"
                >
                    <div className="w-20 h-20 bg-white/5 rounded-[16px] flex items-center justify-center flex-shrink-0">
                      <Package size={28} className="text-white/40" />
                    </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-base font-medium mb-2 leading-tight">{product.name}</div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/60">{product.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-base">{product.price}</span>
                        {product.status === 'approved' && (
                          <span className={`text-sm ${product.quantity > 0 ? 'text-white/60' : 'text-red-500'}`}>
                            {product.quantity > 0 ? `${product.quantity}g in stock` : '0'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(product.status)}
                      {product.status === 'approved' && getCOABadge(product.coaStatus)}
                    </div>
                    {product.status === 'pending' && (
                      <div className="text-xs text-yellow-500/80 mt-2">Awaiting admin approval</div>
                    )}
                    {product.status === 'rejected' && product.rejectionReason && (
                      <div className="text-xs text-red-500/80 mt-2 leading-relaxed">{product.rejectionReason}</div>
                    )}
                  </div>
                </Link>
                <div className="px-4 pb-4 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteProduct(product.id.toString(), product.name);
                    }}
                    className="flex items-center gap-2 text-red-500/60 hover:text-red-500 text-sm transition-colors px-3 py-2 border border-red-500/20 hover:border-red-500/40 rounded-[14px]"
                  >
                    <Trash2 size={14} />
                    <span className="uppercase tracking-wider text-xs">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block minimal-glass overflow-hidden fade-in" style={{ animationDelay: '0.2s' }}>
          <table className="w-full">
            <thead className="border-b border-white/5 bg-black/40">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded-[14px] border-white/20 bg-transparent"
                  />
                </th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Price</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Stock</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">COA</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((product) => {
                const productKey = product.submissionId?.toString() || product.id.toString();
                return (
                <tr key={product.id} className="hover:bg-white/[0.02] transition-all">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(productKey)}
                      onChange={() => toggleSelection(productKey)}
                      className="w-4 h-4 rounded-[14px] border-white/20 bg-transparent"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded-[12px] flex items-center justify-center">
                        <Package size={20} className="text-white/40" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{product.name}</div>
                        <div className="text-white/40 text-xs">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-sm">{product.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm">{product.price}</span>
                  </td>
                  <td className="p-4">
                    {product.status === 'approved' ? (
                      <span className={`text-sm ${product.quantity > 0 ? 'text-white' : 'text-red-500'}`}>
                        {product.quantity > 0 ? `${product.quantity}g` : '0'}
                      </span>
                    ) : (
                      <span className="text-white/40 text-sm">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {product.status === 'approved' ? getCOABadge(product.coaStatus) : (
                      <span className="text-white/40 text-sm">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(product.status)}
                      {product.status === 'rejected' && product.rejectionReason && (
                        <span className="text-xs text-red-500/80 max-w-xs truncate" title={product.rejectionReason}>
                          {product.rejectionReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.status === 'approved' ? (
                        <Link
                          href={`/vendor/inventory?expand=${product.id}`}
                          className="text-white/60 hover:text-white text-sm transition-colors"
                        >
                          Manage
                        </Link>
                      ) : product.status === 'pending' ? (
                        <span className="text-yellow-500/60 text-sm">In Review</span>
                      ) : (
                        <span className="text-red-500/60 text-sm">Rejected</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteProduct(product.id.toString(), product.name);
                        }}
                        className="text-red-500/60 hover:text-red-500 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

    </div>
  );
}


