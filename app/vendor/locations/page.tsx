"use client";

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Star, CheckCircle, XCircle, Phone, Mail } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import axios from 'axios';
import { showNotification } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface Location {
  id: string;
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
  is_active: boolean;
  pos_enabled: boolean;
  accepts_online_orders: boolean;
  accepts_transfers: boolean;
  monthly_fee: number;
  billing_status: string;
  created_at: string;
}

export default function VendorLocations() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadLocations();
    }
  }, [authLoading, isAuthenticated]);

  async function loadLocations() {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const response = await axios.get('/api/vendor/locations', {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load locations'
      });
    } finally {
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
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/locations', {
        action: 'update',
        location_id: editingLocation.id,
        phone: editingLocation.phone,
        email: editingLocation.email,
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Location Updated',
          message: 'Contact information updated successfully'
        });
        setShowEditModal(false);
        setEditingLocation(null);
        loadLocations();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update location'
      });
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Header */}
      <div className="mb-12 fade-in">
        <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">Locations</h1>
        <p className="text-white/40 text-xs font-light tracking-wide">{locations.length} {locations.length === 1 ? 'LOCATION' : 'LOCATIONS'} · MULTI-SITE MANAGEMENT</p>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="bg-black border border-white/10 p-12 text-center">
          <div className="text-white/40 text-sm">Loading locations...</div>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-black border border-white/10 p-12 text-center">
          <MapPin size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm mb-2">No locations found</div>
          <div className="text-white/40 text-xs">Contact your administrator to add locations</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-black border border-white/10 hover:border-white/20 transition-all"
            >
              {/* Location Card */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/5 flex items-center justify-center">
                      <MapPin size={20} className="text-white/40" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">{location.name}</h3>
                        {location.is_primary && (
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60 capitalize px-2 py-0.5 bg-white/5">
                          {location.type}
                        </span>
                        {location.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-white/60 border border-white/10">
                            <CheckCircle size={10} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-white/40 border border-white/10">
                            <XCircle size={10} />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2 mb-4 pb-4 border-b border-white/5">
                  <div className="text-white/60 text-sm">
                    {location.address_line1 || 'Address not set'}
                  </div>
                  {location.address_line2 && (
                    <div className="text-white/60 text-sm">{location.address_line2}</div>
                  )}
                  <div className="text-white/60 text-sm">
                    {location.city && location.state
                      ? `${location.city}, ${location.state} ${location.zip || ''}`
                      : 'City not set'}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-3 mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-white/40" />
                    <span className="text-white/60 text-sm">{location.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-white/40" />
                    <span className="text-white/60 text-sm">{location.email || 'No email'}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 p-3 border border-white/5">
                    <div className="text-white/40 text-xs mb-1">POS Enabled</div>
                    <div className="text-white text-sm">{location.pos_enabled ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="bg-white/5 p-3 border border-white/5">
                    <div className="text-white/40 text-xs mb-1">Online Orders</div>
                    <div className="text-white text-sm">{location.accepts_online_orders ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="bg-white/5 p-3 border border-white/5">
                    <div className="text-white/40 text-xs mb-1">Transfers</div>
                    <div className="text-white text-sm">{location.accepts_transfers ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="bg-white/5 p-3 border border-white/5">
                    <div className="text-white/40 text-xs mb-1">Monthly Fee</div>
                    <div className="text-white text-sm">
                      {location.is_primary ? 'FREE' : `$${location.monthly_fee}/mo`}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => openEditModal(location)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black px-4 py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all"
                >
                  <Edit2 size={14} />
                  Update Contact Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Location Modal */}
      {editingLocation && (
        <AdminModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingLocation(null);
          }}
          title="Update Contact Information"
          description={`Update contact details for ${editingLocation.name}`}
          onSubmit={updateLocation}
          submitText="Update"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone Number</label>
              <input
                type="tel"
                value={editingLocation.phone || ''}
                onChange={(e) => setEditingLocation({ ...editingLocation, phone: e.target.value })}
                className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={editingLocation.email || ''}
                onChange={(e) => setEditingLocation({ ...editingLocation, email: e.target.value })}
                className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                placeholder="location@example.com"
              />
            </div>

            <div className="bg-white/5 border border-white/10 p-4 mt-4">
              <p className="text-white/60 text-xs">
                Note: Location address and other settings can only be changed by an administrator. Contact support if you need to update these details.
              </p>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

