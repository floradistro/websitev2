"use client";

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function VendorSettings() {
  const [loading, setLoading] = useState(false);
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
  });

  // TODO: Fetch real vendor settings from API on mount
  // useEffect(() => {
  //   fetchVendorSettings();
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Submit to API
    console.log('Saving settings:', settings);
    
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
          Vendor Settings
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Manage your vendor profile and contact information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0 lg:space-y-6">
        {/* Company Information */}
        <div className="bg-[#1a1a1a] lg:border border-t border-white/5 lg:p-6">
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
                className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
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
                className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
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
                className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
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
                className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
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
                className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-[#1a1a1a] lg:border border-t border-white/5 lg:p-6 mt-0 lg:mt-6">
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
                className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
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
                  className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
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
                  className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
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
                  className="w-full bg-transparent lg:bg-[#1a1a1a] border-0 lg:border border-white/5 text-white placeholder-white/40 px-0 lg:px-4 py-0 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-base lg:text-sm"
                />
              </div>
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

