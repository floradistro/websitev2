"use client";

import { useState, useEffect } from 'react';
import { Upload, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';

export default function VendorBranding() {
  const { vendor } = useVendorAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logo, setLogo] = useState<string>('');
  const [banner, setBanner] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [branding, setBranding] = useState({
    tagline: '',
    about: '',
    primaryColor: '#0EA5E9',
    accentColor: '#06B6D4',
    website: '',
    instagram: '',
    facebook: '',
    customFont: ''
  });

  // Fetch branding data on mount
  useEffect(() => {
    fetchBranding();
  }, []);

  async function fetchBranding() {
    try {
      setFetching(true);
      const authToken = localStorage.getItem('vendor_auth');
      
      // Use AJAX endpoint (bypasses REST API app password issues)
      const response = await fetch('https://api.floradistro.com/wp-admin/admin-ajax.php?action=vendor_get_branding', {
        headers: {
          'Authorization': `Basic ${authToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          setBranding({
            tagline: data.tagline || '',
            about: data.about || '',
            primaryColor: data.primary_color || '#0EA5E9',
            accentColor: data.accent_color || '#06B6D4',
            website: data.website || '',
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            customFont: data.custom_font || ''
          });
          setLogo(data.logo_url || '');
          setBanner(data.banner_url || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch branding:', err);
    } finally {
      setFetching(false);
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner'): Promise<string> => {
    const authToken = localStorage.getItem('vendor_auth');
    const formData = new FormData();
    
    // Use the appropriate field name for each endpoint
    const fieldName = type === 'logo' ? 'logo' : 'banner';
    formData.append(fieldName, file);

    // Use existing endpoints (already deployed on server)
    const endpoint = type === 'logo' 
      ? 'https://api.floradistro.com/wp-json/flora-vendors/v1/vendors/me/upload/logo'
      : 'https://api.floradistro.com/wp-json/flora-vendors/v1/vendors/me/upload/banner';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to upload ${type}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const authToken = localStorage.getItem('vendor_auth');
      
      // Upload images first if changed
      const updateData: any = {
        tagline: branding.tagline,
        about: branding.about,
        primary_color: branding.primaryColor,
        accent_color: branding.accentColor,
        website: branding.website,
        instagram: branding.instagram,
        facebook: branding.facebook,
        custom_font: branding.customFont
      };

      // Upload logo
      if (logoFile) {
        try {
          const logoUrl = await uploadImage(logoFile, 'logo');
          updateData.logo_url = logoUrl;
          setLogoFile(null);
        } catch (logoErr: any) {
          console.error('Logo upload failed:', logoErr);
          throw new Error('Logo upload failed: ' + logoErr.message);
        }
      }

      // Upload banner (may fail if endpoint doesn't exist yet)
      if (bannerFile) {
        try {
          const bannerUrl = await uploadImage(bannerFile, 'banner');
          updateData.banner_url = bannerUrl;
          setBannerFile(null);
        } catch (bannerErr: any) {
          console.error('Banner upload failed:', bannerErr);
          // Don't fail the whole save if banner upload fails
          setError('Note: Banner upload is not yet available. Other changes saved.');
        }
      }

      // Use AJAX endpoint (bypasses REST API issues)
      const response = await fetch('https://api.floradistro.com/wp-admin/admin-ajax.php?action=vendor_save_branding', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Branding save failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || errorData.code || `Failed (${response.status})`);
      }

      const result = await response.json();
      console.log('Branding save response:', result);
      
      if (result.success) {
        setSuccess('✅ Branding updated successfully!');
        
        // Refresh data
        await fetchBranding();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.data?.message || 'Update failed');
      }
    } catch (err: any) {
      console.error('Branding save error:', err);
      setError('❌ ' + (err.message || 'Failed to update branding. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="lg:max-w-6xl lg:mx-auto animate-fadeIn px-4 lg:px-0 py-6 lg:py-0">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Loading branding settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:max-w-6xl lg:mx-auto animate-fadeIn px-4 lg:px-0 py-6 lg:py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
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
          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-500 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Visual Assets */}
            <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
              <h2 className="text-white font-medium mb-6">Visual Assets</h2>
              
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-white/80 text-sm mb-3">
                    Store Logo (Square, 500×500px recommended)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-[#1a1a1a] border border-white/5 flex items-center justify-center overflow-hidden">
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Upload size={32} className="text-white/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <div className="border-2 border-dashed border-white/10 p-4 text-center hover:border-white/20 transition-colors cursor-pointer bg-[#1a1a1a]">
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
                      <div className="border-2 border-dashed border-white/10 p-8 text-center hover:border-white/20 transition-colors cursor-pointer bg-[#1a1a1a]">
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
            <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
              <h2 className="text-white font-medium mb-6">Store Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Store Name
                  </label>
                  <div className="w-full bg-[#0a0a0a] border border-white/5 text-white/60 px-4 py-3 text-base">
                    {vendor?.store_name || 'Loading...'}
                  </div>
                  <p className="text-white/40 text-xs mt-1">Contact support to change your store name</p>
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
                    maxLength={255}
                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors resize-none text-base"
                  />
                  <div className="text-white/40 text-xs mt-1">
                    {branding.about.length} / 5000 characters
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
              <h2 className="text-white font-medium mb-6">Brand Colors</h2>
              <p className="text-white/60 text-sm mb-4">
                Choose colors that represent your brand. These will be used in your storefront accents.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-white/20 font-mono text-sm min-w-0"
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
                      className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-white/20 font-mono text-sm min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
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
                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={branding.facebook}
                    onChange={(e) => setBranding({...branding, facebook: e.target.value})}
                    placeholder="@yourbrand"
                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end px-4 lg:px-0 -mx-4 lg:mx-0">
              <button
                type="submit"
                disabled={loading}
                className="group flex items-center gap-2 px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
              >
                <Save size={18} className="group-hover:scale-110 transition-transform duration-300" />
                {loading ? 'Saving...' : 'Save Branding'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview - 1/3 width */}
        <div className="space-y-6 hidden lg:block">
          {/* Storefront Preview */}
          <div className="bg-[#1a1a1a] border border-white/5 overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-[#1a1a1a]">
              <h3 className="text-white/90 text-xs uppercase tracking-wider font-light">Storefront Preview</h3>
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
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[#0a0a0a] overflow-hidden border border-white/10 flex items-center justify-center">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-white/30 text-xs text-center p-2">No logo</div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-white text-xl tracking-wide" style={{ fontFamily: 'Lobster' }}>{vendor?.store_name || 'Your Store'}</h2>
                    <p className="text-white/50 text-xs tracking-wide">{branding.tagline || 'Add a tagline'}</p>
                  </div>
                </div>
                
                {/* Color Preview */}
                <div className="flex gap-2 mb-3">
                  <div 
                    className="w-10 h-10 border border-white/10"
                    style={{ backgroundColor: branding.primaryColor }}
                  />
                  <div 
                    className="w-10 h-10 border border-white/10"
                    style={{ backgroundColor: branding.accentColor }}
                  />
                </div>

                {/* About Preview */}
                <p className="text-white/60 text-xs leading-relaxed line-clamp-3">
                  {branding.about}
                </p>

                {/* Social Links Preview */}
                {(branding.website || branding.instagram) && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-3 text-xs">
                    {branding.website && (
                      <a href={branding.website} className="text-white/50 hover:text-white transition-colors uppercase tracking-wider">
                        Website
                      </a>
                    )}
                    {branding.instagram && (
                      <span className="text-white/50 tracking-wide">{branding.instagram}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Sample Product Card with Brand Colors */}
              <div className="p-4">
                <div className="text-white/50 text-xs mb-3 uppercase tracking-[0.15em]">Products</div>
                <div 
                  className="bg-[#0a0a0a] border p-4"
                  style={{ borderColor: branding.primaryColor + '20' }}
                >
                  <div className="aspect-square bg-[#000000] mb-3"></div>
                  <div className="text-white text-xs font-light uppercase tracking-wider mb-1">Sample Product</div>
                  <div className="text-white/60 text-xs mb-2">$14.99</div>
                  <button 
                    className="w-full text-xs py-2 uppercase tracking-wider font-medium transition-all hover:opacity-90"
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
          <div className="bg-white/5 border border-white/10 p-4">
            <h3 className="text-white/80 text-xs font-medium uppercase tracking-wider mb-3">Branding Tips</h3>
            <ul className="text-white/50 text-xs space-y-2 leading-relaxed">
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

