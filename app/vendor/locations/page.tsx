'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Star, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import axios from 'axios';

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
}

export default function LocationsPage() {
  const { vendor } = useAppAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (vendor?.id) {
      loadLocations();
    }
  }, [vendor?.id]);

  async function loadLocations() {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const res = await axios.get('/api/vendor/locations', {
        headers: { 'x-vendor-id': vendor.id }
      });

      if (res.data.success) {
        setLocations(res.data.locations || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor?.id || !editingLocation) return;

    try {
      const res = await axios.post('/api/vendor/locations', {
        action: 'update',
        location_id: editingLocation.id,
        phone: editingLocation.phone,
        email: editingLocation.email,
      }, {
        headers: { 'x-vendor-id': vendor.id }
      });

      if (res.data.success) {
        setEditingLocation(null);
        loadLocations();
      }
    } catch (error: any) {
      console.error('Error updating location:', error);
      alert(error.response?.data?.error || 'Failed to update location');
    }
  }

  const getTypeColorClass = (type: string) => {
    switch (type) {
      case 'retail': return 'text-blue-400/60';
      case 'warehouse': return 'text-orange-400/60';
      case 'distribution': return 'text-purple-400/60';
      default: return 'text-cyan-400/60';
    }
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-white/70 text-2xl tracking-tight mb-1 font-light">
            Locations
          </h1>
          <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] font-light">
            {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
          </p>
        </div>

        {/* Locations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-white/40 text-sm tracking-tight">Loading...</div>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-6 shadow-lg shadow-black/20">
              <MapPin size={32} className="text-white/20" strokeWidth={1.5} />
            </div>
            <div className="text-white/40 text-sm mb-2 tracking-tight">
              No locations found
            </div>
            <p className="text-white/20 text-[11px] text-center max-w-md font-light tracking-wide">
              Contact your administrator to add locations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="group bg-[#0a0a0a] border border-white/[0.04] hover:border-white/[0.08] rounded-3xl p-6 transition-all duration-400 shadow-lg shadow-black/30"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <MapPin size={20} className="text-white/40" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-white/80 text-sm font-light tracking-tight">
                          {loc.name}
                        </div>
                        {loc.is_primary && (
                          <Star size={12} className="text-yellow-400/60 fill-yellow-400/60" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className={`${getTypeColorClass(loc.type)} text-[10px] uppercase tracking-[0.15em] font-light`}>
                        {loc.type}
                      </div>
                    </div>
                  </div>

                  {loc.is_active ? (
                    <CheckCircle size={16} className="text-green-400/60" strokeWidth={1.5} />
                  ) : (
                    <XCircle size={16} className="text-white/20" strokeWidth={1.5} />
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1 mb-4 pb-4 border-b border-white/[0.04]">
                  <div className="text-white/50 text-[11px] font-light tracking-tight">
                    {loc.address_line1 || 'Address not set'}
                  </div>
                  {loc.address_line2 && (
                    <div className="text-white/50 text-[11px] font-light tracking-tight">
                      {loc.address_line2}
                    </div>
                  )}
                  {loc.city && loc.state && (
                    <div className="text-white/50 text-[11px] font-light tracking-tight">
                      {loc.city}, {loc.state} {loc.zip || ''}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-white/30" strokeWidth={1.5} />
                    <span className="text-white/40 text-[11px] font-light tracking-tight">
                      {loc.phone || 'No phone'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-white/30" strokeWidth={1.5} />
                    <span className="text-white/40 text-[11px] font-light tracking-tight truncate">
                      {loc.email || 'No email'}
                    </span>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setEditingLocation(loc)}
                  className="w-full px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.08] rounded-xl text-white/50 hover:text-white/70 text-[9px] uppercase tracking-[0.15em] font-light transition-all duration-400 flex items-center justify-center gap-2"
                >
                  <Edit2 size={10} strokeWidth={1.5} />
                  Edit Contact Info
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Location Modal */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/50">
            <h2 className="text-white/70 text-xl tracking-tight mb-2 font-light">
              Edit Location
            </h2>
            <p className="text-white/40 text-[11px] tracking-tight mb-6 font-light">
              {editingLocation.name}
            </p>

            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editingLocation.phone || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, phone: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all duration-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  Email
                </label>
                <input
                  type="email"
                  value={editingLocation.email || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, email: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all duration-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="flex-1 px-6 py-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.08] rounded-xl text-white/50 hover:text-white/70 text-[10px] uppercase tracking-[0.2em] font-light transition-all duration-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-white/60 hover:text-white/80 text-[10px] uppercase tracking-[0.2em] font-light transition-all duration-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
