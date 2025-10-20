"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Package, Store, Calendar, DollarSign, Tag, X, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

interface PendingProduct {
  id: number;
  vendor_id: number;
  product_name: string;
  store_name: string;
  status: string;
  submitted_date: string;
  price?: string;
  category?: string;
  description?: string;
  product_type?: string;
  pricing_mode?: string;
  pricing_tiers?: any[];
  attributes?: any[];
  variants?: any[];
  thc_percentage?: string;
  cbd_percentage?: string;
  strain_type?: string;
  lineage?: string;
  terpenes?: string;
  effects?: string;
  image_urls?: string[];
  coa_url?: string;
}

export default function VendorApprovalPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  
  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const loadPendingProducts = useCallback(async (silent = false) => {
    // Prevent duplicate simultaneous requests
    if (loadingRef.current) {
      console.log('⏸️  Request already in progress, skipping...');
      return;
    }

    try {
      loadingRef.current = true;
      if (!silent) setLoading(true);
      setError('');
      
      // CACHE BUSTER: Add timestamp to prevent SiteGround caching
      const cacheBuster = `_t=${Date.now()}`;
      const url = `${baseUrl}/wp-json/flora-im/v1/vendor-dev/pending-products?${authParams}&${cacheBuster}`;
      
      const response = await axios.get(url, { 
        timeout: 10000
        // No headers needed - backend sends no-cache headers
      });
      
      if (Array.isArray(response.data)) {
        // Only update if data actually changed to prevent re-renders
        setPending(prevPending => {
          const newData = response.data;
          const hasChanged = JSON.stringify(prevPending) !== JSON.stringify(newData);
          return hasChanged ? newData : prevPending;
        });
      } else {
        console.error('Invalid response format:', response.data);
        setPending([]);
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error loading pending products:', err);
      setError(err.message || 'Failed to load pending products');
      setPending([]);
    } finally {
      loadingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  // Setup polling when panel is open
  useEffect(() => {
    if (isOpen) {
      // Load immediately when opened
      loadPendingProducts(false);
      
      // Poll every 15 seconds (not 10 to reduce load)
      pollingIntervalRef.current = setInterval(() => {
        loadPendingProducts(true); // Silent refresh
      }, 15000);
    } else {
      // Clear polling when closed
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOpen, loadPendingProducts]);

  const approveProduct = async (submissionId: number) => {
    if (processing.has(submissionId)) return;

    try {
      setProcessing(prev => new Set(prev).add(submissionId));
      
      // CACHE BUSTER
      const cacheBuster = `_t=${Date.now()}`;
      const response = await axios.post(
        `${baseUrl}/wp-json/flora-im/v1/vendor-dev/approve-product?${authParams}&${cacheBuster}`,
        { submission_id: submissionId },
        { 
          timeout: 30000
          // No headers needed - backend sends no-cache headers
        }
      );
      
      if (response.data.success) {
        // Remove from local state immediately for instant UI update
        setPending(prev => prev.filter(p => p.id !== submissionId));
        setSelected(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
        
        // Refresh immediately to get fresh data (no delay)
        setTimeout(() => {
          loadPendingProducts(true);
        }, 500);
      } else {
        throw new Error(response.data.message || 'Approval failed');
      }
    } catch (err: any) {
      console.error('Error approving product:', err);
      alert(`Failed to approve: ${err.response?.data?.message || err.message}`);
      
      // Refresh to get accurate state
      await loadPendingProducts(false);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const approveBulk = async () => {
    if (selected.size === 0) return;
    
    const selectedIds = Array.from(selected);
    
    try {
      // Process all approvals in parallel
      await Promise.all(selectedIds.map(id => approveProduct(id)));
      setSelected(new Set());
    } catch (err) {
      console.error('Bulk approve error:', err);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map(p => p.id)));
    }
  };

  const rejectProduct = async (submissionId: number) => {
    if (processing.has(submissionId)) return;

    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      setProcessing(prev => new Set(prev).add(submissionId));
      
      // CACHE BUSTER
      const cacheBuster = `_t=${Date.now()}`;
      const response = await axios.post(
        `${baseUrl}/wp-json/flora-im/v1/vendor-dev/reject-product?${authParams}&${cacheBuster}`,
        { 
          submission_id: submissionId, 
          reason: reason || 'No reason provided' 
        },
        { 
          timeout: 30000
          // No headers needed - backend sends no-cache headers
        }
      );
      
      if (response.data.success) {
        // Remove from local state immediately for instant UI update
        setPending(prev => prev.filter(p => p.id !== submissionId));
        
        // Refresh immediately (no delay)
        setTimeout(() => {
          loadPendingProducts(true);
        }, 500);
      } else {
        throw new Error(response.data.message || 'Rejection failed');
      }
    } catch (err: any) {
      console.error('Error rejecting product:', err);
      alert(`Failed to reject: ${err.response?.data?.message || err.message}`);
      
      // Refresh to get accurate state
      await loadPendingProducts(false);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-black border border-white/20 hover:border-white/40 text-white px-4 py-3 transition-all duration-300 flex items-center gap-2 group z-[200] shadow-2xl"
      >
        <Package size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-xs uppercase tracking-wider font-medium">Product Approvals</span>
        {pending.length > 0 && (
          <span className="bg-yellow-500 text-black px-2 py-0.5 text-[10px] font-bold rounded-full animate-pulse">
            {pending.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0a0a0a] border border-white/20 max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4 lg:p-6 bg-gradient-to-r from-white/5 to-transparent flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl lg:text-2xl text-white mb-1 tracking-tight font-medium">
              Product Approvals
            </h2>
            <p className="text-white/60 text-xs lg:text-sm">
              Review and approve vendor product submissions
            </p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {selected.size > 0 && (
              <button
                onClick={approveBulk}
                className="bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <CheckCircle size={14} />
                Approve {selected.size}
              </button>
            )}
            <button
              onClick={() => loadPendingProducts(false)}
              disabled={loading}
              className="p-2 lg:p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 lg:p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {pending.length > 0 && (
          <div className="border-b border-white/10 px-4 lg:px-6 py-3 bg-white/5 flex items-center justify-between flex-shrink-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size === pending.length && pending.length > 0}
                onChange={selectAll}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-white/60 text-sm">
                {selected.size === pending.length ? 'Deselect All' : 'Select All'} ({pending.length})
              </span>
            </label>
            <p className="text-white/40 text-xs">
              {selected.size > 0 ? `${selected.size} selected` : 'Select products to bulk approve'}
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-500 text-sm font-medium">{error}</p>
              <button 
                onClick={() => loadPendingProducts(false)}
                className="text-red-400 text-xs underline hover:text-red-300 mt-1"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0a0a0a]" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          {loading && pending.length === 0 ? (
            <div className="text-center py-20 text-white/60">
              <div className="inline-block w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-sm">Loading pending products...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4">
                <Package size={40} className="text-white/20" />
              </div>
              <p className="text-white/60 mb-2 text-lg">No pending products</p>
              <p className="text-white/40 text-sm">All caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Processing Overlay */}
                  {processing.has(product.id) && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-3">
                      <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <p className="text-white/80 text-sm">Processing...</p>
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="p-4 lg:p-6">
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
                          <h3 className="text-base lg:text-lg text-white font-medium leading-tight flex-1">
                            {product.product_name || 'Unnamed Product'}
                          </h3>
                          <div className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 flex-shrink-0">
                            <span className="text-yellow-500 text-[10px] uppercase tracking-wider font-bold">
                              Pending
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                            ID: {product.id}
                          </span>
                          {product.product_type && (
                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] uppercase tracking-wider">
                              {product.product_type}
                            </span>
                          )}
                          {product.pricing_mode && (
                            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] uppercase tracking-wider">
                              {product.pricing_mode} pricing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="space-y-2.5 mb-5">
                      {/* Vendor */}
                      <div className="flex items-center gap-2 text-sm">
                        <Store size={14} className="text-white/40 flex-shrink-0" />
                        <span className="text-white/60">Vendor:</span>
                        <span className="text-white truncate">{product.store_name}</span>
                      </div>

                      {/* Price */}
                      {product.price && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={14} className="text-white/40 flex-shrink-0" />
                          <span className="text-white/60">Price:</span>
                          <span className="text-white font-medium">${product.price}</span>
                        </div>
                      )}

                      {/* Category */}
                      {product.category && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag size={14} className="text-white/40 flex-shrink-0" />
                          <span className="text-white/60">Category:</span>
                          <span className="text-white capitalize">{product.category}</span>
                        </div>
                      )}

                      {/* Submitted Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-white/40 flex-shrink-0" />
                        <span className="text-white/60">Submitted:</span>
                        <span className="text-white text-xs">
                          {new Date(product.submitted_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <div className="mb-4 p-3 bg-white/5 border border-white/5">
                        <p className="text-white/60 text-xs leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    )}

                    {/* Product Details - Expand/Collapse */}
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                        className="w-full text-left text-xs text-white/60 hover:text-white transition-colors uppercase tracking-wider flex items-center justify-between py-2 border-y border-white/5"
                      >
                        <span>{expandedProduct === product.id ? '▼' : '▶'} Product Details</span>
                        <span className="text-white/40">Click to {expandedProduct === product.id ? 'hide' : 'view'}</span>
                      </button>
                      
                      {expandedProduct === product.id && (
                        <div className="mt-3 space-y-3 text-sm">
                          {/* Strain Details */}
                          {(product.thc_percentage || product.cbd_percentage || product.strain_type) && (
                            <div className="bg-white/5 border border-white/5 p-3">
                              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Cannabis Info</p>
                              <div className="grid grid-cols-2 gap-2">
                                {product.thc_percentage && (
                                  <div><span className="text-white/60">THC:</span> <span className="text-white font-medium">{product.thc_percentage}%</span></div>
                                )}
                                {product.cbd_percentage && (
                                  <div><span className="text-white/60">CBD:</span> <span className="text-white font-medium">{product.cbd_percentage}%</span></div>
                                )}
                                {product.strain_type && (
                                  <div className="col-span-2"><span className="text-white/60">Type:</span> <span className="text-white capitalize">{product.strain_type}</span></div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Lineage, Terpenes, Effects */}
                          {(product.lineage || product.terpenes || product.effects) && (
                            <div className="bg-white/5 border border-white/5 p-3 space-y-2">
                              {product.lineage && (
                                <div><span className="text-white/60 text-xs">Lineage:</span> <span className="text-white text-xs">{product.lineage}</span></div>
                              )}
                              {product.terpenes && (
                                <div><span className="text-white/60 text-xs">Terpenes:</span> <span className="text-white text-xs">{product.terpenes}</span></div>
                              )}
                              {product.effects && (
                                <div><span className="text-white/60 text-xs">Effects:</span> <span className="text-white text-xs">{product.effects}</span></div>
                              )}
                            </div>
                          )}

                          {/* Pricing Tiers */}
                          {product.pricing_tiers && product.pricing_tiers.length > 0 && (
                            <div className="bg-white/5 border border-white/5 p-3">
                              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Pricing Tiers</p>
                              <div className="space-y-1">
                                {product.pricing_tiers.map((tier: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-white/60">{tier.weight || `${tier.qty} units`}</span>
                                    <span className="text-white font-medium">${parseFloat(tier.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Variants */}
                          {product.variants && product.variants.length > 0 && (
                            <div className="bg-white/5 border border-white/5 p-3">
                              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Variants ({product.variants.length})</p>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {product.variants.map((variant: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-xs border-b border-white/5 pb-1 last:border-b-0">
                                    <span className="text-white/60">{variant.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-medium">${parseFloat(variant.price).toFixed(2)}</span>
                                      {variant.sku && <span className="text-white/40 text-[10px]">SKU: {variant.sku}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Images */}
                          {product.image_urls && product.image_urls.length > 0 && (
                            <div className="bg-white/5 border border-white/5 p-3">
                              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Images ({product.image_urls.length})</p>
                              <div className="grid grid-cols-4 gap-2">
                                {product.image_urls.map((url: string, idx: number) => (
                                  <div key={idx} className="aspect-square bg-white/5 rounded overflow-hidden">
                                    <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* COA */}
                          {product.coa_url && (
                            <div className="bg-white/5 border border-white/5 p-3">
                              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Certificate of Analysis</p>
                              <a href={product.coa_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 text-xs flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                View COA PDF
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 lg:gap-3 pt-4 border-t border-white/5">
                      <button
                        onClick={() => approveProduct(product.id)}
                        disabled={processing.has(product.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <CheckCircle size={16} />
                        <span className="text-xs uppercase tracking-wider">Approve</span>
                      </button>
                      <button
                        onClick={() => rejectProduct(product.id)}
                        disabled={processing.has(product.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <XCircle size={16} />
                        <span className="text-xs uppercase tracking-wider">Reject</span>
                      </button>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 bg-white/5 flex items-center justify-between">
          <p className="text-white/40 text-xs uppercase tracking-wider">
            ⚠️ Development Tools - Testing Only
          </p>
          <p className="text-white/60 text-xs">
            {pending.length} {pending.length === 1 ? 'product' : 'products'} pending
          </p>
        </div>
      </div>
    </div>
  );
}
