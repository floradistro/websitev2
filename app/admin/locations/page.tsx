"use client";

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, CheckCircle, XCircle, DollarSign, Building, Star } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface Location {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
  type: 'retail' | 'vendor' | 'warehouse' | 'distribution';
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  is_default: boolean;
  is_active: boolean;
  pos_enabled: boolean;
  pricing_tier: string;
  billing_status: string;
  monthly_fee: number;
  accepts_online_orders: boolean;
  accepts_transfers: boolean;
  created_at: string;
  vendors?: {
    store_name: string;
    email: string;
  };
}

interface Vendor {
  id: string;
  store_name: string;
  email: string;
  total_locations: number;
}

export default function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    vendor_id: '',
    name: '',
    type: 'retail' as 'retail' | 'warehouse' | 'vendor' | 'distribution',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    pos_enabled: true,
    pricing_tier: 'standard',
    monthly_fee: 49.99,
  });
  const [editLocationData, setEditLocationData] = useState({
    name: '',
    type: 'retail' as 'retail' | 'warehouse' | 'vendor' | 'distribution',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    pos_enabled: true,
    pricing_tier: 'standard',
    monthly_fee: 49.99,
    billing_status: 'active',
  });

  useEffect(() => {
    loadVendors();
    loadLocations();
  }, []);

  function openEditModal(location: Location) {
    setEditingLocation(location);
    setEditLocationData({
      name: location.name,
      type: location.type,
      address_line1: location.address_line1 || '',
      address_line2: location.address_line2 || '',
      city: location.city || '',
      state: location.state || '',
      zip: location.zip || '',
      phone: location.phone || '',
      email: location.email || '',
      pos_enabled: location.pos_enabled,
      pricing_tier: location.pricing_tier,
      monthly_fee: location.monthly_fee,
      billing_status: location.billing_status,
    });
    setShowEditModal(true);
  }

  async function updateLocation() {
    if (!editingLocation) return;

    try {
      console.log('🔵 Sending update for location:', editingLocation.id);
      console.log('🔵 Data being sent:', editLocationData);
      
      const response = await axios.post('/api/admin/locations', {
        action: 'update',
        location_id: editingLocation.id,
        ...editLocationData,
      });

      console.log('🔵 Update response:', response.data);

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Location Updated',
          message: `${editLocationData.name} has been updated successfully`,
        });
        setShowEditModal(false);
        setEditingLocation(null);
        loadLocations();
      }
    } catch (error: any) {
      console.error('❌ Update error:', error);
      console.error('❌ Error response:', error.response?.data);
      showNotification({
        type: 'error',
        title: 'Error Updating Location',
        message: error.response?.data?.error || error.message,
      });
    }
  }

  async function loadVendors() {
    try {
      const response = await axios.get('/api/admin/vendors');
      if (response.data.success) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  }

  async function loadLocations() {
    try {
      setLoading(true);
      const params = selectedVendor !== 'all' ? `?vendor_id=${selectedVendor}` : '';
      const response = await axios.get(`/api/admin/locations${params}`);
      
      if (response.data.success) {
        setLocations(response.data.locations);
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      showNotification({
        type: 'error',
        title: 'Error Loading Locations',
        message: error.response?.data?.error || error.message,
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, [selectedVendor]);

  async function createLocation() {
    if (!newLocation.vendor_id || !newLocation.name) {
      showNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Vendor and location name are required',
      });
      return;
    }

    try {
      const response = await axios.post('/api/admin/locations', {
        action: 'create',
        ...newLocation,
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Location Created',
          message: `${newLocation.name} has been created successfully`,
        });
        setShowAddModal(false);
        setNewLocation({
          vendor_id: '',
          name: '',
          type: 'retail',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          zip: '',
          phone: '',
          email: '',
          pos_enabled: true,
          pricing_tier: 'standard',
          monthly_fee: 49.99,
        });
        loadLocations();
        loadVendors();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error Creating Location',
        message: error.response?.data?.error || error.message,
      });
    }
  }

  async function toggleStatus(locationId: string, currentStatus: boolean) {
    try {
      const response = await axios.post('/api/admin/locations', {
        action: 'toggle_status',
        location_id: locationId,
        is_active: !currentStatus,
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Status Updated',
          message: response.data.message,
        });
        loadLocations();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || error.message,
      });
    }
  }

  async function deleteLocation(locationId: string, locationName: string) {
    const confirmed = await showConfirm({
      title: 'Delete Location',
      message: `Are you sure you want to delete ${locationName}? This will also remove all inventory data for this location.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {},
    });
    
    if (!confirmed) return;

    try {
      const response = await axios.post('/api/admin/locations', {
        action: 'delete',
        location_id: locationId,
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Location Deleted',
          message: response.data.message,
        });
        loadLocations();
        loadVendors();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || error.message,
      });
    }
  }

  const getTypeBadge = (type: string) => {
    const config = {
      retail: { className: 'border-blue-500 text-blue-500', text: 'Retail' },
      vendor: { className: 'border-purple-500 text-purple-500', text: 'Vendor' },
      warehouse: { className: 'border-orange-500 text-orange-500', text: 'Warehouse' },
      distribution: { className: 'border-green-500 text-green-500', text: 'Distribution' },
    };

    const { className, text } = config[type as keyof typeof config] || config.retail;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] lg:text-xs font-medium uppercase tracking-wider border ${className}`}>
        {text}
      </span>
    );
  };

  const filteredLocations = locations.filter(loc => 
    selectedVendor === 'all' || loc.vendor_id === selectedVendor
  );

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            Vendor Locations
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            Manage multi-location access for vendors
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-1.5 lg:gap-2 bg-black border border-white/20 text-white px-3 lg:px-6 py-3 lg:py-3 text-[10px] lg:text-xs font-medium uppercase tracking-[0.15em] lg:tracking-[0.2em] active:bg-white active:text-black lg:hover:bg-white lg:hover:text-black lg:hover:border-white transition-all duration-300 whitespace-nowrap"
        >
          <Plus size={16} className="lg:hidden flex-shrink-0" />
          <Plus size={18} className="hidden lg:block group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Vendor Filter */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 lg:py-4 mb-0 lg:mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
          <label className="text-white/60 text-xs uppercase tracking-wider flex-shrink-0">Filter by Vendor:</label>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="flex-1 lg:flex-initial bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors text-sm"
          >
            <option value="all">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.store_name} ({vendor.total_locations} locations)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center text-white/60">
          Loading locations...
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center">
          <Building size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-4">No locations found</div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] lg:border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Location</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Vendor</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Type</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Address</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">POS</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Billing</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-[#303030] transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-white/40" />
                      <div>
                        <div className="text-white font-medium text-sm flex items-center gap-2">
                          {location.name}
                          {location.is_primary && (
                            <span title="Primary Location">
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-white/40 text-xs">{location.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-white text-sm">{location.vendors?.store_name}</div>
                    <div className="text-white/40 text-xs">{location.vendors?.email}</div>
                  </td>
                  <td className="p-4">
                    {getTypeBadge(location.type)}
                  </td>
                  <td className="p-4">
                    <div className="text-white/60 text-sm">
                      {location.address_line1 ? (
                        <>
                          {location.address_line1}<br />
                          {location.city}, {location.state} {location.zip}
                        </>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {location.pos_enabled ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-white/20" />
                    )}
                  </td>
                  <td className="p-4">
                    {location.is_primary ? (
                      <span className="text-green-500 text-sm">FREE</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                          location.billing_status === 'active' ? 'text-green-500' :
                          location.billing_status === 'trial' ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {location.billing_status}
                        </span>
                        <span className="text-white/40 text-xs">${location.monthly_fee}/mo</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium uppercase tracking-wider border ${
                      location.is_active ? 'border-green-500 text-green-500' : 'border-white/20 text-white/40'
                    }`}>
                      {location.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(location)}
                        className="text-white/60 hover:text-white text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(location.id, location.is_active)}
                        className="text-white/60 hover:text-white text-sm transition-colors"
                      >
                        {location.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {!location.is_primary && (
                        <button
                          onClick={() => deleteLocation(location.id, location.name)}
                          className="text-red-500/60 hover:text-red-500 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Location Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Location"
        description="Create a new location for a vendor"
        onSubmit={createLocation}
        submitText="Create Location"
        maxWidth="2xl"
      >
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Vendor *</label>
          <select
            value={newLocation.vendor_id}
            onChange={(e) => setNewLocation({ ...newLocation, vendor_id: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          >
            <option value="">Select a vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.store_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Location Name *</label>
            <input
              type="text"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="Downtown Store"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Type</label>
            <select
              value={newLocation.type}
              onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as any })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            >
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="vendor">Vendor</option>
              <option value="distribution">Distribution</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Address Line 1</label>
          <input
            type="text"
            value={newLocation.address_line1}
            onChange={(e) => setNewLocation({ ...newLocation, address_line1: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Address Line 2</label>
          <input
            type="text"
            value={newLocation.address_line2}
            onChange={(e) => setNewLocation({ ...newLocation, address_line2: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">City</label>
            <input
              type="text"
              value={newLocation.city}
              onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">State</label>
            <input
              type="text"
              value={newLocation.state}
              onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">ZIP</label>
            <input
              type="text"
              value={newLocation.zip}
              onChange={(e) => setNewLocation({ ...newLocation, zip: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone</label>
            <input
              type="text"
              value={newLocation.phone}
              onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={newLocation.email}
              onChange={(e) => setNewLocation({ ...newLocation, email: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Pricing Tier</label>
            <select
              value={newLocation.pricing_tier}
              onChange={(e) => setNewLocation({ ...newLocation, pricing_tier: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Monthly Fee</label>
            <input
              type="number"
              step="0.01"
              value={newLocation.monthly_fee}
              onChange={(e) => setNewLocation({ ...newLocation, monthly_fee: parseFloat(e.target.value) })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer pb-2.5">
              <input
                type="checkbox"
                checked={newLocation.pos_enabled}
                onChange={(e) => setNewLocation({ ...newLocation, pos_enabled: e.target.checked })}
                className="w-4 h-4"
              />
              Enable POS
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Edit Location Modal */}
      <AdminModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Location"
        description={editingLocation ? `Update ${editingLocation.name}` : 'Update location details'}
        onSubmit={updateLocation}
        submitText="Update Location"
        maxWidth="2xl"
      >
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Location Name *</label>
          <input
            type="text"
            value={editLocationData.name}
            onChange={(e) => setEditLocationData({ ...editLocationData, name: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors mb-4"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Type</label>
            <select
              value={editLocationData.type}
              onChange={(e) => setEditLocationData({ ...editLocationData, type: e.target.value as any })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            >
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="vendor">Vendor</option>
              <option value="distribution">Distribution</option>
            </select>
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone</label>
            <input
              type="text"
              value={editLocationData.phone}
              onChange={(e) => setEditLocationData({ ...editLocationData, phone: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Address Line 1</label>
          <input
            type="text"
            value={editLocationData.address_line1}
            onChange={(e) => setEditLocationData({ ...editLocationData, address_line1: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Address Line 2</label>
          <input
            type="text"
            value={editLocationData.address_line2}
            onChange={(e) => setEditLocationData({ ...editLocationData, address_line2: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">City</label>
            <input
              type="text"
              value={editLocationData.city}
              onChange={(e) => setEditLocationData({ ...editLocationData, city: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">State</label>
            <input
              type="text"
              value={editLocationData.state}
              onChange={(e) => setEditLocationData({ ...editLocationData, state: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">ZIP</label>
            <input
              type="text"
              value={editLocationData.zip}
              onChange={(e) => setEditLocationData({ ...editLocationData, zip: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            value={editLocationData.email}
            onChange={(e) => setEditLocationData({ ...editLocationData, email: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Show info for primary locations */}
        {editingLocation?.is_primary && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 mb-4">
            <div className="flex items-center gap-2 text-yellow-500 text-sm font-medium mb-1">
              <Star size={16} className="fill-yellow-500" />
              Primary Location
            </div>
            <p className="text-white/60 text-xs">
              This is the primary location for this vendor. Primary locations are always FREE ($0/month).
            </p>
          </div>
        )}

        {!editingLocation?.is_primary && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Pricing Tier</label>
                <select
                  value={editLocationData.pricing_tier}
                  onChange={(e) => setEditLocationData({ ...editLocationData, pricing_tier: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Billing Status</label>
                <select
                  value={editLocationData.billing_status}
                  onChange={(e) => setEditLocationData({ ...editLocationData, billing_status: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Monthly Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editLocationData.monthly_fee}
                  onChange={(e) => setEditLocationData({ ...editLocationData, monthly_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer pb-2.5">
                  <input
                    type="checkbox"
                    checked={editLocationData.pos_enabled}
                    onChange={(e) => setEditLocationData({ ...editLocationData, pos_enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Enable POS
                </label>
              </div>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}

