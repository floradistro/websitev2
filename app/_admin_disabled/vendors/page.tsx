"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { Store, Plus, Search, Filter, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';

// Prevent static generation for admin pages

const baseUrl = "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

interface Vendor {
  id: number;
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
      
      // Fetch users with vendor role from WordPress
      const response = await axios.get(
        `${baseUrl}/wp-json/wp/v2/users?${authParams}&per_page=100&roles=vendor&_t=${Date.now()}`
      ).catch(() => ({ data: [] }));

      const vendorsList = response.data.map((user: any) => ({
        id: user.id,
        store_name: user.name || user.username,
        email: user.email || 'N/A',
        status: 'active',
        created_date: user.registered_date || new Date().toISOString(),
        total_products: 0,
        total_sales: 0,
      }));

      setVendors(vendorsList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
      setLoading(false);
    }
  }

  async function createVendor() {
    if (!newVendor.store_name || !newVendor.email || !newVendor.username || !newVendor.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Use the admin API endpoint to create vendor
      const response = await axios.post(
        `/api/admin/create-vendor`,
        {
          store_name: newVendor.store_name,
          email: newVendor.email,
          username: newVendor.username,
          password: newVendor.password,
        }
      );

      if (response.data.success) {
        alert('Vendor created successfully!');
        setShowAddModal(false);
        setNewVendor({ store_name: '', email: '', username: '', password: '' });
        loadVendors();
      } else {
        alert(`Failed to create vendor: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async function suspendVendor(vendorId: number) {
    if (!confirm('Are you sure you want to suspend this vendor?')) return;

    try {
      // Update vendor status via WordPress API
      await axios.post(
        `${baseUrl}/wp-json/wp/v2/users/${vendorId}?${authParams}`,
        { meta: { vendor_status: 'suspended' } }
      );

      alert('Vendor suspended successfully');
      loadVendors();
    } catch (error) {
      console.error('Error suspending vendor:', error);
      alert('Failed to suspend vendor');
    }
  }

  async function deleteVendor(vendorId: number) {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) return;

    try {
      await axios.delete(
        `${baseUrl}/wp-json/wp/v2/users/${vendorId}?${authParams}&force=true&reassign=1`
      );

      alert('Vendor deleted successfully');
      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor');
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
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-sm lg:text-base"
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
                      <button
                        onClick={() => suspendVendor(vendor.id)}
                        className="text-xs text-white/60 hover:text-white px-3 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        Suspend
                      </button>
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
                          onClick={() => suspendVendor(vendor.id)}
                          className="text-white/60 hover:text-white text-sm transition-colors"
                        >
                          Suspend
                        </button>
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
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/20 max-w-md w-full">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-xl text-white font-medium">Add New Vendor</h2>
              <p className="text-white/60 text-sm mt-1">Create a new vendor account</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Store Name</label>
                <input
                  type="text"
                  value={newVendor.store_name}
                  onChange={(e) => setNewVendor({ ...newVendor, store_name: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  value={newVendor.username}
                  onChange={(e) => setNewVendor({ ...newVendor, username: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
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
            </div>
            <div className="border-t border-white/10 p-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-transparent border border-white/20 text-white hover:bg-white/5 transition-all text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={createVendor}
                className="flex-1 px-4 py-2.5 bg-white text-black hover:bg-white/90 transition-all text-sm uppercase tracking-wider font-medium"
              >
                Create Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

