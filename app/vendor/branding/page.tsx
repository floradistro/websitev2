"use client";

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Palette, Clock, FileText, Code, Image as ImageIcon } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { ds, cn } from '@/lib/design-system';
import { Button } from '@/components/ds/Button';
import { ImageUploader, ColorPicker, StorefrontPreview, SimpleBusinessHours, SimplePolicy, SimpleCssEditor, BrandAssetLibrary } from '@/components/vendor/branding';
import { FormField, FormSection, FormGrid } from '@/components/ui/FormField';
import { validateBrandingForm, formatUrl, sanitizeSocialHandle } from '@/lib/branding-validation';
import type { BrandingFormState, VendorBranding } from '@/types/branding';

const FONTS = ['Inter', 'Playfair Display', 'Montserrat', 'Lato', 'Roboto', 'Open Sans', 'Poppins', 'Raleway'];
const TABS = [
  { id: 'basics', label: 'Basics', icon: Palette },
  { id: 'visual', label: 'Visual', icon: ImageIcon },
  { id: 'hours', label: 'Hours', icon: Clock },
  { id: 'policies', label: 'Policies', icon: FileText },
  { id: 'css', label: 'CSS', icon: Code },
  { id: 'assets', label: 'Assets', icon: ImageIcon }
] as const;

type TabId = typeof TABS[number]['id'];

const RETURN_TEMPLATE = `# Return Policy\n\n## Returns within 30 days\n- Unused items in original packaging\n- No cannabis returns (state law)\n- Contact: returns@example.com`;
const SHIPPING_TEMPLATE = `# Shipping Policy\n\n## Delivery Options\n- Local delivery: Same/next day\n- Free pickup available\n- Age 21+ verification required`;

