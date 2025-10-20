
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Package, Store, Calendar, DollarSign, Tag, RefreshCw, AlertTriangle } from 'lucide-react';
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

export default function AdminApprovals() {
  const [pending, setPending] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  
  const loadingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadPendingProducts = useCallback(async (silent = false) => {
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      if (!silent) setLoading(true);
      setError('');
      
      const cacheBuster = `_t=${Date.now()}`;
      const url = `${baseUrl}/wp-json/flora-im/v1/vendor-dev/pending-products?${authParams}&${cacheBuster}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (Array.isArray(response.data)) {
        setPending(prevPending => {
          const newData = response.data;
          const hasChanged = JSON.stringify(prevPending) !== JSON.stringify(newData);
          return hasChanged ? newData : prevPending;
        });
      } else {
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

  useEffect(() => {
    loadPendingProducts(false);
    
    pollingIntervalRef.current = setInterval(() => {
      loadPendingProducts(true);
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [loadPendingProducts]);

  const approveProduct = async (submissionId: number) => {
    if (processing.has(submissionId)) return;

    try {
      setProcessing(prev => new Set(prev).add(submissionId));
      
      const cacheBuster = `_t=${Date.now()}`;
      const response = await axios.post(
        `${baseUrl}/wp-json/flora-im/v1/vendor-dev/approve-product?${authParams}&${cacheBuster}`,
        { submission_id: submissionId },
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        setPending(prev => prev.filter(p => p.id !== submissionId));
        setSelected(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
        
        setTimeout(() => {
          loadPendingProducts(true);
        }, 500);
      } else {
        throw new Error(response.data.message || 'Approval failed');
      }
    } catch (err: any) {
      console.error('Error approving product:', err);
      alert(`Failed to approve: ${err.response?.data?.message || err.message}`);
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
    if (reason === null) return;

    try {
      setProcessing(prev => new Set(prev).add(submissionId));
      
      const cacheBuster = `_t=${Date.now()}`;
      const response = await axios.post(
        `${baseUrl}/wp-json/flora-im/v1/vendor-dev/reject-product?${authParams}&${cacheBuster}`,
        { 
          submission_id: submissionId, 
          reason: reason || 'No reason provided' 
        },
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        setPending(prev => prev.filter(p => p.id !== submissionId));
        
        setTimeout(() => {
          loadPendingProducts(true);
        }, 500);
      } else {
        throw new Error(response.data.message || 'Rejection failed');
      }
    } catch (err: any) {
      console.error('Error rejecting product:', err);
      alert(`Failed to reject: ${err.response?.data?.message || err.message}`);
      await loadPendingProducts(false);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            Product Approvals
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            {pending.length} {pending.length === 1 ? 'product' : 'products'} pending review
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={approveBulk}
              className="bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 lg:py-3 text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <CheckCircle size={14} />
              <span className="hidden sm:inline">Approve {selected.size}</span>
              <span className="sm:hidden">{selected.size}</span>
            </button>
          )}
          <button
            onClick={() => loadPendingProducts(false)}
            disabled={loading}
            className="p-2 lg:p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {pending.length > 0 && (
        <div className="border-b border-white/10 px-4 lg:px-0 py-3 bg-[#1a1a1a] lg:bg-white/5 flex items-center justify-between mb-0 lg:mb-6">
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
        <div className="bg-red-500/10 border border-red-500/20 p-4 mb-6 flex items-center gap-3">
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

      {/* Content */}
      <div className="space-y-0 lg:space-y-4">
        {loading && pending.length === 0 ? (
          <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16 text-center text-white/60">
            <div className="inline-block w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Loading pending products...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4">
              <Package size={40} className="text-white/20" />
            </div>
            <p className="text-white/60 mb-2 text-lg">No pending products</p>
            <p className="text-white/40 text-sm">All caught up! 🎉</p>
          </div>
        ) : (
          pending.map((product) => (
            <div
              key={product.id}
              className="bg-[#1a1a1a] lg:border border-t lg:border-t border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
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
                      <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 flex-shrink-0">
                        <span className="text-red-500 text-[10px] uppercase tracking-wider font-bold">
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
                  <div className="flex items-center gap-2 text-sm">
                    <Store size={14} className="text-white/40 flex-shrink-0" />
                    <span className="text-white/60">Vendor:</span>
                    <span className="text-white truncate">{product.store_name}</span>
                  </div>

                  {product.price && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={14} className="text-white/40 flex-shrink-0" />
                      <span className="text-white/60">Price:</span>
                      <span className="text-white font-medium">${product.price}</span>
                    </div>
                  )}

                  {product.category && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag size={14} className="text-white/40 flex-shrink-0" />
                      <span className="text-white/60">Category:</span>
                      <span className="text-white capitalize">{product.category}</span>
                    </div>
                  )}

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
          ))
        )}
      </div>
    </div>
  );
}

