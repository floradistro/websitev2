"use client";

import { useState } from 'react';
import { Settings, CheckCircle, XCircle, RefreshCw, Database, ChevronDown, Zap, Trash2 } from 'lucide-react';

interface DevToolsProps {
  onRefresh?: () => void;
}

export default function VendorDevTools({ onRefresh }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  async function approveAllPendingProducts() {
    if (!confirm('Approve ALL pending products? This is a dev tool only.')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // Use internal API instead
      const response = await fetch('/api/admin/pending-products');
      const data = await response.json();

      if (data.success && data.products && data.products.length > 0) {
        // Approve each product via internal API
        for (const product of data.products) {
          await fetch('/api/admin/approve-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id })
          });
        }

        setMessage(`✅ Approved ${data.products.length} products`);
        setTimeout(() => {
          if (onRefresh) onRefresh();
          setMessage('');
        }, 2000);
      } else {
        setMessage('ℹ️ No pending products found');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error: any) {
      console.error('Error approving products:', error);
      setMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function clearCache() {
    setLoading(true);
    setMessage('Clearing cache...');
    
    // Clear all browser cache
    localStorage.clear();
    sessionStorage.clear();
    
    // Reload page
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  async function syncVendorData() {
    setLoading(true);
    setMessage('Syncing vendor data...');
    
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setMessage('✅ Data refreshed');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('❌ Sync failed');
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {/* Message Toast */}
      {message && (
        <div className="absolute bottom-16 right-0 bg-black border border-white/20 px-4 py-3 mb-2 min-w-[200px] animate-fadeIn">
          <p className="text-white text-xs">{message}</p>
        </div>
      )}

      {/* Dev Tools Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black border border-white/20 hover:border-white/40 text-white p-3 transition-all duration-300 flex items-center gap-2 group"
          title="Dev Tools"
        >
          <Settings 
            size={18} 
            className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : 'group-hover:rotate-90'}`} 
          />
          <span className="text-xs uppercase tracking-wider">Dev Tools</span>
          <ChevronDown 
            size={14} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-72 bg-black border border-white/20 animate-fadeIn">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="text-white text-xs uppercase tracking-wider font-medium flex items-center gap-2">
                <Zap size={14} className="text-yellow-500" />
                Development Tools
              </h3>
              <p className="text-white/40 text-[10px] mt-1">Quick actions for testing workflows</p>
            </div>

            <div className="py-2">
              {/* Approve All Pending Products */}
              <button
                onClick={approveAllPendingProducts}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed border-b border-white/5"
              >
                <CheckCircle size={16} className="text-green-500 group-hover:scale-110 transition-transform" />
                <div className="text-left flex-1">
                  <div className="text-xs font-medium">Approve All Products</div>
                  <div className="text-[10px] text-white/40">Approve pending submissions</div>
                </div>
              </button>

              {/* Sync Data */}
              <button
                onClick={syncVendorData}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed border-b border-white/5"
              >
                <RefreshCw size={16} className="text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-left flex-1">
                  <div className="text-xs font-medium">Refresh Data</div>
                  <div className="text-[10px] text-white/40">Reload from API</div>
                </div>
              </button>

              {/* Clear Cache */}
              <button
                onClick={clearCache}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed border-b border-white/5"
              >
                <Trash2 size={16} className="text-orange-500 group-hover:scale-110 transition-transform" />
                <div className="text-left flex-1">
                  <div className="text-xs font-medium">Clear Cache</div>
                  <div className="text-[10px] text-white/40">Reset browser storage</div>
                </div>
              </button>

              {/* View Database */}
              <button
                onClick={() => {
                  window.open('/admin', '_blank');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all group"
              >
                <Database size={16} className="text-purple-500 group-hover:scale-110 transition-transform" />
                <div className="text-left flex-1">
                  <div className="text-xs font-medium">Admin Dashboard</div>
                  <div className="text-[10px] text-white/40">Open admin panel</div>
                </div>
              </button>
            </div>

            <div className="border-t border-white/10 px-4 py-2 bg-white/5">
              <p className="text-white/40 text-[9px] uppercase tracking-wider">
                ⚠️ Development Mode Only
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[199] flex items-center justify-center">
          <div className="bg-black border border-white/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span className="text-white text-sm">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
