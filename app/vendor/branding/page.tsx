"use client";

import { useState, useEffect } from 'react';
import { Upload, Save, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { saveBranding } from './save-branding-action';

export default function VendorBranding() {
  const { vendor } = useVendorAuth();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const authToken = localStorage.getItem('vendor_auth');
      if (!authToken) return;

      const response = await fetch('https://api.floradistro.com/wp-json/flora-vendors/v1/vendors/me/branding', {
        headers: { 'Authorization': `Basic ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        
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
        
        // Use WordPress Media Library sizes (medium for preview)
        if (data.logo?.sizes?.medium?.url) {
          setLogoPreview(data.logo.sizes.medium.url);
        } else if (data.logo?.url) {
          setLogoPreview(data.logo.url);
        } else if (data.logo_url) {
          setLogoPreview(data.logo_url);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const authToken = localStorage.getItem('vendor_auth');
      if (!authToken) throw new Error('Not authenticated');

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

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const uploadResponse = await fetch(
          'https://api.floradistro.com/wp-json/flora-vendors/v1/vendors/me/upload/logo',
          {
            method: 'POST',
            headers: { 'Authorization': `Basic ${authToken}` },
            body: formData
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Logo upload failed');
        }

        const uploadData = await uploadResponse.json();
        updateData.logo_url = uploadData.url;
        setLogoFile(null);
      }

      // Update branding using Server Action (bypasses CORS)
      const formData = new FormData();
      formData.append('authToken', authToken);
      Object.keys(updateData).forEach(key => {
        formData.append(key, updateData[key]);
      });

      const result = await saveBranding(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
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
            {/* Brand Icon (Logo) */}
            <div className="bg-[#1a1a1a] border border-white/5 p-6">
              <h2 className="text-white font-medium mb-4">Brand Icon</h2>
              
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

