"use client";

import { useState, useEffect } from 'react';
import { Upload, Save, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';

export default function VendorBranding() {
  const { vendor } = useVendorAuth();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  
  const [branding, setBranding] = useState({
    tagline: '',
    about: '',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#666666',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    website: '',
    instagram: '',
    facebook: '',
    customFont: 'Inter'
  });

  const fontOptions = [
    'Inter',
    'Playfair Display',
    'Montserrat',
    'Lato',
    'Roboto',
    'Open Sans',
    'Poppins',
    'Raleway',
    'Merriweather',
    'Crimson Text'
  ];

  useEffect(() => {
    if (vendor) {
      loadBranding();
    }
  }, [vendor]);

  const loadBranding = async () => {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const response = await fetch('/api/supabase/vendor/branding', {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.branding;
        
        // Parse brand_colors if it's a JSON string
        let brandColors = { 
          primary: '#000000', 
          secondary: '#FFFFFF',
          accent: '#666666',
          background: '#FFFFFF',
          text: '#1A1A1A'
        };
        if (data.brand_colors) {
          try {
            brandColors = typeof data.brand_colors === 'string' 
              ? JSON.parse(data.brand_colors) 
              : data.brand_colors;
          } catch (e) {
            console.error('Failed to parse brand_colors:', e);
          }
        }
        
        // Parse social_links if it's a JSON string
        let socialLinks = { website: '', instagram: '', facebook: '' };
        if (data.social_links) {
          try {
            socialLinks = typeof data.social_links === 'string' 
              ? JSON.parse(data.social_links) 
              : data.social_links;
          } catch (e) {
            console.error('Failed to parse social_links:', e);
          }
        }
        
        setBranding({
          tagline: data.store_tagline || '',
          about: data.store_description || '',
          primaryColor: brandColors.primary || '#000000',
          secondaryColor: brandColors.secondary || '#FFFFFF',
          accentColor: brandColors.accent || '#666666',
          backgroundColor: brandColors.background || '#FFFFFF',
          textColor: brandColors.text || '#1A1A1A',
          website: socialLinks.website || '',
          instagram: socialLinks.instagram || '',
          facebook: socialLinks.facebook || '',
          customFont: data.custom_font || 'Inter'
        });
        
        // Set logo and banner previews
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
        if (data.banner_url) {
          setBannerPreview(data.banner_url);
        }
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) throw new Error('Not authenticated');

      let logoUrl = '';
      let bannerUrl = '';

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('type', 'logo');

        const uploadResponse = await fetch(
          '/api/supabase/vendor/upload',
          {
            method: 'POST',
            headers: { 'x-vendor-id': vendorId },
            body: formData
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Logo upload failed');
        }

        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.file.url;
        setLogoFile(null);
      }

      // Upload banner if changed
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        formData.append('type', 'banner');

        const uploadResponse = await fetch(
          '/api/supabase/vendor/upload',
          {
            method: 'POST',
            headers: { 'x-vendor-id': vendorId },
            body: formData
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Banner upload failed');
        }

        const uploadData = await uploadResponse.json();
        bannerUrl = uploadData.file.url;
        setBannerFile(null);
      }

      // Prepare update data
      const updateData: any = {
        store_tagline: branding.tagline,
        store_description: branding.about,
        brand_colors: JSON.stringify({
          primary: branding.primaryColor,
          secondary: branding.secondaryColor,
          accent: branding.accentColor,
          background: branding.backgroundColor,
          text: branding.textColor
        }),
        social_links: JSON.stringify({
          website: branding.website,
          instagram: branding.instagram,
          facebook: branding.facebook
        }),
        custom_font: branding.customFont
      };

      // Add URLs if uploaded
      if (logoUrl) {
        updateData.logo_url = logoUrl;
      }
      if (bannerUrl) {
        updateData.banner_url = bannerUrl;
      }

      // Submit branding via Supabase API
      const response = await fetch('/api/supabase/vendor/branding', {
        method: 'PUT',
        headers: { 
          'x-vendor-id': vendorId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Save failed');
      }
      
      setSuccess('✅ Branding updated successfully!');
      await loadBranding();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('❌ ' + (err.message || 'Failed to update branding'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light mb-2">Brand Settings</h1>
          <p className="text-white/50 text-sm">Customize your brand identity and storefront appearance</p>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="bg-[#1a1a1a] border border-white/5 p-6">
              <h2 className="text-white font-medium mb-4">Brand Logo</h2>
              
              <div className="space-y-4">
                {logoPreview && (
                  <div className="relative w-32 h-32 bg-white/5 border border-white/10 rounded overflow-hidden">
                    <img src={logoPreview} alt="Brand Logo" className="w-full h-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('');
                        setLogoFile(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-white/10 p-6 text-center hover:border-white/20 transition-colors bg-[#0a0a0a]">
                    <Upload size={24} className="text-white/40 mx-auto mb-2" />
                    <div className="text-white/80 text-sm">Upload Brand Logo</div>
                    <div className="text-white/40 text-xs mt-1">PNG, JPG, WEBP • Max 10MB</div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Hero Banner */}
            <div className="bg-[#1a1a1a] border border-white/5 p-6">
              <h2 className="text-white font-medium mb-4">Hero Banner</h2>
              
              <div className="space-y-4">
                {bannerPreview && (
                  <div className="relative w-full h-48 bg-white/5 border border-white/10 rounded overflow-hidden">
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerPreview('');
                        setBannerFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-white/10 p-6 text-center hover:border-white/20 transition-colors bg-[#0a0a0a]">
                    <Upload size={24} className="text-white/40 mx-auto mb-2" />
                    <div className="text-white/80 text-sm">Upload Hero Banner</div>
                    <div className="text-white/40 text-xs mt-1">1920x600px recommended • Max 10MB</div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Store Information */}
            <div className="bg-[#1a1a1a] border border-white/5 p-6">
              <h2 className="text-white font-medium mb-4">Store Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Tagline</label>
                  <input
                    type="text"
                    value={branding.tagline}
                    onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                    placeholder="Your brand's tagline"
                    className="w-full bg-[#0a0a0a] border border-white/5 text-white px-4 py-2 focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">About Your Brand</label>
                  <textarea
                    value={branding.about}
                    onChange={(e) => setBranding({ ...branding, about: e.target.value })}
                    placeholder="Tell customers about your brand..."
                    rows={4}
                    className="w-full bg-[#0a0a0a] border border-white/5 text-white px-4 py-2 focus:outline-none focus:border-white/20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="bg-[#1a1a1a] border border-white/5 p-6">
              <h2 className="text-white font-medium mb-4">Typography</h2>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">Font Family</label>
                <select
                  value={branding.customFont}
                  onChange={(e) => setBranding({ ...branding, customFont: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/5 text-white px-4 py-2 focus:outline-none focus:border-white/20"
                >
                  {fontOptions.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-[#1a1a1a] border border-white/5 p-6">
              <h2 className="text-white font-medium mb-4">Brand Colors</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-12 h-10 bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="w-12 h-10 bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="w-12 h-10 bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.textColor}
                      onChange={(e) => setBranding({ ...branding, textColor: e.target.value })}
                      className="w-12 h-10 bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.textColor}
                      onChange={(e) => setBranding({ ...branding, textColor: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[#1a1a1a] border border-white/5 p-6">
              <h2 className="text-white font-medium mb-4">Social Media</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Website</label>
                  <input
                    type="url"
                    value={branding.website}
                    onChange={(e) => setBranding({ ...branding, website: e.target.value })}
                    placeholder="https://yourbrand.com"
                    className="w-full bg-[#0a0a0a] border border-white/5 text-white px-4 py-2 focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Instagram</label>
                  <input
                    type="text"
                    value={branding.instagram}
                    onChange={(e) => setBranding({ ...branding, instagram: e.target.value })}
                    placeholder="@yourbrand"
                    className="w-full bg-[#0a0a0a] border border-white/5 text-white px-4 py-2 focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Facebook</label>
                  <input
                    type="text"
                    value={branding.facebook}
                    onChange={(e) => setBranding({ ...branding, facebook: e.target.value })}
                    placeholder="yourbrand"
                    className="w-full bg-[#0a0a0a] border border-white/5 text-white px-4 py-2 focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-black px-6 py-3 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <a
                href={`https://${vendor?.slug || 'preview'}.floradistro.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 transition-colors flex items-center justify-center gap-2"
              >
                Preview Storefront
              </a>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-green-400 text-sm">{success}</div>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-[#1a1a1a] border border-white/5 overflow-hidden">
              <div className="border-b border-white/5 p-4">
                <h3 className="text-white/90 text-xs uppercase tracking-wider">Storefront Preview</h3>
              </div>
              
              <div className="p-6">
                {/* Brand Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-20 h-20 flex items-center justify-center border-2 overflow-hidden"
                    style={{ borderColor: branding.primaryColor }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-white/20 text-xs">Logo</div>
                    )}
                  </div>
                  <div>
                    <h2 
                      className="text-xl mb-1" 
                      style={{ 
                        color: branding.primaryColor,
                        fontFamily: branding.customFont || 'inherit'
                      }}
                    >
                      {vendor?.store_name || 'Your Brand'}
                    </h2>
                    <p className="text-white/60 text-sm">{branding.tagline || 'Your tagline here'}</p>
                  </div>
                </div>

                {/* About Section */}
                {branding.about && (
                  <div className="mb-6">
                    <h3 className="text-white/80 text-sm mb-2">About</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{branding.about}</p>
                  </div>
                )}

                {/* Social Links */}
                <div className="flex gap-3">
                  {branding.website && (
                    <a 
                      href={branding.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm border transition-colors"
                      style={{ 
                        borderColor: branding.primaryColor,
                        color: branding.primaryColor
                      }}
                    >
                      Website
                    </a>
                  )}
                  {branding.instagram && (
                    <a 
                      href={`https://instagram.com/${branding.instagram.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm border transition-colors"
                      style={{ 
                        borderColor: branding.accentColor,
                        color: branding.accentColor
                      }}
                    >
                      Instagram
                    </a>
                  )}
                  {branding.facebook && (
                    <a 
                      href={`https://facebook.com/${branding.facebook}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm border transition-colors"
                      style={{ 
                        borderColor: branding.accentColor,
                        color: branding.accentColor
                      }}
                    >
                      Facebook
                    </a>
                  )}
                </div>

                {/* Sample Product */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="text-white/60 text-xs mb-3">Sample Product Card</div>
                  <div className="border border-white/5 p-4">
                    <div className="aspect-square bg-white/5 mb-3 flex items-center justify-center">
                      <div className="text-white/20 text-xs">Product Image</div>
                    </div>
                    <h4 className="text-white text-sm mb-1">Sample Product</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">By {vendor?.store_name || 'Your Brand'}</span>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: branding.primaryColor }}
                      >
                        $45.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white/5 border border-white/10 p-4 mt-4">
              <h3 className="text-white/80 text-xs font-medium uppercase tracking-wider mb-3">Branding Tips</h3>
              <ul className="text-white/50 text-xs space-y-2">
                <li>• Use square logo (300x300px minimum)</li>
                <li>• Transparent PNG works best</li>
                <li>• Choose colors with good contrast</li>
                <li>• Your brand appears on all products</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

