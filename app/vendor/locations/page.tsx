'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Edit2, Receipt } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import axios from 'axios';

interface TaxConfig {
  state?: string;
  sales_tax_rate?: number;
  enabled?: boolean;
  taxes?: Array<{
    name: string;
    rate: number;
    type: string;
    status: string;
  }>;
}

interface Location {
  id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  settings?: {
    tax_config?: TaxConfig;
  };
}

export default function LocationsPage() {
  const { vendor } = useAppAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-12">
        <h1 className="text-white/70 text-2xl tracking-tight mb-1 font-light">
          Locations
        </h1>
        <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] font-light">
          {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <MapPin size={48} className="text-white/20 mb-4" strokeWidth={1} />
          <div className="text-white/40 text-sm mb-2">No locations found</div>
          <div className="text-white/30 text-xs">Add locations in your vendor settings</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-[#0a0a0a] border border-white/[0.04] rounded-3xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <MapPin size={18} className="text-white/40" strokeWidth={1.5} />
                </div>
              </div>

              <h3 className="text-white/80 text-lg font-light tracking-tight mb-3">
                {loc.name}
              </h3>

              <div className="space-y-1 mb-4 text-xs">
                {loc.address_line1 && (
                  <div className="text-white/50 font-light">{loc.address_line1}</div>
                )}
                {loc.address_line2 && (
                  <div className="text-white/50 font-light">{loc.address_line2}</div>
                )}
                {loc.city && loc.state && (
                  <div className="text-white/50 font-light">
                    {loc.city}, {loc.state} {loc.zip || ''}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-white/30" strokeWidth={1.5} />
                  <span className="text-white/40 text-[11px] font-light">
                    {loc.phone || 'No phone'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-white/30" strokeWidth={1.5} />
                  <span className="text-white/40 text-[11px] font-light truncate">
                    {loc.email || 'No email'}
                  </span>
                </div>
              </div>

              {/* Tax Configuration */}
              {loc.settings?.tax_config && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt size={12} className="text-white/30" strokeWidth={1.5} />
                    <span className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-light">
                      Tax Configuration
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[11px] font-light">Total Tax Rate</span>
                      <span className="text-white/70 text-sm font-medium">
                        {((loc.settings.tax_config.sales_tax_rate || 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                    {loc.settings.tax_config.taxes && loc.settings.tax_config.taxes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {loc.settings.tax_config.taxes.map((tax, idx) => (
                          <div key={idx} className="flex items-center justify-between pl-3">
                            <span className="text-white/40 text-[10px] font-light">
                              {tax.name}
                            </span>
                            <span className="text-white/50 text-[10px] font-light">
                              {tax.rate.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
