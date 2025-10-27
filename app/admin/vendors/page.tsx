"use client";

import { useState, useEffect } from 'react';
import { Store, Eye } from 'lucide-react';
import { ComingSoonManager } from '@/components/admin/ComingSoonManager';

interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url: string;
  status: string;
  coming_soon: boolean;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors');
      const data = await res.json();
      if (data.success) {
        setVendors(data.vendors);
        if (data.vendors.length > 0) {
          setSelectedVendor(data.vendors[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
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
            Vendor Management
          </h1>
          <p className="text-white/60 leading-relaxed">
            Manage vendor storefronts and coming soon pages
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vendor List */}
          <div className="lg:col-span-1 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white/40 mb-6 flex items-center gap-2">
              <Store size={16} />
              Vendors
            </h3>
            
            <div className="space-y-2">
              {vendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                    selectedVendor?.id === vendor.id
                      ? 'bg-white border-white/10'
                      : 'bg-black border border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {vendor.logo_url && (
                      <img
                        src={vendor.logo_url}
                        alt={vendor.store_name}
                        className="w-12 h-12 object-contain rounded-xl"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-black text-sm truncate uppercase tracking-tight ${
                        selectedVendor?.id === vendor.id ? 'text-black' : 'text-white'
                      }`} style={{ fontWeight: 900 }}>
                        {vendor.store_name}
                      </div>
                      <div className={`text-xs ${
                        selectedVendor?.id === vendor.id ? 'text-black/60' : 'text-white/40'
                      }`}>
                        @{vendor.slug}
                      </div>
                    </div>
                    {vendor.coming_soon && (
                      <div className="bg-white rounded-lg px-3 py-1.5">
                        <span className="text-black text-[10px] font-black uppercase tracking-wider">
                          Soon
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vendor Details */}
          <div className="lg:col-span-2">
            {selectedVendor ? (
              <div className="space-y-6">
                {/* Vendor Header */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
                  <div className="flex items-center gap-6 mb-6">
                    {selectedVendor.logo_url && (
                      <img
                        src={selectedVendor.logo_url}
                        alt={selectedVendor.store_name}
                        className="w-20 h-20 object-contain rounded-2xl"
                      />
                    )}
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2" style={{ fontWeight: 900 }}>
                        {selectedVendor.store_name}
                      </h2>
                      <p className="text-white/60">@{selectedVendor.slug}</p>
                    </div>
                  </div>
                  
                  <a
                    href={`/storefront?vendor=${selectedVendor.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-black px-6 py-3 rounded-2xl font-black uppercase tracking-tight transition-all duration-300 hover:scale-[1.02]"
                    style={{ fontWeight: 900 }}
                  >
                    <Eye size={18} />
                    View Storefront
                  </a>
                </div>

                {/* Coming Soon Manager */}
                <ComingSoonManager
                  vendorId={selectedVendor.id}
                  vendorName={selectedVendor.store_name}
                />
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center">
                <Store size={64} className="mx-auto mb-6 text-white/10" />
                <p className="text-white/60 font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                  Select a vendor to manage
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
