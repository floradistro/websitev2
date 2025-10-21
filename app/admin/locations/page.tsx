"use client";

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
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
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    loadVendors();
    loadLocations();
  }, []);

  useEffect(() => {
    loadLocations();
  }, [selectedVendor]);

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
      setLoading(false);
    }
  }

  function openEditModal(location: Location) {
    setEditingLocation(location);
    setShowEditModal(true);
  }

  async function updateLocation() {
    if (!editingLocation) return;

    try {
      const response = await axios.post('/api/admin/locations', {
        action: 'update',
        location_id: editingLocation.id,
        name: editingLocation.name,
        type: editingLocation.type,
        address_line1: editingLocation.address_line1,
        city: editingLocation.city,
        state: editingLocation.state,
        zip: editingLocation.zip,
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Location Updated',
          message: `${editingLocation.name} has been updated successfully`,
        });
        setShowEditModal(false);
        setEditingLocation(null);
        loadLocations();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error Updating Location',
        message: error.response?.data?.error || error.message,
      });
    }
  }

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
          city: '',
          state: '',
          zip: '',
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
      message: `Are you sure you want to delete ${locationName}?`,
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

  const filteredLocations = locations.filter(loc => 
    selectedVendor === 'all' || loc.vendor_id === selectedVendor
  );

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl text-white font-light tracking-tight mb-2">Locations</h1>
          <p className="text-white/50 text-sm">{filteredLocations.length} registered</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 lg:px-5 lg:py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Location</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Vendor Filter */}
      <div className="mb-4">
        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="w-full sm:w-auto bg-[#111111] border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors text-sm"
        >
          <option value="all">All Vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.store_name} ({vendor.total_locations} locations)
            </option>
          ))}
        </select>
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <MapPin size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm">No locations found</div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10 -mx-4 lg:mx-0">
          {filteredLocations.map((location, index) => (
            <div
              key={location.id}
              className={`px-4 py-4 hover:bg-white/5 transition-colors ${
                index !== filteredLocations.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* Mobile Layout - Fully Stacked */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 rounded">
                    <MapPin size={18} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-white text-sm font-medium">{location.name}</div>
                      {location.is_primary && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="text-white/40 text-xs mb-1">{location.vendors?.store_name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white/60 capitalize px-2 py-0.5 bg-white/5 rounded">{location.type}</span>
                      {location.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-white/60 border border-white/10 rounded">
                          <CheckCircle size={10} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-white/40 border border-white/10 rounded">
                          <XCircle size={10} />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pl-13 space-y-2">
                  <div className="text-xs text-white/60">
                    📍 {location.city ? `${location.city}, ${location.state}` : 'Location not set'}
                  </div>
                  <div className="text-xs text-white/60">
                    💰 {location.is_primary ? 'FREE (Primary)' : `$${location.monthly_fee}/mo`}
                  </div>
                </div>

                <div className="flex gap-2 pl-13">
                  <button
                    onClick={() => openEditModal(location)}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all rounded border border-white/10 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(location.id, location.is_active)}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all rounded border border-white/10 text-xs"
                  >
                    {location.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  {!location.is_primary && (
                    <button
                      onClick={() => deleteLocation(location.id, location.name)}
                      className="p-2.5 px-4 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all rounded border border-red-500/20 text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-white text-sm font-medium">{location.name}</div>
                    {location.is_primary && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="text-white/40 text-xs">{location.vendors?.store_name}</div>
                </div>
                <div className="text-white/60 text-xs capitalize">{location.type}</div>
                <div className="text-white/60 text-xs">
                  {location.city ? `${location.city}, ${location.state}` : '—'}
                </div>
                <div className="text-white/60 text-xs">
                  {location.is_primary ? 'FREE' : `$${location.monthly_fee}/mo`}
                </div>
                <div className="flex-shrink-0">
                  {location.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/60 border border-white/10">
                      <CheckCircle size={10} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/40 border border-white/10">
                      <XCircle size={10} />
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(location)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(location.id, location.is_active)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {location.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                  </button>
                  {!location.is_primary && (
                    <button
                      onClick={() => deleteLocation(location.id, location.name)}
                      className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Vendor *</label>
            <select
              value={newLocation.vendor_id}
              onChange={(e) => setNewLocation({ ...newLocation, vendor_id: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.store_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Location Name *</label>
              <input
                type="text"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Type</label>
              <select
                value={newLocation.type}
                onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as any })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="retail">Retail</option>
                <option value="warehouse">Warehouse</option>
                <option value="vendor">Vendor</option>
                <option value="distribution">Distribution</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Address</label>
            <input
              type="text"
              value={newLocation.address_line1}
              onChange={(e) => setNewLocation({ ...newLocation, address_line1: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">City</label>
              <input
                type="text"
                value={newLocation.city}
                onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">State</label>
              <input
                type="text"
                value={newLocation.state}
                onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">ZIP</label>
              <input
                type="text"
                value={newLocation.zip}
                onChange={(e) => setNewLocation({ ...newLocation, zip: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Edit Location Modal */}
      {editingLocation && (
        <AdminModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingLocation(null);
          }}
          title="Edit Location"
          description={`Update ${editingLocation.name}`}
          onSubmit={updateLocation}
          submitText="Update Location"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Location Name *</label>
                <input
                  type="text"
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Type</label>
                <select
                  value={editingLocation.type}
                  onChange={(e) => setEditingLocation({ ...editingLocation, type: e.target.value as any })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                >
                  <option value="retail">Retail</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="vendor">Vendor</option>
                  <option value="distribution">Distribution</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Address</label>
              <input
                type="text"
                value={editingLocation.address_line1 || ''}
                onChange={(e) => setEditingLocation({ ...editingLocation, address_line1: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">City</label>
                <input
                  type="text"
                  value={editingLocation.city || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, city: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">State</label>
                <input
                  type="text"
                  value={editingLocation.state || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, state: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">ZIP</label>
                <input
                  type="text"
                  value={editingLocation.zip || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, zip: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
