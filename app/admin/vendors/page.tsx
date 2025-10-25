"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { Store, Plus, Search, CheckCircle, XCircle, AlertCircle, Edit2, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { TableSkeleton } from '@/components/AdminSkeleton';
import AdminModal from '@/components/AdminModal';

interface Vendor {
  id: string | number;
  store_name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  created_date: string;
  total_products: number;
  total_sales: number;
  logo_url?: string;
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    store_name: '',
    email: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      // Don't set loading if we already have vendors (refresh)
      if (vendors.length === 0) {
        setLoading(true);
      }
      const response = await axios.get('/api/admin/vendors');
      if (response.data.success && Array.isArray(response.data.vendors)) {
        const vendorsList: Vendor[] = response.data.vendors.map((vendor: any) => ({
          id: vendor.id,
          store_name: vendor.store_name,
          email: vendor.email,
          status: vendor.status as 'active' | 'pending' | 'suspended',
          created_date: vendor.created_date,
          total_products: vendor.total_products || 0,
          total_sales: vendor.total_sales || 0,
        }));
        setVendors(vendorsList);
      } else {
        setVendors([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
      setLoading(false);
    }
  }

  async function createVendor() {
    if (!newVendor.store_name || !newVendor.email || !newVendor.username || !newVendor.password) {
      showNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill in all required fields',
      });
      return;
    }

