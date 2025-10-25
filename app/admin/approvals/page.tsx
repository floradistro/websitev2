"use client";

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Package, RefreshCw, AlertTriangle, Eye } from 'lucide-react';
import axios from 'axios';
import { showNotification } from '@/components/NotificationToast';
import { TableSkeleton } from '@/components/AdminSkeleton';

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
      console.error('❌ Error loading pending products:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load');
      setPending([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      }
  }

  async function approveProduct(submissionId: string): Promise<void> {
    if (processing.has(submissionId)) return Promise.resolve();

    setProcessing(prev => new Set(prev).add(submissionId));
    
    try {
      const response = await axios.post(
        `/api/admin/approve-product`,
        { submission_id: submissionId, action: 'approve' },
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        setPending(prev => prev.filter(p => p.id !== submissionId));
        setSelected(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
        return Promise.resolve();
      }
      return Promise.reject(new Error('Approval failed'));
    } catch (err: any) {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
      return Promise.reject(err);
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

  async function approveBulk() {
    if (selected.size === 0) return;
    const selectedIds = Array.from(selected);
    
    try {
      // Process in parallel for speed
      const results = await Promise.allSettled(
        selectedIds.map(id => approveProduct(id))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      setSelected(new Set());
      
      showNotification({
        type: successful > 0 ? 'success' : 'error',
        title: 'Bulk Approval Complete',
        message: `${successful} approved${failed > 0 ? `, ${failed} failed` : ''}`
      });
    } catch (error: any) {
      console.error('Bulk approve error:', error);
      showNotification({
        type: 'error',
        title: 'Bulk Approval Failed',
        message: error.message || 'Failed to approve products'
      });
    }
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
      <div className="flex justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">Review</h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            {loading ? 'LOADING...' : `${pending.length} PENDING APPROVAL`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={approveBulk}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-white/90 transition-all duration-300"
            >
              <CheckCircle size={14} strokeWidth={1.5} />
              Approve {selected.size}
            </button>
          )}
          <button
            onClick={() => loadPendingProducts()}
            disabled={loading}
            className="p-2.5 text-white/60 hover:text-white hover:bg-white/[0.03] transition-all duration-300 disabled:opacity-30 border border-white/10 hover:border-white/20"
          >
            <RefreshCw size={16} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
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

      {/* Debug Info - Remove after testing */}
      <div className="mb-4 bg-white/5 border border-white/10 p-3 text-xs font-mono">
        <div className="text-white/60">Loading: {loading ? 'true' : 'false'}</div>
        <div className="text-white/60">Pending count: {pending.length}</div>
        <div className="text-white/60">Error: {error || 'none'}</div>
      </div>

      {/* Products List */}
      {loading && pending.length === 0 ? (
        <TableSkeleton rows={6} />
      ) : pending.length === 0 ? (
        <div className="minimal-glass subtle-glow p-12 text-center -mx-4 lg:mx-0">
          <Package size={32} className="text-white/10 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-white/30 text-xs font-light tracking-wider uppercase mb-1">No Pending Products</p>
          <p className="text-white/20 text-xs font-light">All caught up!</p>
        </div>
      ) : (
        <div className="minimal-glass subtle-glow -mx-4 lg:mx-0">
          {pending.map((product, index) => (
            <div
              key={product.id}
              className={`relative px-4 lg:px-6 py-4 hover:bg-white/[0.02] transition-all duration-300 ${
                index !== pending.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* Processing Overlay */}
              {processing.has(product.id) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="text-white/80 text-sm">Processing...</div>
                </div>
              )}

              {/* Mobile Layout */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="mt-1 flex-shrink-0"
                  />
                  
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden rounded-[14px]">
                    {product.featured_image ? (
                      <img src={product.featured_image} alt={product.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={16} className="text-white/30" strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm font-light mb-1">{product.product_name}</div>
                    <div className="text-white/30 text-xs font-light mb-2">{product.store_name}</div>
                    <div className="flex items-center gap-2 text-xs font-light flex-wrap">
                      <span className="text-white/50 px-2 py-0.5 bg-white/5">${product.price || '0.00'}</span>
                      <span className="text-white/40 px-2 py-0.5 bg-white/5">{product.category || '—'}</span>
                      {product.is_update && (
                        <span className="px-2 py-0.5 text-[10px] text-white/30 border border-white/10 tracking-wider uppercase">Update</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                    className="flex-1 px-4 py-2 bg-black/20 hover:bg-white/[0.03] text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[10px] tracking-wider uppercase font-light"
                  >
                    {expandedProduct === product.id ? 'Hide' : 'Details'}
                  </button>
                  <button
                    onClick={() => approveProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="flex-1 px-4 py-2 bg-white text-black hover:bg-white/90 transition-all duration-300 text-[10px] tracking-wider uppercase disabled:opacity-30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectProduct(product.id)}
                    disabled={processing.has(product.id)}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[10px] tracking-wider uppercase font-light disabled:opacity-30"
                  >
                    Reject
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
