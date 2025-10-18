"use client";

import { useState } from 'react';
import { Upload, X, Save } from 'lucide-react';

export default function VendorBranding() {
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string>('/logoprint.png');
  const [banner, setBanner] = useState<string>('');
  
  const [branding, setBranding] = useState({
    companyName: 'Premium Cannabis Co.',
    storeName: 'Premium Cannabis',
    tagline: 'Quality Cannabis, Delivered Fresh',
    about: 'We are a family-owned cannabis farm dedicated to producing the highest quality flower and concentrates. Our products are grown with care, tested rigorously, and delivered fresh.',
    primaryColor: '#22c55e',
    accentColor: '#10b981',
    website: 'https://premiumcannabis.com',
    instagram: '@premiumcannabis',
    customPolicies: 'All products are lab tested and come with certificates of analysis. We stand behind our quality with a satisfaction guarantee.',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Submit to API
    console.log('Saving branding:', branding, logo, banner);
    
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Vendor Branding
        </h1>
        <p className="text-white/60 text-sm">
          Customize your storefront appearance while maintaining Flora Distro's design standards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Visual Assets */}
            <div className="bg-[#2a2a2a] border border-white/10 rounded p-6">
              <h2 className="text-white font-medium mb-6">Visual Assets</h2>
              
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-white/80 text-sm mb-3">
                    Store Logo (Square, 500×500px recommended)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-white/5 rounded border border-white/10 flex items-center justify-center overflow-hidden">
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Upload size={32} className="text-white/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <div className="border-2 border-dashed border-white/20 rounded p-4 text-center hover:border-white/40 transition-colors cursor-pointer">
                          <Upload size={24} className="text-white/40 mx-auto mb-2" />
                          <div className="text-white/80 text-sm">Upload Logo</div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-white/80 text-sm mb-3">
                    Store Banner (1920×400px recommended)
                  </label>
                  <div className="space-y-3">
                    {banner && (
                      <div className="relative aspect-[19/4] bg-white/5 rounded overflow-hidden group">
                        <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBanner('')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                    <label className="block">
                      <div className="border-2 border-dashed border-white/20 rounded p-8 text-center hover:border-white/40 transition-colors cursor-pointer">
                        <Upload size={32} className="text-white/40 mx-auto mb-3" />
                        <div className="text-white/80 text-sm mb-1">Upload Banner Image</div>
                        <div className="text-white/40 text-xs">Wide banner for your storefront header</div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Information */}
            <div className="bg-[#2a2a2a] border border-white/10 rounded p-6">
              <h2 className="text-white font-medium mb-6">Store Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={branding.companyName}
                      onChange={(e) => setBranding({...branding, companyName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Store Display Name
                    </label>
                    <input
                      type="text"
                      value={branding.storeName}
                      onChange={(e) => setBranding({...branding, storeName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={branding.tagline}
                    onChange={(e) => setBranding({...branding, tagline: e.target.value})}
                    placeholder="Short description of your brand"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    About Your Store
                  </label>
                  <textarea
                    rows={4}
                    value={branding.about}
                    onChange={(e) => setBranding({...branding, about: e.target.value})}
                    placeholder="Tell customers about your brand, farming practices, values..."
                    maxLength={5000}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded focus:outline-none focus:border-white/20 resize-none"
                  />
                  <div className="text-white/40 text-xs mt-1">
                    {branding.about.length} / 5000 characters
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-[#2a2a2a] border border-white/10 rounded p-6">
              <h2 className="text-white font-medium mb-6">Brand Colors</h2>
              <p className="text-white/60 text-sm mb-4">
                Choose colors that represent your brand. These will be used in your storefront accents.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                      className="w-16 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-white/20 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({...branding, accentColor: e.target.value})}
                      className="w-16 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({...branding, accentColor: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-white/20 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[#2a2a2a] border border-white/10 rounded p-6">
              <h2 className="text-white font-medium mb-6">Social & Links</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={branding.website}
                    onChange={(e) => setBranding({...branding, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={branding.instagram}
                    onChange={(e) => setBranding({...branding, instagram: e.target.value})}
                    placeholder="@yourbrand"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Store Policies */}
            <div className="bg-[#2a2a2a] border border-white/10 rounded p-6">
              <h2 className="text-white font-medium mb-6">Store Policies</h2>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Custom Shipping & Return Policy
                </label>
                <textarea
                  rows={4}
                  value={branding.customPolicies}
                  onChange={(e) => setBranding({...branding, customPolicies: e.target.value})}
                  placeholder="Enter your store's policies..."
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded focus:outline-none focus:border-white/20 resize-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-white/90 text-sm font-medium uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Branding'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview - 1/3 width */}
        <div className="space-y-6">
          {/* Storefront Preview */}
          <div className="bg-[#2a2a2a] border border-white/10 rounded overflow-hidden">
            <div className="border-b border-white/10 p-4">
              <h3 className="text-white text-sm font-medium">Storefront Preview</h3>
            </div>
            
            {/* Preview Content */}
            <div className="bg-[#1a1a1a]">
              {/* Banner */}
              {banner ? (
                <div className="aspect-[19/4] bg-white/5 overflow-hidden">
                  <img src={banner} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[19/4] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
                  <div className="text-white/40 text-xs">No banner uploaded</div>
                </div>
              )}

              {/* Store Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full overflow-hidden border-2 border-white/10 flex items-center justify-center">
                    <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  </div>
                  <div>
                    <h2 className="text-white font-medium text-lg">{branding.storeName}</h2>
                    <p className="text-white/60 text-xs">{branding.tagline}</p>
                  </div>
                </div>
                
                {/* Color Preview */}
                <div className="flex gap-2 mb-3">
                  <div 
                    className="w-12 h-12 rounded border border-white/10"
                    style={{ backgroundColor: branding.primaryColor }}
                  />
                  <div 
                    className="w-12 h-12 rounded border border-white/10"
                    style={{ backgroundColor: branding.accentColor }}
                  />
                </div>

                {/* About Preview */}
                <p className="text-white/70 text-xs leading-relaxed line-clamp-3">
                  {branding.about}
                </p>

                {/* Social Links Preview */}
                {(branding.website || branding.instagram) && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex gap-3 text-xs">
                    {branding.website && (
                      <a href={branding.website} className="text-white/60 hover:text-white transition-colors">
                        Website
                      </a>
                    )}
                    {branding.instagram && (
                      <span className="text-white/60">{branding.instagram}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Sample Product Card with Brand Colors */}
              <div className="p-4">
                <div className="text-white/60 text-xs mb-3 uppercase tracking-wider">Products</div>
                <div 
                  className="bg-white/5 border rounded p-4"
                  style={{ borderColor: branding.primaryColor + '40' }}
                >
                  <div className="aspect-square bg-white/5 rounded mb-3"></div>
                  <div className="text-white text-sm font-medium mb-1">Sample Product</div>
                  <div className="text-white/60 text-xs mb-2">$14.99</div>
                  <button 
                    className="w-full text-sm py-2 rounded transition-colors"
                    style={{ 
                      backgroundColor: branding.primaryColor,
                      color: '#000'
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
            <h3 className="text-blue-500 text-sm font-medium mb-2">Branding Tips</h3>
            <ul className="text-white/60 text-xs space-y-2">
              <li>• Use high-quality square logo (transparent PNG works best)</li>
              <li>• Banner should be landscape, showcasing your brand</li>
              <li>• Choose colors with good contrast against dark backgrounds</li>
              <li>• Keep your about section concise and engaging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

