"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Store, Package, DollarSign, ArrowLeft, Save } from "lucide-react";

interface Vendor {
  id: string;
  store_name: string;
  email: string;
  vendor_type: 'standard' | 'distributor' | 'both';
  wholesale_enabled: boolean;
  minimum_order_amount: number;
  distributor_terms?: string;
  distributor_license_number?: string;
  distributor_license_expiry?: string;
}

export default function VendorWholesaleSettings() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [vendorType, setVendorType] = useState<'standard' | 'distributor' | 'both'>('standard');
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);
  const [minimumOrder, setMinimumOrder] = useState(0);
  const [terms, setTerms] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  async function loadVendor() {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/admin/vendors/${vendorId}`);
      
      setVendor(data.vendor);
      setVendorType(data.vendor.vendor_type || 'standard');
      setWholesaleEnabled(data.vendor.wholesale_enabled || false);
      setMinimumOrder(data.vendor.minimum_order_amount || 0);
      setTerms(data.vendor.distributor_terms || '');
      setLicenseNumber(data.vendor.distributor_license_number || '');
      setLicenseExpiry(data.vendor.distributor_license_expiry || '');
    } catch (error) {
      console.error('Load vendor error:', error);
      alert('Failed to load vendor');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      
      await axios.put(`/api/admin/vendors/${vendorId}/wholesale`, {
        vendor_type: vendorType,
        wholesale_enabled: wholesaleEnabled,
        minimum_order_amount: minimumOrder,
        distributor_terms: terms,
        distributor_license_number: licenseNumber,
        distributor_license_expiry: licenseExpiry || null
      });

      alert('Wholesale settings saved successfully!');
      loadVendor();
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Failed to save settings: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading vendor...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-white/60">Vendor not found</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 mb-4 transition-all duration-300 text-xs font-light uppercase tracking-wider"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Partners
        </button>
        
        <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
          Wholesale Settings
        </h1>
        <p className="text-white/40 text-xs font-light tracking-wide">
          {vendor.store_name.toUpperCase()} • {vendor.email}
        </p>
      </div>

        {/* Current Status */}
        <div className="minimal-glass subtle-glow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Current Status</h3>
              <p className="text-white/60 text-xs font-light">
                Type: <span className="text-white/90 font-light">{vendor.vendor_type || 'standard'}</span>
              </p>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-light tracking-wide ${
              vendor.wholesale_enabled 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-white/5 text-white/40 border border-white/10'
            }`}>
              <Store size={14} strokeWidth={1.5} />
              {vendor.wholesale_enabled ? 'Wholesale Active' : 'Retail Only'}
            </div>
          </div>
        </div>

        {/* Vendor Type Selection */}
        <div className="minimal-glass subtle-glow p-6 mb-6">
          <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-6">Vendor Type</h3>
          
          <div className="space-y-3">
            <label className="flex items-start gap-4 p-5 bg-black/20 border border-white/10 cursor-pointer hover:bg-white/[0.03] hover:border-white/20 transition-all duration-300">
              <input
                type="radio"
                name="vendorType"
                value="standard"
                checked={vendorType === 'standard'}
                onChange={(e) => setVendorType(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-white/90 text-sm font-light mb-1">Standard (Retail Only)</div>
                <p className="text-xs text-white/40 font-light">
                  Sells products directly to consumers. No wholesale capabilities.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-5 bg-black/20 border border-white/10 cursor-pointer hover:bg-white/[0.03] hover:border-white/20 transition-all duration-300">
              <input
                type="radio"
                name="vendorType"
                value="distributor"
                checked={vendorType === 'distributor'}
                onChange={(e) => setVendorType(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-white/90 text-sm font-light mb-1">Distributor (Wholesale Only)</div>
                <p className="text-xs text-white/40 font-light">
                  Only sells to vendors and wholesale-approved customers. Products hidden from regular consumers.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-5 bg-black/20 border border-green-500/20 cursor-pointer hover:bg-white/[0.03] hover:border-green-500/30 transition-all duration-300">
              <input
                type="radio"
                name="vendorType"
                value="both"
                checked={vendorType === 'both'}
                onChange={(e) => setVendorType(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-white/90 text-sm font-light mb-1 flex items-center gap-2">
                  Both (Retail + Wholesale)
                  <span className="text-[10px] text-green-400 border border-green-500/30 px-2 py-0.5 tracking-wider">RECOMMENDED</span>
                </div>
                <p className="text-xs text-white/40 font-light mb-3">
                  Operates as both retailer and distributor. Can sell to consumers AND offer wholesale pricing to businesses.
                </p>
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-xs text-green-400/80 font-light">
                  Best for established vendors expanding into B2B sales
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Wholesale Settings */}
        {(vendorType === 'distributor' || vendorType === 'both') && (
          <>
            <div className="minimal-glass subtle-glow p-6 mb-6">
              <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-6">Wholesale Configuration</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wholesaleEnabled}
                      onChange={(e) => setWholesaleEnabled(e.target.checked)}
                      className="rounded bg-white/5 border-white/20"
                    />
                    <span className="text-white/90 text-sm font-light">Enable Wholesale Operations</span>
                  </label>
                  <p className="text-xs text-white/40 font-light ml-6">
                    Products will be visible in the wholesale marketplace
                  </p>
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-light">
                    Minimum Order Amount (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
                    <input
                      type="number"
                      value={minimumOrder}
                      onChange={(e) => setMinimumOrder(parseFloat(e.target.value) || 0)}
                      placeholder="500.00"
                      className="w-full bg-black/20 border border-white/10 px-10 py-3 text-white text-sm font-light placeholder-white/30 focus:outline-none focus:border-white/20 transition-all duration-300"
                      step="0.01"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 font-light mt-1 tracking-wide">
                    MINIMUM TOTAL ORDER VALUE FOR WHOLESALE PURCHASES
                  </p>
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-light">
                    Distributor Terms & Conditions
                  </label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Describe your wholesale terms, payment methods, delivery options, etc."
                    className="w-full bg-black/20 border border-white/10 px-4 py-3 text-white text-sm font-light placeholder-white/30 focus:outline-none focus:border-white/20 transition-all duration-300"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* License Information */}
            <div className="minimal-glass subtle-glow p-6 mb-6">
              <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-6">Distributor License (Optional)</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-light">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g., DIST-12345"
                    className="w-full bg-black/20 border border-white/10 px-4 py-3 text-white text-sm font-light placeholder-white/30 focus:outline-none focus:border-white/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-light">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 px-4 py-3 text-white text-sm font-light focus:outline-none focus:border-white/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* How It Works */}
        {vendorType === 'both' && (
          <div className="minimal-glass subtle-glow p-6 mb-6 border-l-2 border-l-blue-500/40">
            <h3 className="text-blue-400/90 text-[11px] font-light tracking-[0.2em] uppercase mb-4">How Hybrid Mode Works</h3>
            
            <div className="space-y-4 text-xs font-light">
              <div className="flex items-start gap-3 py-3 border-b border-white/5">
                <Package className="text-blue-400/60 flex-shrink-0 mt-0.5" size={14} strokeWidth={1.5} />
                <div className="text-white/60">
                  <span className="text-white/80 font-light">Product Flexibility:</span> Mark individual products as retail, wholesale, or both
                </div>
              </div>
              
              <div className="flex items-start gap-3 py-3 border-b border-white/5">
                <DollarSign className="text-blue-400/60 flex-shrink-0 mt-0.5" size={14} strokeWidth={1.5} />
                <div className="text-white/60">
                  <span className="text-white/80 font-light">Dual Pricing:</span> Different prices for retail customers vs wholesale buyers
                </div>
              </div>
              
              <div className="flex items-start gap-3 py-3">
                <Store className="text-blue-400/60 flex-shrink-0 mt-0.5" size={14} strokeWidth={1.5} />
                <div className="text-white/60">
                  <span className="text-white/80 font-light">Visibility:</span> Retail on main marketplace, wholesale in /wholesale section
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/30 text-xs font-light tracking-wider uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Save size={14} strokeWidth={1.5} />
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
        
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-xs font-light tracking-wider uppercase"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

