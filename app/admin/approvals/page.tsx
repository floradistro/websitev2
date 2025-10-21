"use client";

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Package, Store, Calendar, DollarSign, Tag, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';

interface PendingProduct {
  id: string;
  vendor_id: string;
  product_name: string;
  store_name: string;
  status: string;
  submitted_date: string;
  updated_date?: string;
  is_update?: boolean;
  
  // Pricing
  price?: string;
  sale_price?: string;
  sku?: string;
  
  // Details
  category?: string;
  description?: string;
  short_description?: string;
  product_type?: string;
  
  // Cannabis
  pricing_mode?: string;
  thc_percentage?: string;
  cbd_percentage?: string;
  strain_type?: string;
  lineage?: string;
  terpenes?: string;
  effects?: string;
  
  // Media
  featured_image?: string;
  image_urls?: string[];
  coa_url?: string;
  
  // Stock
  stock_quantity?: number;
  stock_status?: string;
  
  // IDs
  wordpress_id?: number;
  slug?: string;
}

export default function AdminApprovals() {
  const [pending, setPending] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  const loadingRef = useRef(false);

  useEffect(() => {
    loadPendingProducts();
  }, []);

  async function loadPendingProducts() {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError('');
      
      // Get pending products from Supabase
      const response = await axios.get('/api/admin/pending-products', { timeout: 10000 });
      
      if (response.data.success && Array.isArray(response.data.pending)) {
        setPending(response.data.pending);
      } else {
        setPending([]);
        setError('No pending products found');
      }
    } catch (err: any) {
      console.error('Error loading pending products:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load pending products');
      setPending([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function approveProduct(submissionId: string) {
    if (processing.has(submissionId)) return;

    try {
      setProcessing(prev => new Set(prev).add(submissionId));
      
      // Use new admin approval API that handles both systems
      const response = await axios.post(
        `/api/admin/approve-product`,
        { submission_id: submissionId, action: 'approve' },
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Product Approved',
          message: 'Product has been published and is now live',
        });
        setPending(prev => prev.filter(p => p.id !== submissionId));
        setSelected(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
        
        setTimeout(() => loadPendingProducts(), 500);
      } else {
        throw new Error(response.data.message || 'Approval failed');
      }
    } catch (err: any) {
      console.error('Error approving product:', err);
      showNotification({
        type: 'error',
        title: 'Approval Failed',
        message: err.response?.data?.message || err.message,
      });
      await loadPendingProducts();
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  }

  async function rejectProduct(submissionId: string) {
    if (processing.has(submissionId)) return;

    // TODO: Could make this a custom input dialog, but for now keep it simple
    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return;

    try {
      setProcessing(prev => new Set(prev).add(submissionId));
      
      // Use new admin approval API
      const response = await axios.post(
        `/api/admin/approve-product`,
        { 
          submission_id: submissionId,
          action: 'reject',
          rejection_reason: reason || 'No reason provided'
        },
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Product Rejected',
          message: 'Product has been archived',
        });
        setPending(prev => prev.filter(p => p.id !== submissionId));
        setTimeout(() => loadPendingProducts(), 500);
      } else {
        throw new Error(response.data.message || 'Rejection failed');
      }
    } catch (err: any) {
      console.error('Error rejecting product:', err);
      showNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: err.response?.data?.message || err.message,
      });
      await loadPendingProducts();
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  }

  function approveBulk() {
    if (selected.size === 0) return;
    const selectedIds = Array.from(selected);
    Promise.all(selectedIds.map(id => approveProduct(id))).then(() => {
      setSelected(new Set());
    });
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function selectAll() {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map(p => p.id)));
    }
  }

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            Product Approvals
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            {pending.length} {pending.length === 1 ? 'product' : 'products'} pending review
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {selected.size > 0 && (
            <button
              onClick={approveBulk}
              className="bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <CheckCircle size={14} />
              <span className="hidden sm:inline">Approve {selected.size}</span>
              <span className="sm:hidden">{selected.size}</span>
            </button>
          )}
          <button
            onClick={() => loadPendingProducts()}
            disabled={loading}
            className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {pending.length > 0 && (
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:px-6 py-3 mb-0 lg:mb-6 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === pending.length && pending.length > 0}
              onChange={selectAll}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-white/60 text-xs lg:text-sm">
              {selected.size === pending.length ? 'Deselect All' : 'Select All'} ({pending.length})
            </span>
          </label>
          <p className="text-white/40 text-xs">
            {selected.size > 0 ? `${selected.size} selected` : 'Bulk approve'}
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 lg:border border-t border-b border-red-500/20 px-4 lg:p-4 py-4 mb-0 lg:mb-6 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-500 text-sm font-medium">{error}</p>
            <button 
              onClick={() => loadPendingProducts()}
              className="text-red-400 text-xs underline hover:text-red-300 mt-1"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-0 lg:space-y-6">
        {loading && pending.length === 0 ? (
          <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16 text-center">
            <div className="inline-block w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-white/60 text-sm">Loading pending products...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16 text-center">
            <Package size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-2 text-lg">No pending products</p>
            <p className="text-white/40 text-sm">All caught up! 🎉</p>
          </div>
        ) : (
          pending.map((product) => (
            <div
              key={product.id}
              className="bg-[#1a1a1a] lg:border border-t lg:border-t border-white/10 lg:hover:border-white/20 transition-all relative overflow-hidden group"
            >
              {/* Processing Overlay */}
              {processing.has(product.id) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-3">
                  <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <p className="text-white/80 text-sm">Processing...</p>
                </div>
              )}

              <div className="px-4 lg:p-6 py-4 lg:py-6">
                {/* Header with Checkbox */}
                <div className="flex items-start gap-4 mb-4">
                  <label className="flex items-center cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </label>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg text-white font-medium leading-tight flex-1">
                        {product.product_name || 'Unnamed Product'}
                      </h3>
                      <div className="flex items-center gap-2">
                        {product.is_update && (
                          <div className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20">
                            <span className="text-yellow-500 text-[10px] uppercase tracking-wider font-bold">
                              Update
                            </span>
                          </div>
                        )}
                        <div className="px-2 py-1 bg-red-500/10 border border-red-500/20">
                          <span className="text-red-500 text-[10px] uppercase tracking-wider font-bold">
                            Pending
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                        #{product.wordpress_id || 'NEW'}
                      </span>
                      {product.sku && (
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                          SKU: {product.sku}
                        </span>
                      )}
                      {product.product_type && (
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] uppercase tracking-wider">
                          {product.product_type}
                        </span>
                      )}
                      {product.stock_quantity && product.stock_quantity > 0 && (
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] uppercase tracking-wider">
                          Stock: {product.stock_quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6 pb-6 border-b border-white/5">
                  <div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Vendor</div>
                    <div className="text-white text-sm">{product.store_name}</div>
                  </div>

                  <div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Price</div>
                    <div className="text-white text-sm font-medium">
                      ${product.price || '0.00'}
                      {product.sale_price && <span className="text-xs text-white/60 ml-2">(Sale: ${product.sale_price})</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Category</div>
                    <div className="text-white text-sm">{product.category || 'None'}</div>
                  </div>

                  <div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">
                      {product.is_update ? 'Updated' : 'Submitted'}
                    </div>
                    <div className="text-white text-xs">
                      {new Date(product.is_update ? product.updated_date! : product.submitted_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Update Notice */}
                {product.is_update && (
                  <div className="mb-6 pb-6 border-b border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-yellow-500" />
                      <div className="text-white text-xs font-medium uppercase tracking-wider">Resubmission</div>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">
                      Previously approved product with changes. Review carefully.
                    </p>
                    <div className="text-white/40 text-xs mt-2">
                      {new Date(product.updated_date!).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Featured Image */}
                {product.featured_image && (
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Featured Image</div>
                    <img 
                      src={product.featured_image} 
                      alt={product.product_name} 
                      className="w-full lg:max-w-md border border-white/10 cursor-pointer hover:border-white/30 transition-all"
                      onClick={() => window.open(product.featured_image, '_blank')}
                    />
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Description</div>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Cannabis Details */}
                {(product.thc_percentage || product.cbd_percentage || product.strain_type || product.lineage || product.terpenes || product.effects) && (
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Cannabis Information</div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                      {product.thc_percentage && (
                        <div>
                          <div className="text-white/50 text-xs mb-1">THC</div>
                          <div className="text-white font-medium">{product.thc_percentage}%</div>
                        </div>
                      )}
                      {product.cbd_percentage && (
                        <div>
                          <div className="text-white/50 text-xs mb-1">CBD</div>
                          <div className="text-white font-medium">{product.cbd_percentage}%</div>
                        </div>
                      )}
                      {product.strain_type && (
                        <div>
                          <div className="text-white/50 text-xs mb-1">Strain Type</div>
                          <div className="text-white capitalize">{product.strain_type}</div>
                        </div>
                      )}
                      {product.lineage && (
                        <div className="col-span-2">
                          <div className="text-white/50 text-xs mb-1">Lineage</div>
                          <div className="text-white text-sm">{product.lineage}</div>
                        </div>
                      )}
                      {product.terpenes && (
                        <div className="col-span-2 lg:col-span-3">
                          <div className="text-white/50 text-xs mb-1">Terpenes</div>
                          <div className="text-white text-sm">{product.terpenes}</div>
                        </div>
                      )}
                      {product.effects && (
                        <div className="col-span-2 lg:col-span-3">
                          <div className="text-white/50 text-xs mb-1">Effects</div>
                          <div className="text-white text-sm">{product.effects}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Gallery */}
                {product.image_urls && product.image_urls.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">
                      Product Images ({product.image_urls.length})
                      {product.is_update && <span className="text-yellow-500 ml-2">• UPDATED</span>}
                    </div>
                    <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
                      {product.image_urls.map((url: string, idx: number) => (
                        <div key={idx} className="aspect-square border border-white/10 overflow-hidden lg:hover:border-white/30 transition-all cursor-pointer active:opacity-70" onClick={() => window.open(url, '_blank')}>
                          <img src={url} alt={`${product.product_name} ${idx + 1}`} className="w-full h-full object-cover lg:hover:scale-105 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COA */}
                {product.coa_url && (
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Certificate of Analysis</div>
                    <a 
                      href={product.coa_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-white hover:text-white/70 text-sm flex items-center gap-2 underline transition-all"
                    >
                      View COA PDF →
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => approveProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-black active:bg-white/90 lg:hover:bg-white/90 px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white"
                  >
                    <CheckCircle size={14} className="lg:w-4 lg:h-4" />
                    <span className="text-[10px] lg:text-xs uppercase tracking-wider font-medium">Approve</span>
                  </button>
                  <button
                    onClick={() => rejectProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-transparent text-white/60 active:text-white lg:hover:text-white active:bg-white/5 lg:hover:bg-white/5 px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 active:border-white/40 lg:hover:border-white/40"
                  >
                    <XCircle size={14} className="lg:w-4 lg:h-4" />
                    <span className="text-[10px] lg:text-xs uppercase tracking-wider font-medium">Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
