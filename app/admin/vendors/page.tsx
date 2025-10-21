"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { Store, Plus, Search, CheckCircle, XCircle, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface Vendor {
  id: string | number;
  store_name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  created_date: string;
  total_products: number;
  total_sales: number;
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
      setLoading(true);
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
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error Creating Vendor',
        message: error.response?.data?.message || error.message,
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
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl text-white font-light tracking-tight mb-2">Vendors</h1>
          <p className="text-white/50 text-sm">{filteredVendors.length} registered</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 lg:px-5 lg:py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Vendor</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/40 pl-9 pr-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              filter === 'all' ? 'bg-white text-black' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              filter === 'active' ? 'bg-white/10 text-white border border-white' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('suspended')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              filter === 'suspended' ? 'bg-white/10 text-white border border-white' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* Vendors List - Edge to edge on mobile */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <Store size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm">No vendors found</div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10 -mx-4 lg:mx-0">
          {filteredVendors.map((vendor, index) => (
            <div
              key={vendor.id}
              className={`px-4 py-4 hover:bg-white/5 transition-colors ${
                index !== filteredVendors.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 rounded">
                    <Store size={18} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium mb-1 truncate">{vendor.store_name}</div>
                    <div className="text-white/40 text-xs truncate">{vendor.email}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {vendor.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/60 border border-white/10 rounded">
                        <CheckCircle size={10} />
                        <span className="hidden sm:inline">Active</span>
                      </span>
                    ) : vendor.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/40 border border-white/10 rounded">
                        <AlertCircle size={10} />
                        <span className="hidden sm:inline">Pending</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-500 border border-red-500/30 rounded">
                        <XCircle size={10} />
                        <span className="hidden sm:inline">Suspended</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pl-13">
                  <div className="flex gap-4">
                    <div className="text-white/60">{vendor.total_products} products</div>
                    <div className="text-white/60">${(vendor.total_sales || 0).toFixed(0)}</div>
                  </div>
                  <div className="flex gap-2">
                    {vendor.status === 'pending' || vendor.status === 'suspended' ? (
                      <button
                        onClick={() => activateVendor(vendor.id)}
                        className="p-2 text-green-500 hover:text-green-400 hover:bg-white/10 transition-all rounded"
                        title="Activate"
                      >
                        <CheckCircle size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => suspendVendor(vendor.id)}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 transition-all rounded"
                        title="Suspend"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteVendor(vendor.id)}
                      className="p-2 text-red-500/60 hover:text-red-500 hover:bg-white/10 transition-all rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Store size={16} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{vendor.store_name}</div>
                  <div className="text-white/40 text-xs">{vendor.email}</div>
                </div>
                <div className="text-white/60 text-xs">{vendor.total_products} products</div>
                <div className="text-white/60 text-xs">${(vendor.total_sales || 0).toFixed(0)}</div>
                <div className="flex-shrink-0">
                  {vendor.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/60 border border-white/10">
                      <CheckCircle size={10} />
                      Active
                    </span>
                  ) : vendor.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/40 border border-white/10">
                      <AlertCircle size={10} />
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-500 border border-red-500/30">
                      <XCircle size={10} />
                      Suspended
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {vendor.status === 'pending' || vendor.status === 'suspended' ? (
                    <button
                      onClick={() => activateVendor(vendor.id)}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <CheckCircle size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => suspendVendor(vendor.id)}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteVendor(vendor.id)}
                    className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Vendor"
        description="Create a new vendor account"
        onSubmit={createVendor}
        submitText="Create Vendor"
        maxWidth="md"
        >
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Store Name</label>
            <input
              type="text"
              value={newVendor.store_name}
              onChange={(e) => setNewVendor({ ...newVendor, store_name: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={newVendor.email}
              onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={newVendor.username}
              onChange={(e) => setNewVendor({ ...newVendor, username: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={newVendor.password}
              onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
