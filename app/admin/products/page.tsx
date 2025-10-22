"use client";

import { useState, useEffect } from 'react';
import { Search, Package, Eye, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { showNotification, showConfirm } from '@/components/NotificationToast';
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

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch('/api/supabase/products?per_page=200');
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
        let successCount = 0;
        let errorCount = 0;
        const deletedIds = new Set<string>();

        // Mark all as deleting for visual feedback
        const selectedArray = Array.from(selected);
        selectedArray.forEach(id => {
          setDeleting(prev => new Set(prev).add(id));
        });

        for (const productId of selected) {
          const product = products.find(p => p.id === productId);
          if (!product) continue;

          try {
            const hasInventory = product.stock_quantity > 0;
            const url = hasInventory
              ? `/api/admin/products?product_id=${productId}&force=true`
              : `/api/admin/products?product_id=${productId}`;
            
            await axios.delete(url);
            successCount++;
            deletedIds.add(productId);
          } catch (error) {
            console.error('Failed to delete:', product.name, error);
            errorCount++;
          }
        }

        // Remove successfully deleted products from UI
        setTimeout(() => {
          setProducts(prev => prev.filter(p => !deletedIds.has(p.id)));
          setDeleting(new Set());
        }, 200);

        setBulkDeleting(false);
        setSelected(new Set());
        
        if (successCount > 0) {
          showNotification({
            type: 'success',
            title: 'Bulk Delete Complete',
            message: `${successCount} products deleted${errorCount > 0 ? `, ${errorCount} failed` : ''}`
          });
        } else {
          showNotification({
            type: 'error',
            title: 'Bulk Delete Failed',
            message: 'No products were deleted'
          });
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
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl text-white font-light tracking-tight mb-2">Products</h1>
          <p className="text-white/50 text-sm">
            {filteredProducts.length} in catalog
            {selected.size > 0 && ` • ${selected.size} selected`}
          </p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 size={14} />
            {bulkDeleting ? 'Deleting...' : `Delete ${selected.size}`}
          </button>
        )}
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
          {/* Select All Header */}
          {filteredProducts.length > 0 && (
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.size === filteredProducts.length && filteredProducts.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 bg-white/5 border border-white/20 rounded checked:bg-white checked:border-white cursor-pointer"
              />
              <span className="text-white/40 text-xs uppercase tracking-wider">
                Select All ({filteredProducts.length})
              </span>
            </div>
          )}
          
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`px-4 py-4 hover:bg-white/5 transition-all duration-200 ${
                index !== filteredProducts.length - 1 ? 'border-b border-white/5' : ''
              } ${selected.has(product.id) ? 'bg-white/5' : ''} ${
                deleting.has(product.id) ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/20 rounded checked:bg-white checked:border-white cursor-pointer flex-shrink-0"
                  />
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
                        title="View product"
                      >
                        <Eye size={16} />
                      </a>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name, product.stock_quantity > 0)}
                        disabled={deleting.has(product.id)}
                        className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        title="Delete product"
                      >
                        <Trash2 size={16} />
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
                  className="w-4 h-4 bg-white/5 border border-white/20 rounded checked:bg-white checked:border-white cursor-pointer flex-shrink-0"
                />
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
                    title="View product"
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name, product.stock_quantity > 0)}
                    disabled={deleting.has(product.id)}
                    className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete product"
                  >
                    <Trash2 size={14} />
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
