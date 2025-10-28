"use client";

import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppAuth } from '@/context/AppAuthContext';

export default function VendorSettings() {
  const { vendor } = useAppAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    taxId: '',
    siteHidden: false,
  });

  // Fetch real vendor settings from database
  const fetchSettings = async () => {
    try {
      setFetching(true);
      
      const vendorId = vendor?.id;
      if (!vendorId) {
        setError('Not authenticated');
        setFetching(false);
        return;
      }

      // Get vendor data from Supabase
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();
      
      if (error) {
        console.error('Failed to fetch vendor:', error);
        setError('Failed to load settings. Please refresh the page.');
      } else if (vendor) {
        setSettings({
          companyName: vendor.store_name || '',
          contactName: vendor.contact_name || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          zip: vendor.zip || '',
          taxId: vendor.tax_id || '',
          siteHidden: vendor.site_hidden || false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch vendor settings:', err);
      setError('Failed to load settings. Please refresh the page.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const vendorId = vendor?.id;
      if (!vendorId) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Update vendor in Supabase
      const { error } = await supabase
        .from('vendors')
        .update({
          store_name: settings.companyName,
          contact_name: settings.contactName,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zip: settings.zip,
          tax_id: settings.taxId,
          site_hidden: settings.siteHidden,
        })
        .eq('id', vendorId);

      if (error) {
        console.error('Failed to update vendor:', error);
        setError('Failed to save settings. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto animate-fadeIn flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-white/60">
          <Loader size={20} className="animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
          Vendor Settings
        </h1>
        <p className="text-white/40 text-xs font-light tracking-wide">
          PROFILE & CONTACT INFORMATION
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 mx-4 lg:mx-0 mb-6">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-500 font-medium mb-1">Settings Saved Successfully!</p>
            <p className="text-green-500/80 text-sm">Your changes have been saved to the database.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 mx-4 lg:mx-0 mb-6">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-500 font-medium mb-1">Failed to Save</p>
            <p className="text-red-500/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-0 lg:space-y-6">
        {/* Company Information */}
        <div className="bg-black lg:border border-t border-white/5 lg:p-6">
          <h2 className="text-white font-medium px-4 lg:px-0 py-4 lg:py-0 lg:mb-6 text-sm lg:text-base uppercase lg:normal-case tracking-wider lg:tracking-normal opacity-60 lg:opacity-100">Company Information</h2>
          
          {/* iOS-style list on mobile, form on desktop */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-4 divide-y lg:divide-y-0 divide-white/5 border-t lg:border-t-0 border-white/5">
            <div className="lg:col-span-2 px-4 lg:px-0 py-3 lg:py-0 lg:mb-4">
              <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                placeholder="Your Company LLC"
                className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
              />
            </div>

            <div className="px-4 lg:px-0 py-3 lg:py-0 lg:mb-4">
              <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={settings.contactName}
                onChange={(e) => setSettings({...settings, contactName: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
              />
            </div>

            <div className="px-4 lg:px-0 py-3 lg:py-0 lg:mb-4">
              <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                placeholder="contact@company.com"
                className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
              />
            </div>

            <div className="lg:col-span-2 px-4 lg:px-0 py-3 lg:py-0 lg:mb-4">
              <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                placeholder="(555) 123-4567"
                className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
              />
            </div>

            <div className="lg:col-span-2 px-4 lg:px-0 py-3 lg:py-0 lg:mb-0">
              <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                Tax ID / EIN
              </label>
              <input
                type="text"
                value={settings.taxId}
                onChange={(e) => setSettings({...settings, taxId: e.target.value})}
                placeholder="XX-XXXXXXX"
                className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-black lg:border border-t border-white/5 lg:p-6 mt-0 lg:mt-6">
          <h2 className="text-white font-medium px-4 lg:px-0 py-4 lg:py-0 lg:mb-6 text-sm lg:text-base uppercase lg:normal-case tracking-wider lg:tracking-normal opacity-60 lg:opacity-100">Business Address</h2>
          
          <div className="lg:space-y-4 divide-y lg:divide-y-0 divide-white/5 border-t lg:border-t-0 border-white/5">
            <div className="px-4 lg:px-0 py-3 lg:py-0 lg:mb-4">
              <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                placeholder="123 Main St"
                className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
              />
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:gap-4 divide-y lg:divide-y-0 divide-white/5">
              <div className="px-4 lg:px-0 py-3 lg:py-0 lg:mb-0">
                <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({...settings, city: e.target.value})}
                  placeholder="Charlotte"
                  className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
                />
              </div>

              <div className="px-4 lg:px-0 py-3 lg:py-0 lg:mb-0">
                <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => setSettings({...settings, state: e.target.value})}
                  placeholder="NC"
                  className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
                />
              </div>

              <div className="px-4 lg:px-0 py-3 lg:py-0 lg:mb-0">
                <label className="block text-white/60 lg:text-white/80 text-xs lg:text-sm mb-2 lg:mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={settings.zip}
                  onChange={(e) => setSettings({...settings, zip: e.target.value})}
                  placeholder="28202"
                  className="w-full bg-transparent lg:bg-black border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Storefront Visibility */}
        <div className="bg-black lg:border border-t border-white/5 lg:p-6 mt-0 lg:mt-6">
          <h2 className="text-white font-medium px-4 lg:px-0 py-4 lg:py-0 lg:mb-6 text-sm lg:text-base uppercase lg:normal-case tracking-wider lg:tracking-normal opacity-60 lg:opacity-100">Storefront Visibility</h2>
          
          <div className="px-4 lg:px-0 py-4 lg:py-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-white font-medium mb-1">Hide Storefront</label>
                <p className="text-white/60 text-xs lg:text-sm">
                  When enabled, your storefront will show a coming soon page instead of products
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({...settings, siteHidden: !settings.siteHidden})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.siteHidden ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                    settings.siteHidden ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end px-4 lg:px-0 py-6 lg:py-0 border-t lg:border-t-0 border-white/5 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="group flex items-center justify-center gap-2 w-full lg:w-auto px-6 py-3 bg-black text-white border border-white/20 active:bg-white active:text-black lg:hover:bg-white lg:hover:text-black lg:hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
          >
            <Save size={18} className="group-hover:scale-110 transition-transform duration-300" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

