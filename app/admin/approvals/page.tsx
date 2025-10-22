"use client";

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Package, RefreshCw, AlertTriangle, Eye } from 'lucide-react';
import axios from 'axios';
import { showNotification } from '@/components/NotificationToast';

interface PendingProduct {
  id: string;
  vendor_id: string;
  product_name: string;
  store_name: string;
  status: string;
  submitted_date: string;
  updated_date?: string;
  is_update?: boolean;
  price?: string;
  sale_price?: string;
  sku?: string;
  category?: string;
  description?: string;
  product_type?: string;
  thc_percentage?: string;
  cbd_percentage?: string;
  featured_image?: string;
  image_urls?: string[];
  stock_quantity?: number;
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
      
      const response = await axios.get('/api/admin/pending-products', { timeout: 10000 });
      
      if (response.data.success && Array.isArray(response.data.pending)) {
        setPending(response.data.pending);
      } else {
        setPending([]);
      }
    } catch (err: any) {
      console.error('Error loading pending products:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load');
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
      
      const response = await axios.post(
        `/api/admin/approve-product`,
        { submission_id: submissionId, action: 'approve' },
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Product Approved',
          message: 'Product is now live',
        });
        setPending(prev => prev.filter(p => p.id !== submissionId));
        setSelected(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
      }
    } catch (err: any) {
      showNotification({
        type: 'error',
        title: 'Approval Failed',
        message: err.response?.data?.message || err.message,
      });
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

    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return;

    try {
      setProcessing(prev => new Set(prev).add(submissionId));
      
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
      }
    } catch (err: any) {
      showNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: err.response?.data?.message || err.message,
      });
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

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl text-white font-light tracking-tight mb-2">Approvals</h1>
          <p className="text-white/50 text-sm">{pending.length} pending review</p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={approveBulk}
              className="flex items-center gap-2 bg-white text-black px-5 py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all"
            >
              <CheckCircle size={16} />
              Approve {selected.size}
            </button>
          )}
          <button
            onClick={() => loadPendingProducts()}
            disabled={loading}
            className="p-3 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-sm flex-1">{error}</p>
        </div>
      )}

      {/* Products List */}
      {loading && pending.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <Package size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60 text-sm mb-1">No pending products</p>
          <p className="text-white/40 text-xs">All caught up!</p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10 -mx-4 lg:mx-0">
          {pending.map((product, index) => (
            <div
              key={product.id}
              className={`relative ${index !== pending.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              {/* Processing Overlay */}
              {processing.has(product.id) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="text-white/80 text-sm">Processing...</div>
                </div>
              )}

              {/* Mobile Layout */}
              <div className="lg:hidden px-4 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <label className="flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </label>
                  
                  <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden rounded">
                    {product.featured_image ? (
                      <img src={product.featured_image} alt={product.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-white/30" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium mb-1">{product.product_name}</div>
                    <div className="text-white/40 text-xs mb-2">{product.store_name}</div>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-white/60 px-2 py-0.5 bg-white/5 rounded">${product.price || '0.00'}</span>
                      <span className="text-white/60 px-2 py-0.5 bg-white/5 rounded">{product.category || 'Uncategorized'}</span>
                      {product.is_update && (
                        <span className="px-2 py-0.5 text-white/40 border border-white/10 rounded">Update</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pl-[60px]">
                  <button
                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all rounded border border-white/10 text-xs"
                  >
                    {expandedProduct === product.id ? 'Hide' : 'View Details'}
                  </button>
                  <button
                    onClick={() => approveProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="flex-1 p-2.5 text-green-500 hover:text-green-400 hover:bg-green-500/10 transition-all rounded border border-green-500/20 text-xs disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="flex-1 p-2.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded border border-red-500/20 text-xs disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </label>
                
                <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  {product.featured_image ? (
                    <img src={product.featured_image} alt={product.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={18} className="text-white/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{product.product_name}</div>
                  <div className="text-white/40 text-xs">{product.store_name}</div>
                </div>

                <div className="text-white/60 text-xs">${product.price || '0.00'}</div>
                <div className="text-white/60 text-xs">{product.category || '—'}</div>
                
                {product.is_update && (
                  <span className="px-2 py-1 text-xs text-white/40 border border-white/10">Update</span>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => approveProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button
                    onClick={() => rejectProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedProduct === product.id && (
                <div className="px-4 py-4 bg-black border-t border-white/5">
                  {product.description && (
                    <div className="mb-4">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Description</div>
                      <p className="text-white/70 text-sm">{product.description}</p>
                    </div>
                  )}
                  {(product.thc_percentage || product.cbd_percentage) && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {product.thc_percentage && (
                        <div>
                          <div className="text-white/40 text-xs mb-1">THC</div>
                          <div className="text-white text-sm">{product.thc_percentage}%</div>
                        </div>
                      )}
                      {product.cbd_percentage && (
                        <div>
                          <div className="text-white/40 text-xs mb-1">CBD</div>
                          <div className="text-white text-sm">{product.cbd_percentage}%</div>
                        </div>
                      )}
                    </div>
                  )}
                  {product.image_urls && product.image_urls.length > 0 && (
                    <div>
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Images ({product.image_urls.length})</div>
                      <div className="grid grid-cols-6 gap-2">
                        {product.image_urls.map((url: string, idx: number) => (
                          <div key={idx} className="aspect-square border border-white/10 overflow-hidden cursor-pointer" onClick={() => window.open(url, '_blank')}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