export default function VendorBranding() {
  const { vendor, refreshUserData } = useAppAuth();
  const [tab, setTab] = useState<TabId>('basics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<Partial<BrandingFormState>>({
    tagline: '', about: '', primaryColor: '#000000', secondaryColor: '#FFFFFF',
    accentColor: '#666666', textColor: '#1A1A1A', website: '', instagram: '',
    facebook: '', customFont: 'Inter', logoFile: null, logoPreview: '',
    bannerFile: null, bannerPreview: '', returnPolicy: '', shippingPolicy: '',
    customCss: '', businessHours: {}
  });
  const [initialForm, setInitialForm] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { if (vendor) loadBranding(); }, [vendor]);

  // Track unsaved changes
  useEffect(() => {
    if (initialForm) {
      setHasChanges(JSON.stringify(form) !== initialForm);
    }
  }, [form, initialForm]);

  // Warn on page leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Keyboard shortcut: Cmd/Ctrl + S to save
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(new Event('submit') as any);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [form]);

  const loadBranding = async () => {
    try {
      const res = await fetch('/api/supabase/vendor/branding', { headers: { 'x-vendor-id': vendor!.id } });
      if (!res.ok) return;

      const { branding: data }: { branding: VendorBranding } = await res.json();
      const colors = data.brand_colors || { primary: '#000000', secondary: '#FFFFFF', accent: '#666666', text: '#1A1A1A' };
      const social = data.social_links || {};

      const loadedForm = {
        tagline: data.store_tagline || '', about: data.store_description || '',
        primaryColor: colors.primary, secondaryColor: colors.secondary,
        accentColor: colors.accent, textColor: colors.text,
        website: social.website || '', instagram: social.instagram || '',
        facebook: social.facebook || '', customFont: data.custom_font || 'Inter',
        logoFile: null, logoPreview: data.logo_url || '',
        bannerFile: null, bannerPreview: data.banner_url || '',
        returnPolicy: data.return_policy || '', shippingPolicy: data.shipping_policy || '',
        customCss: data.custom_css || '', businessHours: data.business_hours || {}
      };
      setForm(loadedForm);
      setInitialForm(JSON.stringify(loadedForm));
      setHasChanges(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setErrors({});

    const validation = validateBrandingForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setError('Fix errors before saving');
      return;
    }

    setLoading(true);
    try {
      let logoUrl = form.logoPreview;
      let bannerUrl = form.bannerPreview;

      // Upload logo
      if (form.logoFile) {
        const fd = new FormData();
        fd.append('file', form.logoFile);
        fd.append('type', 'logo');
        const res = await fetch('/api/supabase/vendor/upload', { method: 'POST', headers: { 'x-vendor-id': vendor!.id }, body: fd });
        if (res.ok) logoUrl = (await res.json()).file.url;
      }

      // Upload banner
      if (form.bannerFile) {
        const fd = new FormData();
        fd.append('file', form.bannerFile);
        fd.append('type', 'banner');
        const res = await fetch('/api/supabase/vendor/upload', { method: 'POST', headers: { 'x-vendor-id': vendor!.id }, body: fd });
        if (res.ok) bannerUrl = (await res.json()).file.url;
      }

      // Save branding
      const res = await fetch('/api/supabase/vendor/branding', {
        method: 'PUT',
        headers: { 'x-vendor-id': vendor!.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_tagline: form.tagline,
          store_description: form.about,
          brand_colors: JSON.stringify({ primary: form.primaryColor, secondary: form.secondaryColor, accent: form.accentColor, text: form.textColor }),
          social_links: JSON.stringify({ website: form.website ? formatUrl(form.website) : '', instagram: form.instagram ? sanitizeSocialHandle(form.instagram) : '', facebook: form.facebook || '' }),
          custom_font: form.customFont,
          return_policy: form.returnPolicy,
          shipping_policy: form.shippingPolicy,
          custom_css: form.customCss,
          business_hours: JSON.stringify(form.businessHours),
          ...(logoUrl && { logo_url: logoUrl }),
          ...(bannerUrl && { banner_url: bannerUrl })
        })
      });

      if (!res.ok) throw new Error('Save failed');

      setSuccess('Saved!');
      await loadBranding();
      await refreshUserData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const update = (u: Partial<BrandingFormState>) => {
    setForm(f => ({ ...f, ...u }));
    setErrors(e => { const n = { ...e }; Object.keys(u).forEach(k => delete n[k]); return n; });
  };

  return (
    <div className={cn(ds.colors.bg.primary, 'min-h-screen p-4', ds.colors.text.primary)}>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.widest, ds.colors.text.primary, 'mb-1')}>Brand Settings</h1>
          <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary)}>Customize your brand identity</p>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className={cn(ds.colors.bg.elevated, 'border', ds.colors.border.default, 'rounded-lg p-2')}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded text-sm',
                    tab === id
                      ? cn(ds.colors.bg.active, ds.colors.text.primary)
                      : cn('hover:bg-white/5', ds.colors.text.tertiary)
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Preview */}
            <StorefrontPreview vendorSlug={vendor?.slug} />

            {/* Save */}
            <div className="space-y-2">
              <Button type="submit" variant="primary" icon={Save} loading={loading} fullWidth>
                {loading ? 'Saving...' : hasChanges ? 'Save Changes *' : 'Save Changes'}
              </Button>
              {hasChanges && (
                <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, 'text-center')}>
                  Unsaved changes • Press Cmd/Ctrl+S
                </p>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex gap-2 text-sm text-red-400">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded p-3 flex gap-2 text-sm text-green-400">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                {success}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="lg:col-span-2">
            <div className={cn(ds.colors.bg.elevated, 'border', ds.colors.border.default, 'rounded-lg p-6')}>
              {tab === 'basics' && (
                <div className="space-y-6">
                  <FormSection title="Store Info">
                    <FormField label="Tagline" type="text" value={form.tagline || ''} onChange={v => update({ tagline: v })} error={errors.tagline} />
                    <FormField label="About" type="textarea" value={form.about || ''} onChange={v => update({ about: v })} rows={4} error={errors.about} />
                  </FormSection>
                  <FormSection title="Typography">
                    <FormField label="Font" type="select" value={form.customFont || 'Inter'} onChange={v => update({ customFont: v })} options={FONTS.map(f => ({ value: f, label: f }))} />
                  </FormSection>
                  <FormSection title="Social">
                    <FormField label="Website" type="url" value={form.website || ''} onChange={v => update({ website: v })} error={errors.website} />
                    <FormGrid columns={2}>
                      <FormField label="Instagram" type="text" value={form.instagram || ''} onChange={v => update({ instagram: v })} />
                      <FormField label="Facebook" type="text" value={form.facebook || ''} onChange={v => update({ facebook: v })} />
                    </FormGrid>
                  </FormSection>
                </div>
              )}

              {tab === 'visual' && (
                <div className="space-y-6">
                  <ImageUploader label="Logo" preview={form.logoPreview || ''} onFileChange={f => update({ logoFile: f })} onPreviewChange={p => update({ logoPreview: p })} aspectRatio="square" />
                  <ImageUploader label="Banner" preview={form.bannerPreview || ''} onFileChange={f => update({ bannerFile: f })} onPreviewChange={p => update({ bannerPreview: p })} aspectRatio="banner" />
                  <FormGrid columns={2}>
                    <ColorPicker label="Primary" value={form.primaryColor || '#000000'} onChange={v => update({ primaryColor: v })} />
                    <ColorPicker label="Secondary" value={form.secondaryColor || '#FFFFFF'} onChange={v => update({ secondaryColor: v })} />
                    <ColorPicker label="Accent" value={form.accentColor || '#666666'} onChange={v => update({ accentColor: v })} />
                    <ColorPicker label="Text" value={form.textColor || '#1A1A1A'} onChange={v => update({ textColor: v })} />
                  </FormGrid>
                </div>
              )}

              {tab === 'hours' && <SimpleBusinessHours value={form.businessHours || {}} onChange={v => update({ businessHours: v })} />}

              {tab === 'policies' && (
                <div className="space-y-6">
                  <SimplePolicy label="Return Policy" value={form.returnPolicy || ''} onChange={v => update({ returnPolicy: v })} template={RETURN_TEMPLATE} />
                  <SimplePolicy label="Shipping Policy" value={form.shippingPolicy || ''} onChange={v => update({ shippingPolicy: v })} template={SHIPPING_TEMPLATE} />
                </div>
              )}

              {tab === 'css' && <SimpleCssEditor value={form.customCss || ''} onChange={v => update({ customCss: v })} />}

              {tab === 'assets' && vendor?.id && <BrandAssetLibrary vendorId={vendor.id} />}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
