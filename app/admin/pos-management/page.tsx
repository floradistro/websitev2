"use client";

import { useState, useEffect } from 'react';
import { Store, Power, PowerOff, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url: string | null;
  email: string;
  status: string;
  pos_enabled: boolean;
}

export default function AdminPOSManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [updatingVendor, setUpdatingVendor] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    filterVendorsList();
  }, [searchQuery, filterStatus, vendors]);

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/admin/pos/vendors');
      const data = await response.json();
      
      if (data.success) {
        setVendors(data.vendors);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
      showNotification('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterVendorsList = () => {
    let filtered = vendors;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by POS status
    if (filterStatus === 'enabled') {
      filtered = filtered.filter(v => v.pos_enabled);
    } else if (filterStatus === 'disabled') {
      filtered = filtered.filter(v => !v.pos_enabled);
    }

    setFilteredVendors(filtered);
  };

  const togglePOS = async (vendorId: string, currentStatus: boolean) => {
    setUpdatingVendor(vendorId);
    
    try {
      const response = await fetch('/api/admin/pos/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          pos_enabled: !currentStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setVendors(prev => prev.map(v => 
          v.id === vendorId 
            ? { ...v, pos_enabled: !currentStatus }
            : v
        ));
        showNotification(data.message, 'success');
      } else {
        showNotification(data.error || 'Failed to update POS status', 'error');
      }
    } catch (error) {
      console.error('Error toggling POS:', error);
      showNotification('Failed to update POS status', 'error');
    } finally {
      setUpdatingVendor(null);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const stats = {
    total: vendors.length,
    enabled: vendors.filter(v => v.pos_enabled).length,
    disabled: vendors.filter(v => !v.pos_enabled).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3"></div>
            <div className="h-64 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white mb-3" style={{ fontWeight: 900 }}>
            POS Management
          </h1>
          <p className="text-white/60 leading-relaxed">
            Enable or disable Point of Sale access for vendors
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-2xl border ${
            notification.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          } flex items-center gap-3`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
              {notification.message}
            </span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <div className="text-white/40 text-xs uppercase tracking-[0.15em] mb-2">Total Vendors</div>
            <div className="text-4xl font-black text-white" style={{ fontWeight: 900 }}>{stats.total}</div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl p-6">
            <div className="text-white/40 text-xs uppercase tracking-[0.15em] mb-2">POS Enabled</div>
            <div className="text-4xl font-black text-green-400" style={{ fontWeight: 900 }}>{stats.enabled}</div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <div className="text-white/40 text-xs uppercase tracking-[0.15em] mb-2">POS Disabled</div>
            <div className="text-4xl font-black text-white/60" style={{ fontWeight: 900 }}>{stats.disabled}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-white/20 focus:outline-none transition-all"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-black'
                  : 'bg-[#0a0a0a] text-white/60 border border-white/10 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('enabled')}
              className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all ${
                filterStatus === 'enabled'
                  ? 'bg-green-500 text-black'
                  : 'bg-[#0a0a0a] text-white/60 border border-white/10 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              Enabled
            </button>
            <button
              onClick={() => setFilterStatus('disabled')}
              className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all ${
                filterStatus === 'disabled'
                  ? 'bg-white text-black'
                  : 'bg-[#0a0a0a] text-white/60 border border-white/10 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Vendors List */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/40 text-xs uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                    Vendor
                  </th>
                  <th className="text-left p-4 text-white/40 text-xs uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                    Email
                  </th>
                  <th className="text-left p-4 text-white/40 text-xs uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                    Status
                  </th>
                  <th className="text-left p-4 text-white/40 text-xs uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                    POS Access
                  </th>
                  <th className="text-right p-4 text-white/40 text-xs uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/40">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr 
                      key={vendor.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {vendor.logo_url ? (
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <Image
                                src={vendor.logo_url}
                                alt={vendor.store_name}
                                fill
                                className="object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 flex-shrink-0 bg-white/5 rounded-lg flex items-center justify-center">
                              <Store size={20} className="text-white/40" />
                            </div>
                          )}
                          <div>
                            <div className="text-white font-black text-sm" style={{ fontWeight: 900 }}>
                              {vendor.store_name}
                            </div>
                            <div className="text-white/40 text-xs">
                              /{vendor.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white/60 text-sm">
                          {vendor.email}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-[0.15em] ${
                          vendor.status === 'active'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`} style={{ fontWeight: 900 }}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {vendor.pos_enabled ? (
                            <>
                              <Power size={16} className="text-green-400" />
                              <span className="text-green-400 text-sm font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                                Enabled
                              </span>
                            </>
                          ) : (
                            <>
                              <PowerOff size={16} className="text-white/40" />
                              <span className="text-white/40 text-sm font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                                Disabled
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => togglePOS(vendor.id, vendor.pos_enabled)}
                            disabled={updatingVendor === vendor.id}
                            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              vendor.pos_enabled
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                            }`}
                            style={{ fontWeight: 900 }}
                          >
                            {updatingVendor === vendor.id ? 'Updating...' : vendor.pos_enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center text-white/40 text-xs uppercase tracking-[0.15em]">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </div>
      </div>
    </div>
  );
}



