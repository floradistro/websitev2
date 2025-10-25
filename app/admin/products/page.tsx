"use client";

import { useState, useEffect } from 'react';
import { Search, Package, Eye, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { TableSkeleton } from '@/components/AdminSkeleton';
import axios from 'axios';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function loadProducts() {
    try {
      setLoading(true);
      // Use admin API to get ALL products from ALL vendors
      const response = await fetch('/api/admin/products?limit=500&with_wholesale=true');
      const data = await response.json();
      setProducts(data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  }

  const toggleSelect = (productId: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredProducts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    const selectedProducts = filteredProducts.filter(p => selected.has(p.id));
    const withInventory = selectedProducts.filter(p => p.stock_quantity > 0);
    
    const message = withInventory.length > 0
      ? `Delete ${selected.size} products? ${withInventory.length} have inventory and will be force deleted.`
      : `Delete ${selected.size} selected products? This cannot be undone.`;

    showConfirm({
      title: 'Bulk Delete Products',
      message: message,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        setBulkDeleting(true);
        
        // Mark all as deleting for visual feedback
        const selectedArray = Array.from(selected);
        selectedArray.forEach(id => {
          setDeleting(prev => new Set(prev).add(id));
        });

        try {
          // Use bulk endpoint - single API call!
          const response = await axios.delete('/api/admin/products/bulk', {
            data: {
              product_ids: selectedArray,
              force: withInventory.length > 0
            }
          });

          const results = response.data.results;
          
          // Remove successfully deleted products from UI instantly
          const successfulIds = results.details
            .filter((r: any) => r.success)
            .map((r: any) => r.product_id);
          
          setProducts(prev => prev.filter(p => !successfulIds.includes(p.id)));
          setDeleting(new Set());
          setSelected(new Set());
          
          showNotification({
            type: results.successful > 0 ? 'success' : 'error',
            title: results.successful > 0 ? 'Bulk Delete Complete' : 'Bulk Delete Failed',
            message: `${results.successful} deleted${results.failed > 0 ? `, ${results.failed} failed` : ''}`
          });
        } catch (error: any) {
          console.error('Bulk delete error:', error);
          showNotification({
            type: 'error',
            title: 'Bulk Delete Failed',
            message: error.response?.data?.error || 'Failed to delete products'
          });
          setDeleting(new Set());
        } finally {
          setBulkDeleting(false);
        }
      }
    });
  };

  const handleDeleteProduct = async (productId: string, productName: string, hasInventory: boolean) => {
    const message = hasInventory 
      ? `"${productName}" has inventory. Force delete will remove all inventory records. Continue?`
      : `Delete "${productName}" from catalog? This cannot be undone.`;

    showConfirm({
      title: 'Delete Product',
      message: message,
      confirmText: hasInventory ? 'Force Delete' : 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        setDeleting(prev => new Set(prev).add(productId));
        
        try {
          const url = hasInventory 
            ? `/api/admin/products?product_id=${productId}&force=true`
            : `/api/admin/products?product_id=${productId}`;
          
          const response = await axios.delete(url);

          if (response.data.success) {
            // Remove from UI with animation
            setTimeout(() => {
              setProducts(prev => prev.filter(p => p.id !== productId));
              setSelected(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
              });
            }, 200);
            
            showNotification({
              type: 'success',
              title: 'Product Deleted',
              message: hasInventory 
                ? 'Product and all inventory records deleted'
                : 'Product deleted successfully'
            });
          }
        } catch (error: any) {
          if (error.response?.data?.has_inventory) {
            showConfirm({
              title: 'Product Has Inventory',
              message: error.response.data.error + '\n\nForce delete anyway?',
              confirmText: 'Force Delete',
              cancelText: 'Cancel',
              type: 'warning',
              onConfirm: async () => {
                handleDeleteProduct(productId, productName, true);
              }
            });
          } else {
            showNotification({
              type: 'error',
              title: 'Delete Failed',
              message: error.response?.data?.error || error.message || 'Failed to delete product'
            });
          }
        } finally {
          setDeleting(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }
      }
    });
  };

  return (
    <div className="w-full px-4 lg:px-0">
      <style jsx>{`
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
        /* Modern minimal checkbox */
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }
        input[type="checkbox"]:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
        }
        input[type="checkbox"]:checked {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid rgba(255, 255, 255, 0.9);
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">Catalog</h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            {loading ? 'LOADING...' : `${filteredProducts.length} ITEMS FROM ALL VENDORS`}
            {selected.size > 0 && ` · ${selected.size} SELECTED`}
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[11px] uppercase tracking-[0.2em] font-light disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              {bulkDeleting ? 'Deleting...' : `Delete ${selected.size}`}
            </button>
          )}
          <button
            onClick={async () => {
              if (confirm('Clean up orphaned products (products without valid vendors)?')) {
                try {
                  const res = await axios.delete('/api/admin/products/orphaned');
                  alert(`Deleted ${res.data.deleted} orphaned products`);
                  loadProducts();
                } catch (error: any) {
                  alert('Cleanup complete or no orphaned products found');
                }
              }
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[11px] uppercase tracking-[0.2em] font-light flex items-center gap-2"
          >
            <Trash2 size={14} strokeWidth={1.5} />
            Cleanup
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-9 pr-4 py-2.5 focus:outline-none focus:border-white/20 transition-all duration-300 text-xs font-light"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
              statusFilter === 'all' ? 'bg-white text-black' : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
              statusFilter === 'published' ? 'bg-white text-black' : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
              statusFilter === 'draft' ? 'bg-white text-black' : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            Draft
          </button>
        </div>
      </div>

      {/* Products List - Edge to edge on mobile */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : filteredProducts.length === 0 ? (
        <div className="minimal-glass subtle-glow p-12 text-center -mx-4 lg:mx-0">
          <Package size={32} className="text-white/10 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-white/30 text-xs font-light tracking-wider uppercase">No Products Found</div>
        </div>
      ) : (
        <div className="minimal-glass subtle-glow -mx-4 lg:mx-0">
          {/* Select All Header */}
          {filteredProducts.length > 0 && (
            <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.size === filteredProducts.length && filteredProducts.length > 0}
                onChange={toggleSelectAll}
              />
              <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-light">
                Select All ({filteredProducts.length})
              </span>
            </div>
          )}
          
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`px-4 lg:px-6 py-4 hover:bg-white/[0.02] transition-all duration-300 ${
                index !== filteredProducts.length - 1 ? 'border-b border-white/5' : ''
              } ${selected.has(product.id) ? 'bg-white/[0.03]' : ''} ${
                deleting.has(product.id) ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden rounded-[14px]">
                    {product.vendor?.logo_url ? (
                      <img 
                        src={product.vendor.logo_url} 
                        alt={product.vendor.store_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={16} className="text-white/30" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm font-light mb-1 truncate">{product.name}</div>
                    <div className="text-white/30 text-xs font-light mb-2">
                      {product.vendor?.store_name || 'No Vendor'}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-light">
                      <div className="text-white/50">${parseFloat(product.price || 0).toFixed(2)}</div>
                      <div className={`${product.stock_quantity > 0 ? 'text-white/40' : 'text-white/30'}`}>
                        {product.stock_quantity || 0} in stock
                      </div>
                      <div className="flex-1"></div>
                      {product.status === 'published' ? (
                        <span className="px-2 py-0.5 text-[10px] text-white/40 border border-white/10 tracking-wider uppercase">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] text-white/30 border border-white/10 tracking-wider uppercase">Draft</span>
                      )}
                      <a 
                        href={`/products/${product.slug || product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
                        title="View product"
                      >
                        <Eye size={14} strokeWidth={1.5} />
                      </a>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name, product.stock_quantity > 0)}
                        disabled={deleting.has(product.id)}
                        className="p-2 text-white/20 hover:text-white/30 hover:bg-white/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete product"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selected.has(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  className="flex-shrink-0"
                />
                <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden rounded-[14px]">
                  {product.vendor?.logo_url ? (
                    <img 
                      src={product.vendor.logo_url} 
                      alt={product.vendor.store_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={14} className="text-white/30" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-white/90 text-sm font-light truncate mb-1">{product.name}</div>
                  <div className="text-white/30 text-xs font-light">
                    {product.vendor?.store_name || 'No Vendor'}
                  </div>
                </div>
                <div className="text-white/50 text-xs font-light w-24 text-right">${parseFloat(product.price || 0).toFixed(2)}</div>
                <div className={`text-xs font-light w-24 text-right ${product.stock_quantity > 0 ? 'text-white/40' : 'text-white/30'}`}>
                  {product.stock_quantity || 0}
                </div>
                <div className="flex-shrink-0 w-20">
                  {product.status === 'published' ? (
                    <span className="inline-block px-2 py-0.5 text-[10px] text-white/40 border border-white/10 tracking-wider uppercase">Active</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-[10px] text-white/30 border border-white/10 tracking-wider uppercase">Draft</span>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <a 
                    href={`/products/${product.slug || product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
                    title="View product"
                  >
                    <Eye size={14} strokeWidth={1.5} />
                  </a>
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name, product.stock_quantity > 0)}
                    disabled={deleting.has(product.id)}
                    className="p-2 text-white/20 hover:text-white/30 hover:bg-white/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Delete product"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
