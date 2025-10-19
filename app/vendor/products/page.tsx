"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Package, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { getVendorMyProductsProxy as getVendorMyProducts } from '@/lib/wordpress-vendor-proxy';
import { useVendorAuth } from '@/context/VendorAuthContext';

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

  useEffect(() => {
    async function loadProducts() {
      // Wait for auth to complete
      if (authLoading || !isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await getVendorMyProducts(1, 100);
        
        if (response && response.products) {
          const mappedProducts = response.products.map((p: any) => ({
            // Use submission id for pending/rejected, product_id for approved
            id: p.product_id > 0 ? p.product_id : p.id,
            submissionId: p.id, // Keep track of submission ID
            name: p.name || 'Unnamed Product',
            image: p.image || '/logoprint.png',
            status: p.status,
            quantity: p.stock ? parseFloat(p.stock) : 0,
            price: `$${parseFloat(p.price || 0).toFixed(2)}`,
            category: p.category || 'Product',
            coaStatus: p.coas && p.coas.length > 0 ? 'approved' : (p.status === 'pending' ? 'pending' : 'missing'),
            submittedDate: p.submitted_date,
            rejectionReason: p.rejection_reason
          }));
          setProducts(mappedProducts);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setLoading(false);
      }
    }
    
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
      approved: { icon: CheckCircle, text: 'COA', className: 'text-white/40' },
      pending: { icon: AlertCircle, text: 'COA', className: 'text-white/40' },
      missing: { icon: XCircle, text: 'No COA', className: 'text-red-500' },
      expired: { icon: AlertCircle, text: 'Expired', className: 'text-red-500' },
    };

    const { icon: Icon, text, className } = config[coaStatus as keyof typeof config] || config.missing;

    return (
      <div className={`flex items-center gap-1 ${className}`} title={`COA Status: ${coaStatus}`}>
        <Icon size={12} className="lg:w-3.5 lg:h-3.5" />
        <span className="text-[10px] lg:text-xs">{text}</span>
      </div>
    );
  };

  const filteredProducts = products.filter(product => {
    if (filter !== 'all' && product.status !== filter) return false;
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="lg:max-w-7xl lg:mx-auto animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            My Products
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <Link
          href="/vendor/products/new"
          className="group flex items-center gap-1.5 lg:gap-2 bg-black border border-white/20 text-white px-3 lg:px-6 py-3 lg:py-3 text-[10px] lg:text-xs font-medium uppercase tracking-[0.15em] lg:tracking-[0.2em] active:bg-white active:text-black lg:hover:bg-white lg:hover:text-black lg:hover:border-white transition-all duration-300 whitespace-nowrap min-h-[44px] lg:min-h-0"
        >
          <Plus size={16} className="lg:hidden flex-shrink-0" />
          <Plus size={18} className="hidden lg:block group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 lg:py-4 mb-0 lg:mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="lg:w-[18px] lg:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-sm lg:text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] lg:min-h-0 ${
                filter === 'all'
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1a1a1a] text-white/60 active:text-white lg:hover:text-white border border-white/5 active:border-white/10 lg:hover:border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border min-h-[44px] lg:min-h-0 ${
                filter === 'approved'
                  ? 'border-green-500 text-green-500'
                  : 'border-white/10 text-white/60 active:text-white active:border-white/20 lg:hover:text-white lg:hover:border-white/20'
              }`}
            >
              <CheckCircle size={12} className="lg:w-3.5 lg:h-3.5" />
              <span className="hidden sm:inline">Approved</span>
              <span className="sm:hidden">App.</span>
              <span className="hidden lg:inline">({products.filter(p => p.status === 'approved').length})</span>
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border min-h-[44px] lg:min-h-0 ${
                filter === 'pending'
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-white/10 text-white/60 active:text-white active:border-white/20 lg:hover:text-white lg:hover:border-white/20'
              }`}
            >
              <AlertCircle size={12} className="lg:w-3.5 lg:h-3.5" />
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">Pend.</span>
              <span className="hidden lg:inline">({products.filter(p => p.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border min-h-[44px] lg:min-h-0 ${
                filter === 'rejected'
                  ? 'border-red-500 text-red-500'
                  : 'border-white/10 text-white/60 active:text-white active:border-white/20 lg:hover:text-white lg:hover:border-white/20'
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

      {/* Products Table - Mobile: List View, Desktop: Table */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center text-white/60">Loading products...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-4">No products found</div>
            <Link
              href="/vendor/products/new"
              className="group inline-flex items-center gap-2 bg-black border border-white/20 text-white px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all duration-300"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              Add Your First Product
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div className="lg:hidden divide-y divide-white/5">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={product.status === 'approved' ? `/vendor/inventory?expand=${product.id}` : '#'}
                className="flex items-start gap-3 px-4 py-4 active:bg-white/5 transition-all bg-[#1a1a1a]"
              >
                <div className="w-14 h-14 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                  <Package size={22} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium mb-1.5 leading-tight">{product.name}</div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/40 mb-2">
                    <span>{product.category}</span>
                    <span>•</span>
                    <span className="text-white/60 font-medium">{product.price}</span>
                    {product.status === 'approved' && (
                      <>
                        <span>•</span>
                        <span className={product.quantity > 0 ? 'text-white/60' : 'text-red-500'}>
                          {product.quantity > 0 ? `${product.quantity}g` : 'Out of stock'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(product.status)}
                    {product.status === 'approved' && getCOABadge(product.coaStatus)}
                  </div>
                  {product.status === 'pending' && (
                    <div className="text-xs text-yellow-500/80 mt-2">Awaiting approval</div>
                  )}
                  {product.status === 'rejected' && product.rejectionReason && (
                    <div className="text-xs text-red-500/80 mt-2 line-clamp-2">{product.rejectionReason}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-[#1a1a1a] border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
              <tr>
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#303030] transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center">
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
                        {product.quantity > 0 ? `${product.quantity}g` : 'Out of stock'}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}

