"use client";

import { useState } from 'react';
import { Settings, Save, Globe, DollarSign, Package, Users, Mail, Bell } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Yacht Club Marketplace',
    siteUrl: 'https://yachtclub.com',
    currency: 'USD',
    taxRate: '10',
    commissionRate: '15',
    minOrderAmount: '10',
    emailNotifications: true,
    orderNotifications: true,
    vendorNotifications: true,
    autoApproveProducts: false,
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl text-white font-light tracking-tight mb-2">
            Settings
          </h1>
          <p className="text-white/50 text-sm">
            Configure marketplace settings and preferences
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-white text-black px-5 py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all"
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6">
        {/* General Settings */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe size={20} className="text-white/50" />
            <h2 className="text-white font-medium text-lg">General Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Site URL
              </label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign size={20} className="text-white/50" />
            <h2 className="text-white font-medium text-lg">Financial Settings</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Vendor Commission (%)
              </label>
              <input
                type="number"
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Minimum Order Amount ($)
              </label>
              <input
                type="number"
                value={settings.minOrderAmount}
                onChange={(e) => setSettings({ ...settings, minOrderAmount: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Product Settings */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package size={20} className="text-white/50" />
            <h2 className="text-white font-medium text-lg">Product Settings</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoApproveProducts}
                onChange={(e) => setSettings({ ...settings, autoApproveProducts: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <div className="text-white text-sm">Auto-approve new products</div>
                <div className="text-white/40 text-xs">Products will go live immediately without review</div>
              </div>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={20} className="text-white/50" />
            <h2 className="text-white font-medium text-lg">Notification Settings</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <div className="text-white text-sm">Email notifications</div>
                <div className="text-white/40 text-xs">Receive email updates about marketplace activity</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.orderNotifications}
                onChange={(e) => setSettings({ ...settings, orderNotifications: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <div className="text-white text-sm">Order notifications</div>
                <div className="text-white/40 text-xs">Get notified when new orders are placed</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vendorNotifications}
                onChange={(e) => setSettings({ ...settings, vendorNotifications: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <div className="text-white text-sm">Vendor notifications</div>
                <div className="text-white/40 text-xs">Updates about vendor registrations and activities</div>
              </div>
            </label>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-[#111111] border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail size={20} className="text-white/50" />
            <h2 className="text-white font-medium text-lg">Email Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                From Email
              </label>
              <input
                type="email"
                placeholder="noreply@yachtclub.com"
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                From Name
              </label>
              <input
                type="text"
                placeholder="Yacht Club Marketplace"
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="mt-6">
        <button 
          onClick={handleSave}
          className="w-full bg-white text-black px-6 py-4 text-sm font-medium uppercase tracking-wider hover:bg-white/90 transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <Save size={16} />
            Save All Settings
          </div>
        </button>
      </div>
    </div>
  );
}