    try {
      const response = await axios.post(`/api/admin/create-vendor-supabase`, newVendor);

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Vendor Created',
          message: `${response.data.vendor.store_name} has been created successfully`,
        });
        setShowAddModal(false);
        setNewVendor({ store_name: '', email: '', username: '', password: '' });
        setTimeout(() => loadVendors(), 1000);
      } else {
        showNotification({
          type: 'error',
          title: 'Creation Failed',
          message: response.data.message || 'Failed to create vendor',
        });
      }
    } catch (error: any) {
      console.error('Vendor creation error:', error);
      showNotification({
        type: 'error',
        title: 'Error Creating Vendor',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      });
    }
  }

  async function suspendVendor(vendorId: string | number) {
    const confirmed = await showConfirm({
      title: 'Suspend Vendor',
      message: 'Are you sure you want to suspend this vendor?',
      confirmText: 'Suspend',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: () => {},
    });
    if (!confirmed) return;

    try {
      const response = await axios.post('/api/admin/vendors', {
        action: 'suspend',
        vendor_id: vendorId
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Vendor Suspended',
          message: 'Vendor has been suspended successfully',
        });
        loadVendors();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Suspension Error',
        message: error.response?.data?.message || error.message,
      });
    }
  }

  async function activateVendor(vendorId: string | number) {
    try {
      const response = await axios.post('/api/admin/vendors', {
        action: 'activate',
        vendor_id: vendorId
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Vendor Activated',
          message: 'Vendor has been activated successfully',
        });
        loadVendors();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Activation Error',
        message: error.response?.data?.message || error.message,
      });
    }
  }

  async function deleteVendor(vendorId: string | number) {
    const confirmed = await showConfirm({
      title: 'Delete Vendor',
      message: 'This will permanently delete the vendor. This action CANNOT be undone.',
      confirmText: 'Delete Forever',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {},
    });
    if (!confirmed) return;

    try {
      const response = await axios.post('/api/admin/vendors', {
        action: 'delete',
        vendor_id: vendorId
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Vendor Deleted',
          message: 'Vendor has been removed from all systems',
        });
        loadVendors();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Deletion Error',
        message: error.response?.data?.message || error.message,
      });
    }
  }

  const filteredVendors = vendors.filter(vendor => {
    if (filter !== 'all' && vendor.status !== filter) return false;
    if (search && !vendor.store_name.toLowerCase().includes(search.toLowerCase()) && !vendor.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
      <div className="flex justify-between items-start gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-thin text-white/90 tracking-tight mb-2">Partners</h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            {loading ? 'LOADING...' : `${filteredVendors.length} REGISTERED`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 lg:px-5 lg:py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Partner</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-9 pr-4 py-2.5 focus:outline-none focus:border-white/20 transition-all duration-300 text-xs font-light"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
              filter === 'all' ? 'bg-white text-black' : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
              filter === 'active' ? 'bg-white text-black' : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('suspended')}
            className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 ${
              filter === 'suspended' ? 'bg-white text-black' : 'bg-black/20 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* Partners List - Edge to edge on mobile */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredVendors.length === 0 ? (
        <div className="minimal-glass subtle-glow p-12 text-center -mx-4 lg:mx-0">
          <Store size={32} className="text-white/10 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-white/30 text-xs font-light tracking-wider uppercase">No Partners Found</div>
        </div>
      ) : (
        <div className="minimal-glass subtle-glow -mx-4 lg:mx-0">
          {filteredVendors.map((vendor, index) => (
            <div
              key={vendor.id}
              className={`px-4 lg:px-6 py-4 hover:bg-white/[0.02] transition-all duration-300 ${
                index !== filteredVendors.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 rounded-[14px] overflow-hidden relative">
                    {vendor.logo_url ? (
                      <img 
                        src={vendor.logo_url} 
                        alt={vendor.store_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store size={16} className="text-white/30" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm font-light mb-1 truncate">{vendor.store_name}</div>
                    <div className="text-white/30 text-xs font-light truncate">{vendor.email}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {vendor.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-white/40 border border-white/10 tracking-wider uppercase">
                        <CheckCircle size={8} strokeWidth={2} />
                        <span className="hidden sm:inline">Active</span>
                      </span>
                    ) : vendor.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-white/30 border border-white/10 tracking-wider uppercase">
                        <AlertCircle size={8} strokeWidth={2} />
                        <span className="hidden sm:inline">Pending</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-white/30 border border-white/10 tracking-wider uppercase">
                        <XCircle size={8} strokeWidth={2} />
                        <span className="hidden sm:inline">Suspended</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pl-13 font-light">
                  <div className="flex gap-4">
                    <div className="text-white/40">{vendor.total_products} products</div>
                    <div className="text-white/40">${(vendor.total_sales || 0).toFixed(0)}</div>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/vendors/${vendor.id}/wholesale-settings`}
                      className="p-2 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
                      title="Wholesale Settings"
                    >
                      <Package size={14} strokeWidth={1.5} />
                    </Link>
                    {vendor.status === 'pending' || vendor.status === 'suspended' ? (
                      <button
                        onClick={() => activateVendor(vendor.id)}
                        className="p-2 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
                        title="Activate"
                      >
                        <CheckCircle size={14} strokeWidth={1.5} />
                      </button>
                    ) : (
                      <button
                        onClick={() => suspendVendor(vendor.id)}
                        className="p-2 text-white/20 hover:text-white/30 hover:bg-white/5 transition-all duration-300"
                        title="Suspend"
                      >
                        <XCircle size={14} strokeWidth={1.5} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteVendor(vendor.id)}
                      className="p-2 text-white/20 hover:text-white/30 hover:bg-white/5 transition-all duration-300"
                      title="Delete"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0 rounded-[14px] overflow-hidden relative">
                  {vendor.logo_url ? (
                    <img 
                      src={vendor.logo_url} 
                      alt={vendor.store_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={14} className="text-white/30" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-white/90 text-sm font-light mb-1 truncate">{vendor.store_name}</div>
                  <div className="text-white/30 text-xs font-light truncate">{vendor.email}</div>
                </div>
                <div className="text-white/40 text-xs font-light w-28">{vendor.total_products} products</div>
                <div className="text-white/40 text-xs font-light w-24 text-right">${(vendor.total_sales || 0).toFixed(0)}</div>
                <div className="flex-shrink-0 w-24">
                  {vendor.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-white/40 border border-white/10 tracking-wider uppercase">
                      <CheckCircle size={8} strokeWidth={2} />
                      Active
                    </span>
                  ) : vendor.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-white/30 border border-white/10 tracking-wider uppercase">
                      <AlertCircle size={8} strokeWidth={2} />
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-white/30 border border-white/10 tracking-wider uppercase">
                      <XCircle size={8} strokeWidth={2} />
                      Suspended
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Link
                    href={`/admin/vendors/${vendor.id}/wholesale-settings`}
                    className="p-2 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
                    title="Wholesale Settings"
                  >
                    <Package size={14} strokeWidth={1.5} />
                  </Link>
                  {vendor.status === 'pending' || vendor.status === 'suspended' ? (
                    <button
                      onClick={() => activateVendor(vendor.id)}
                      className="p-2 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
                    >
                      <CheckCircle size={14} strokeWidth={1.5} />
                    </button>
                  ) : (
                    <button
                      onClick={() => suspendVendor(vendor.id)}
                      className="p-2 text-white/20 hover:text-white/30 hover:bg-white/5 transition-all duration-300"
                    >
                      <XCircle size={14} strokeWidth={1.5} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteVendor(vendor.id)}
                    className="p-2 text-white/20 hover:text-white/30 hover:bg-white/5 transition-all duration-300"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Partner Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Partner"
        description="Create a new partner account"
        onSubmit={createVendor}
        submitText="Create Partner"
        maxWidth="md"
        >
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Store Name</label>
            <input
              type="text"
              value={newVendor.store_name}
              onChange={(e) => setNewVendor({ ...newVendor, store_name: e.target.value })}
              className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={newVendor.email}
              onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
              className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={newVendor.username}
              onChange={(e) => setNewVendor({ ...newVendor, username: e.target.value })}
              className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={newVendor.password}
              onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
              className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
