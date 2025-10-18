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
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Vendor Settings
        </h1>
        <p className="text-white/60 text-sm">
          Manage your vendor profile and contact information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <h2 className="text-white font-medium mb-6">Company Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                placeholder="Your Company LLC"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={settings.contactName}
                onChange={(e) => setSettings({...settings, contactName: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                placeholder="contact@company.com"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                placeholder="(555) 123-4567"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Tax ID / EIN
              </label>
              <input
                type="text"
                value={settings.taxId}
                onChange={(e) => setSettings({...settings, taxId: e.target.value})}
                placeholder="XX-XXXXXXX"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <h2 className="text-white font-medium mb-6">Business Address</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                placeholder="123 Main St"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({...settings, city: e.target.value})}
                  placeholder="Charlotte"
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => setSettings({...settings, state: e.target.value})}
                  placeholder="NC"
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={settings.zip}
                  onChange={(e) => setSettings({...settings, zip: e.target.value})}
                  placeholder="28202"
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="group flex items-center gap-2 px-6 py-3 bg-white text-black border border-white hover:bg-black hover:text-white hover:border-white/20 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
          >
            <Save size={18} className="group-hover:scale-110 transition-transform duration-300" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

