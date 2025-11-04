"use client";

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Palette, Clock, FileText, Code, Image as ImageIcon } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { ds, cn } from '@/lib/design-system';
import { Button } from '@/components/ds/Button';
import {
  ImageUploader,
  ColorPicker,
  BusinessHoursEditor,
  ReturnPolicyEditor,
  ShippingPolicyEditor,
  CustomCssEditor,
  EnhancedStorefrontPreview,
  BrandAssetLibrary
} from '@/components/vendor/branding';
import { FormField, FormSection, FormGrid } from '@/components/ui/FormField';
import { validateBrandingForm, formatUrl, sanitizeSocialHandle } from '@/lib/branding-validation';
import type { BrandingFormState, VendorBranding } from '@/types/branding';

const FONT_OPTIONS = [
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

type TabId = 'basics' | 'visual' | 'hours' | 'policies' | 'advanced' | 'assets';

const TABS = [
  { id: 'basics' as const, label: 'Basics', icon: Palette },
  { id: 'visual' as const, label: 'Visual Identity', icon: ImageIcon },
  { id: 'hours' as const, label: 'Business Hours', icon: Clock },
  { id: 'policies' as const, label: 'Policies', icon: FileText },
  { id: 'advanced' as const, label: 'Custom CSS', icon: Code },
  { id: 'assets' as const, label: 'Asset Library', icon: ImageIcon }
];

export default function VendorBranding() {
  const { vendor, refreshUserData } = useAppAuth();
  const [activeTab, setActiveTab] = useState<TabId>('basics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const [branding, setBranding] = useState<Partial<BrandingFormState>>({
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
    twitter: '',
    customFont: 'Inter',
    logoFile: null,
    logoPreview: '',
    bannerFile: null,
    bannerPreview: '',
    returnPolicy: '',
    shippingPolicy: '',
    customCss: '',
    businessHours: {}
  });

  useEffect(() => {
    if (vendor) {
      loadBranding();
    }
  }, [vendor]);

  const loadBranding = async () => {
    try {
      const vendorId = vendor?.id;
      if (!vendorId) return;

      const response = await fetch('/api/supabase/vendor/branding', {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.ok) {
        const result = await response.json();
        const data: VendorBranding = result.branding;

        const brandColors = data.brand_colors || {
          primary: '#000000',
          secondary: '#FFFFFF',
          accent: '#666666',
          background: '#FFFFFF',
          text: '#1A1A1A'
        };

        const socialLinks = data.social_links || {
          website: '',
          instagram: '',
          facebook: '',
          twitter: ''
        };

        setBranding({
          tagline: data.store_tagline || '',
          about: data.store_description || '',
          primaryColor: brandColors.primary,
          secondaryColor: brandColors.secondary,
          accentColor: brandColors.accent,
          backgroundColor: brandColors.background,
          textColor: brandColors.text,
          website: socialLinks.website || '',
          instagram: socialLinks.instagram || '',
          facebook: socialLinks.facebook || '',
          twitter: socialLinks.twitter || '',
          customFont: data.custom_font || 'Inter',
          logoFile: null,
          logoPreview: data.logo_url || '',
          bannerFile: null,
          bannerPreview: data.banner_url || '',
          returnPolicy: data.return_policy || '',
          shippingPolicy: data.shipping_policy || '',
          customCss: data.custom_css || '',
          businessHours: data.business_hours || {}
        });
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
      setError('Failed to load branding settings');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setValidationErrors({});

    const validation = validateBrandingForm(branding);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Please fix the errors before saving');
      return;
    }

    setLoading(true);

    try {
      const vendorId = vendor?.id;
      if (!vendorId) throw new Error('Not authenticated');

      let logoUrl = branding.logoPreview;
      let bannerUrl = branding.bannerPreview;

      if (branding.logoFile) {
        const formData = new FormData();
        formData.append('file', branding.logoFile);
        formData.append('type', 'logo');

        const uploadResponse = await fetch('/api/supabase/vendor/upload', {
          method: 'POST',
          headers: { 'x-vendor-id': vendorId },
          body: formData
        });

        if (!uploadResponse.ok) throw new Error('Logo upload failed');
        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.file.url;
      }

      if (branding.bannerFile) {
        const formData = new FormData();
        formData.append('file', branding.bannerFile);
        formData.append('type', 'banner');

        const uploadResponse = await fetch('/api/supabase/vendor/upload', {
          method: 'POST',
          headers: { 'x-vendor-id': vendorId },
          body: formData
        });

        if (!uploadResponse.ok) throw new Error('Banner upload failed');
        const uploadData = await uploadResponse.json();
        bannerUrl = uploadData.file.url;
      }

      const updateData = {
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
          website: branding.website ? formatUrl(branding.website) : '',
          instagram: branding.instagram ? sanitizeSocialHandle(branding.instagram) : '',
          facebook: branding.facebook || '',
          twitter: branding.twitter || ''
        }),
        custom_font: branding.customFont,
        return_policy: branding.returnPolicy,
        shipping_policy: branding.shippingPolicy,
        custom_css: branding.customCss,
        business_hours: JSON.stringify(branding.businessHours),
        ...(logoUrl && { logo_url: logoUrl }),
        ...(bannerUrl && { banner_url: bannerUrl })
      };

      const response = await fetch('/api/supabase/vendor/branding', {
        method: 'PUT',
        headers: {
          'x-vendor-id': vendorId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Save failed');

      setSuccess('Branding updated successfully!');
      await loadBranding();
      await refreshUserData();

      setBranding(prev => ({
        ...prev,
        logoFile: null,
        bannerFile: null
      }));

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update branding';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = (updates: Partial<BrandingFormState>) => {
    setBranding(prev => ({ ...prev, ...updates }));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(updates).forEach(key => delete newErrors[key]);
      return newErrors;
    });
  };

  return (
    <div className={cn(ds.colors.bg.primary, 'min-h-screen', ds.colors.text.primary)}>
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Header */}
        <div className={cn('mb-8 pb-6', 'border-b', ds.colors.border.subtle)}>
          <h1 className={cn(
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.widest,
            ds.colors.text.primary,
            ds.typography.weight.bold,
            'mb-1'
          )}>
            Brand Settings
          </h1>
          <p className={cn(
            ds.typography.size.micro,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.quaternary
          )}>
            Customize Your Brand · Storefront Appearance · Policies & Hours
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Navigation & Preview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tab Navigation */}
            <div className={cn(
              ds.colors.bg.elevated,
              'border',
              ds.colors.border.default,
              ds.effects.radius.lg,
              'p-2'
            )}>
              <nav className="space-y-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      'w-full',
                      'flex items-center gap-3',
                      'px-3 py-2',
                      ds.effects.radius.md,
                      ds.effects.transition.fast,
                      ds.typography.size.sm,
                      activeTab === id
                        ? cn(ds.colors.bg.active, ds.colors.text.primary, 'font-medium')
                        : cn('hover:bg-white/[0.04]', ds.colors.text.tertiary)
                    )}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Live Preview */}
            <EnhancedStorefrontPreview vendorSlug={vendor?.slug} />

            {/* Save Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              loading={loading}
              fullWidth
            >
              {loading ? 'Saving...' : 'Save All Changes'}
            </Button>

            {/* Messages */}
            {error && (
              <div className={cn(
                'bg-red-500/10',
                'border border-red-500/20',
                ds.effects.radius.md,
                'p-4',
                'flex items-start gap-3'
              )}>
                <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className={cn(ds.typography.size.sm, 'text-red-400')}>{error}</div>
              </div>
            )}

            {success && (
              <div className={cn(
                'bg-green-500/10',
                'border border-green-500/20',
                ds.effects.radius.md,
                'p-4',
                'flex items-start gap-3'
              )}>
                <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div className={cn(ds.typography.size.sm, 'text-green-400')}>{success}</div>
              </div>
            )}
          </div>

          {/* Right Column - Tab Content */}
          <div className="lg:col-span-2">
            <div className={cn(
              ds.colors.bg.elevated,
              'border',
              ds.colors.border.default,
              ds.effects.radius.lg,
              'p-6'
            )}>
              {/* Basics Tab */}
              {activeTab === 'basics' && (
                <div className="space-y-6">
                  <FormSection title="Store Information">
                    <FormField
                      label="Tagline"
                      type="text"
                      value={branding.tagline || ''}
                      onChange={(value) => updateBranding({ tagline: value })}
                      placeholder="Your brand's tagline"
                      error={validationErrors.tagline}
                      hint="Max 100 characters"
                    />

                    <FormField
                      label="About Your Brand"
                      type="textarea"
                      value={branding.about || ''}
                      onChange={(value) => updateBranding({ about: value })}
                      placeholder="Tell customers about your brand..."
                      rows={4}
                      error={validationErrors.about}
                      hint="Max 500 characters"
                    />
                  </FormSection>

                  <FormSection title="Typography">
                    <FormField
                      label="Font Family"
                      type="select"
                      value={branding.customFont || 'Inter'}
                      onChange={(value) => updateBranding({ customFont: value })}
                      options={FONT_OPTIONS.map(font => ({ value: font, label: font }))}
                    />
                  </FormSection>

                  <FormSection title="Social Media">
                    <FormField
                      label="Website"
                      type="url"
                      value={branding.website || ''}
                      onChange={(value) => updateBranding({ website: value })}
                      placeholder="https://yourbrand.com"
                      error={validationErrors.website}
                    />

                    <FormGrid columns={2}>
                      <FormField
                        label="Instagram"
                        type="text"
                        value={branding.instagram || ''}
                        onChange={(value) => updateBranding({ instagram: value })}
                        placeholder="@yourbrand"
                        error={validationErrors.instagram}
                      />

                      <FormField
                        label="Facebook"
                        type="text"
                        value={branding.facebook || ''}
                        onChange={(value) => updateBranding({ facebook: value })}
                        placeholder="yourbrand"
                        error={validationErrors.facebook}
                      />
                    </FormGrid>
                  </FormSection>
                </div>
              )}

              {/* Visual Identity Tab */}
              {activeTab === 'visual' && (
                <div className="space-y-6">
                  <FormSection title="Brand Assets">
                    <ImageUploader
                      label="Brand Logo"
                      preview={branding.logoPreview || ''}
                      onFileChange={(file) => updateBranding({ logoFile: file })}
                      onPreviewChange={(preview) => updateBranding({ logoPreview: preview })}
                      aspectRatio="square"
                      recommendedSize="300x300px"
                    />

                    <ImageUploader
                      label="Hero Banner"
                      preview={branding.bannerPreview || ''}
                      onFileChange={(file) => updateBranding({ bannerFile: file })}
                      onPreviewChange={(preview) => updateBranding({ bannerPreview: preview })}
                      aspectRatio="banner"
                      recommendedSize="1920x600px"
                    />
                  </FormSection>

                  <FormSection title="Brand Colors">
                    <FormGrid columns={2}>
                      <ColorPicker
                        label="Primary Color"
                        value={branding.primaryColor || '#000000'}
                        onChange={(value) => updateBranding({ primaryColor: value })}
                        hint="Main brand color"
                      />

                      <ColorPicker
                        label="Secondary Color"
                        value={branding.secondaryColor || '#FFFFFF'}
                        onChange={(value) => updateBranding({ secondaryColor: value })}
                        hint="Supporting color"
                      />

                      <ColorPicker
                        label="Accent Color"
                        value={branding.accentColor || '#666666'}
                        onChange={(value) => updateBranding({ accentColor: value })}
                        hint="Highlights & CTAs"
                      />

                      <ColorPicker
                        label="Text Color"
                        value={branding.textColor || '#1A1A1A'}
                        onChange={(value) => updateBranding({ textColor: value })}
                        hint="Body text color"
                      />
                    </FormGrid>

                    {validationErrors.colorContrast && (
                      <div className={cn(
                        'p-3',
                        'bg-orange-500/10',
                        'border border-orange-500/20',
                        ds.effects.radius.md,
                        ds.typography.size.xs,
                        ds.colors.status.warning
                      )}>
                        <AlertCircle size={14} className="inline mr-2" />
                        {validationErrors.colorContrast}
                      </div>
                    )}
                  </FormSection>
                </div>
              )}

              {/* Business Hours Tab */}
              {activeTab === 'hours' && (
                <BusinessHoursEditor
                  value={branding.businessHours || {}}
                  onChange={(hours) => updateBranding({ businessHours: hours })}
                />
              )}

              {/* Policies Tab */}
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <ReturnPolicyEditor
                    value={branding.returnPolicy || ''}
                    onChange={(value) => updateBranding({ returnPolicy: value })}
                  />

                  <ShippingPolicyEditor
                    value={branding.shippingPolicy || ''}
                    onChange={(value) => updateBranding({ shippingPolicy: value })}
                  />
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <CustomCssEditor
                  value={branding.customCss || ''}
                  onChange={(value) => updateBranding({ customCss: value })}
                />
              )}

              {/* Assets Tab */}
              {activeTab === 'assets' && vendor?.id && (
                <BrandAssetLibrary
                  vendorId={vendor.id}
                  onAssetSelect={(asset) => {
                    // Optionally set as logo or banner
                    console.log('Asset selected:', asset);
                  }}
                />
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
