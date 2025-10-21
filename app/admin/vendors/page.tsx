"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { Store, Plus, Search, Filter, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

// Prevent static generation for admin pages

// Admin vendors now uses Supabase API

interface Vendor {
  id: string | number;
  store_name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  created_date: string;
  total_products: number;
  total_sales: number;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState({
    store_name: '',
    email: '',
    username: '',
    password: '',
  });
  const [editVendorData, setEditVendorData] = useState({
    store_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setLoading(true);
      
      // Fetch vendors from new Supabase hybrid API
      const response = await axios.get('/api/admin/vendors');

      if (response.data.success && Array.isArray(response.data.vendors)) {
        const vendorsList: Vendor[] = response.data.vendors.map((vendor: any) => ({
          id: vendor.id, // UUID from Supabase
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

  function openEditModal(vendor: Vendor) {
    setEditingVendor(vendor);
    setEditVendorData({
      store_name: vendor.store_name,
      email: vendor.email,
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zip: vendor.zip || '',
    });
    setShowEditModal(true);
  }

  async function updateVendor() {
    if (!editingVendor) return;

    try {
      const response = await axios.post('/api/admin/vendors', {
        action: 'update',
        vendor_id: editingVendor.id,
        ...editVendorData,
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Vendor Updated',
          message: `${editVendorData.store_name} has been updated successfully`,
        });
        setShowEditModal(false);
        setEditingVendor(null);
        loadVendors();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error Updating Vendor',
        message: error.response?.data?.message || error.message,
      });
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
      const response = await axios.post(
        `/api/admin/create-vendor-supabase`,
        {
          store_name: newVendor.store_name,
          email: newVendor.email,
          username: newVendor.username,
          password: newVendor.password,
        }
      );

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Vendor Created',
          message: `${response.data.vendor.store_name} has been created successfully`,
          duration: 7000,
        });
        setShowAddModal(false);
        setNewVendor({ store_name: '', email: '', username: '', password: '' });
        
        setTimeout(() => {
          loadVendors();
        }, 1000);
      } else {
        showNotification({
          type: 'error',
          title: 'Creation Failed',
          message: response.data.message || 'Please use a different email/username',
        });
      }
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      const errorMessage = error.response?.data?.message || error.message;
      showNotification({
        type: 'error',
        title: 'Error Creating Vendor',
        message: errorMessage.includes('email') ? 'Email already in use. Please use a unique email address' : errorMessage,
      });
    }
  }

  async function suspendVendor(vendorId: string | number) {
    const confirmed = await showConfirm({
      title: 'Suspend Vendor',
      message: 'Are you sure you want to suspend this vendor? They will not be able to access their account.',
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
      } else {
        showNotification({
          type: 'error',
          title: 'Suspension Failed',
          message: response.data.message || 'Unable to suspend vendor',
        });
      }
    } catch (error: any) {
      console.error('Error suspending vendor:', error);
      showNotification({
        type: 'error',
        title: 'Suspension Error',
        message: error.response?.data?.message || error.message,
      });
    }
  }

  async function activateVendor(vendorId: string | number) {
    const confirmed = await showConfirm({
      title: 'Activate Vendor',
      message: 'Activate this vendor and allow them to access their account?',
      confirmText: 'Activate',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: () => {},
    });
    if (!confirmed) return;

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
      } else {
        showNotification({
          type: 'error',
          title: 'Activation Failed',
          message: response.data.message || 'Unable to activate vendor',
        });
      }
    } catch (error: any) {
      console.error('Error activating vendor:', error);
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
      message: 'This will permanently delete the vendor from all systems including Supabase, WordPress, and auth. This action CANNOT be undone.',
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
      } else {
        showNotification({
          type: 'error',
          title: 'Deletion Failed',
          message: response.data.message || 'Unable to delete vendor',
        });
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Deletion Error',
        message: error.response?.data?.message || error.message,
      });
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      active: {
        className: "border-green-500 text-green-500",
        icon: CheckCircle,
        text: "Active"
      },
      pending: {
        className: "border-yellow-500 text-yellow-500",
        icon: AlertCircle,
        text: "Pending"
      },
      suspended: {
        className: "border-red-500 text-red-500",
        icon: XCircle,
        text: "Suspended"
      },
    };

    const { className, icon: Icon, text } = config[status as keyof typeof config] || config.active;

    return (
      <span className={`inline-flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 py-0.5 lg:py-1 text-[10px] lg:text-xs font-medium uppercase tracking-wider border ${className}`}>
        <Icon size={10} className="lg:w-3 lg:h-3" />
        <span>{text}</span>
      </span>
    );
  };

  const filteredVendors = vendors.filter(vendor => {
    if (filter !== 'all' && vendor.status !== filter) return false;
    if (search && !vendor.store_name.toLowerCase().includes(search.toLowerCase()) && !vendor.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            Vendor Management
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-1.5 lg:gap-2 bg-black border border-white/20 text-white px-3 lg:px-6 py-3 lg:py-3 text-[10px] lg:text-xs font-medium uppercase tracking-[0.15em] lg:tracking-[0.2em] active:bg-white active:text-black lg:hover:bg-white lg:hover:text-black lg:hover:border-white transition-all duration-300 whitespace-nowrap"
        >
          <Plus size={16} className="lg:hidden flex-shrink-0" />
          <Plus size={18} className="hidden lg:block group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
          <span className="hidden sm:inline">Add Vendor</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 lg:py-4 mb-0 lg:mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="lg:w-[18px] lg:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-white/40 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/20 transition-colors text-sm lg:text-base"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1a1a1a] text-white/60 active:text-white lg:hover:text-white border border-white/5 active:border-white/10 lg:hover:border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border ${
                filter === 'active'
                  ? 'border-green-500 text-green-500'
                  : 'border-white/10 text-white/60 active:text-white active:border-white/20 lg:hover:text-white lg:hover:border-white/20'
              }`}
            >
              <CheckCircle size={12} className="lg:w-3.5 lg:h-3.5" />
              Active
            </button>
            <button
              onClick={() => setFilter('suspended')}
              className={`flex items-center gap-1 lg:gap-1.5 flex-shrink-0 px-2.5 lg:px-4 py-2.5 lg:py-2 text-[10px] lg:text-xs uppercase tracking-wider transition-all whitespace-nowrap border ${
                filter === 'suspended'
                  ? 'border-red-500 text-red-500'
                  : 'border-white/10 text-white/60 active:text-white active:border-white/20 lg:hover:text-white lg:hover:border-white/20'
              }`}
            >
              <XCircle size={12} className="lg:w-3.5 lg:h-3.5" />
              Suspended
            </button>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16 text-center text-white/60">
          Loading vendors...
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center">
          <Store size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-4">No vendors found</div>
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div className="lg:hidden">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="block bg-[#1a1a1a] border-b border-white/5 p-4"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                    <Store size={24} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-base font-medium mb-2">{vendor.store_name}</div>
                    <div className="text-white/60 text-sm mb-2">{vendor.email}</div>
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusBadge(vendor.status)}
                    </div>
                    <div className="flex gap-2">
                      {vendor.status === 'pending' || vendor.status === 'suspended' ? (
                        <button
                          onClick={() => activateVendor(vendor.id)}
                          className="text-xs text-green-500/60 hover:text-green-500 px-3 py-1.5 border border-green-500/10 hover:border-green-500/20 transition-colors"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendVendor(vendor.id)}
                          className="text-xs text-white/60 hover:text-white px-3 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => deleteVendor(vendor.id)}
                        className="text-xs text-red-500/60 hover:text-red-500 px-3 py-1.5 border border-red-500/10 hover:border-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-[#1a1a1a] border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/5 bg-[#1a1a1a]">
                <tr>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Vendor</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Email</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Products</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-[#303030] transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
                          <Store size={18} className="text-white/40" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{vendor.store_name}</div>
                          <div className="text-white/40 text-xs">ID: {vendor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-sm">{vendor.email}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm">{vendor.total_products}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(vendor.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(vendor)}
                          className="text-white/60 hover:text-white text-sm transition-colors"
                        >
                          Edit
                        </button>
                        {vendor.status === 'pending' || vendor.status === 'suspended' ? (
                          <button
                            onClick={() => activateVendor(vendor.id)}
                            className="text-green-500/60 hover:text-green-500 text-sm transition-colors"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendVendor(vendor.id)}
                            className="text-white/60 hover:text-white text-sm transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => deleteVendor(vendor.id)}
                          className="text-red-500/60 hover:text-red-500 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Store Name</label>
          <input
            type="text"
            value={newVendor.store_name}
            onChange={(e) => setNewVendor({ ...newVendor, store_name: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            value={newVendor.email}
            onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Username</label>
          <input
            type="text"
            value={newVendor.username}
            onChange={(e) => setNewVendor({ ...newVendor, username: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            value={newVendor.password}
            onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </AdminModal>

      {/* Edit Vendor Modal */}
      <AdminModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Vendor"
        description={editingVendor ? `Update ${editingVendor.store_name}` : 'Update vendor information'}
        onSubmit={updateVendor}
        submitText="Update Vendor"
        maxWidth="md"
      >
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Store Name</label>
          <input
            type="text"
            value={editVendorData.store_name}
            onChange={(e) => setEditVendorData({ ...editVendorData, store_name: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            value={editVendorData.email}
            onChange={(e) => setEditVendorData({ ...editVendorData, email: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone</label>
          <input
            type="text"
            value={editVendorData.phone}
            onChange={(e) => setEditVendorData({ ...editVendorData, phone: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Address</label>
          <input
            type="text"
            value={editVendorData.address}
            onChange={(e) => setEditVendorData({ ...editVendorData, address: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">City</label>
            <input
              type="text"
              value={editVendorData.city}
              onChange={(e) => setEditVendorData({ ...editVendorData, city: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">State</label>
            <input
              type="text"
              value={editVendorData.state}
              onChange={(e) => setEditVendorData({ ...editVendorData, state: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">ZIP</label>
            <input
              type="text"
              value={editVendorData.zip}
              onChange={(e) => setEditVendorData({ ...editVendorData, zip: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

