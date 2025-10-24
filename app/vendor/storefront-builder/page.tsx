"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Check, Eye, Palette, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { AVAILABLE_TEMPLATES, TemplateMetadata } from '@/lib/storefront/templates-data';

export default function StorefrontBuilder() {
  const { vendor } = useVendorAuth();
  const [view, setView] = useState<'templates' | 'ai'>('templates');
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<string>('minimalist');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadCurrentTemplate();
  }, []);

  async function loadTemplates() {
    setTemplates(AVAILABLE_TEMPLATES);
  }

  async function loadCurrentTemplate() {
    try {
      const response = await fetch('/api/vendor/storefront');
      const data = await response.json();
      if (data.success) {
        setCurrentTemplate(data.vendor.template_id || 'minimalist');
        setPreviewUrl(`/storefront?vendor=${data.vendor.slug}`);
      }
    } catch (error) {
      console.error('Failed to load current template:', error);
    }
  }

  async function selectTemplate(templateId: string) {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/storefront', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId })
      });

      if (response.ok) {
        setCurrentTemplate(templateId);
        // Show success notification
        alert('✅ Template updated! Visit your storefront to see the changes.');
      } else {
        alert('Failed to update template. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2 font-light tracking-tight">
          Storefront Builder
        </h1>
        <p className="text-white/50 text-sm mb-4">
          Choose a template that matches your brand's style, then customize it to make it yours
        </p>
        
        {previewUrl && (
          <a 
            href={previewUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors border border-white/20 px-4 py-2 rounded hover:border-white/40"
          >
            <Eye size={16} />
            Preview Your Live Storefront
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setView('templates')}
          className={`px-6 py-3 text-sm uppercase tracking-wider transition-all ${
            view === 'templates'
              ? 'text-white border-b-2 border-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Palette className="inline mr-2" size={16} />
          Templates
        </button>
        <button
          onClick={() => setView('ai')}
          className={`px-6 py-3 text-sm uppercase tracking-wider transition-all ${
            view === 'ai'
              ? 'text-white border-b-2 border-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Sparkles className="inline mr-2" size={16} />
          AI Customize
          <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Beta</span>
        </button>
      </div>

      {/* Templates View */}
      {view === 'templates' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-[#111111] border-2 rounded-lg overflow-hidden transition-all hover:scale-[1.02] ${
                  currentTemplate === template.id 
                    ? 'border-white shadow-lg shadow-white/10' 
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* Template Preview */}
                <div className="aspect-[4/3] bg-[#0a0a0a] relative group">
                  <img 
                    src={template.preview_image} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if preview image doesn't exist
                      e.currentTarget.src = '/yacht-club-logo.png';
                      e.currentTarget.style.objectFit = 'contain';
                      e.currentTarget.style.padding = '2rem';
                    }}
                  />
                  {currentTemplate === template.id && (
                    <div className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check size={14} />
                      Active
                    </div>
                  )}
                  
                  {/* Hover overlay with demo link */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={`/storefront?vendor=${vendor?.slug}&template_preview=${template.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-black px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-white/90"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye size={14} />
                      Preview
                    </a>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{template.description}</p>

                  {/* Features */}
                  <div className="mb-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Features</p>
                    <div className="flex flex-wrap gap-1">
                      {template.features.slice(0, 3).map((feature) => (
                        <span key={feature} className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Best For */}
                  <div className="mb-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Best For</p>
                    <p className="text-xs text-white/60 line-clamp-1">{template.best_for.join(', ')}</p>
                  </div>

                  {/* Action Button */}
                  {currentTemplate === template.id ? (
                    <button
                      disabled
                      className="w-full bg-white/10 text-white/40 py-2 rounded text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check size={14} />
                      Current Template
                    </button>
                  ) : (
                    <button
                      onClick={() => selectTemplate(template.id)}
                      disabled={loading}
                      className="w-full bg-white text-black py-2 rounded text-sm hover:bg-white/90 transition-colors disabled:bg-white/50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Applying...
                        </>
                      ) : (
                        'Use This Template'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Customization Note */}
          <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Palette className="text-white/60 mt-1" size={20} />
              <div>
                <h3 className="text-white font-medium mb-1">Customize Your Template</h3>
                <p className="text-white/60 text-sm mb-3">
                  After selecting a template, visit <a href="/vendor/branding" className="text-white underline hover:text-white/80">Branding</a> to customize colors, logo, fonts, and content. Your customizations will apply to whichever template you choose.
                </p>
                <div className="flex gap-2">
                  <a
                    href="/vendor/branding"
                    className="text-xs bg-white text-black px-4 py-2 rounded hover:bg-white/90 transition-colors"
                  >
                    Customize Branding →
                  </a>
                  <a
                    href="/vendor/domains"
                    className="text-xs border border-white/20 text-white px-4 py-2 rounded hover:border-white/40 transition-colors"
                  >
                    Setup Custom Domain
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI View */}
      {view === 'ai' && (
        <div className="bg-[#111111] border border-white/10 rounded-lg p-8 text-center">
          <Sparkles className="mx-auto mb-4 text-purple-400" size={48} />
          <h2 className="text-2xl text-white mb-2">AI Customization</h2>
          <p className="text-white/60 mb-6 max-w-2xl mx-auto">
            Use natural language to describe changes to your storefront. Our AI will understand and apply them automatically.
          </p>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
            <p className="text-purple-400 text-sm mb-2">Coming Soon</p>
            <p className="text-white/60 text-sm">
              AI-powered customization is currently in development. For now, use the Templates tab to select a design, then visit the Branding page to customize colors and content.
            </p>
          </div>
          <a
            href="/vendor/storefront-builder-v2"
            className="inline-block text-sm text-white/60 hover:text-white underline"
          >
            Try Legacy AI Builder (Beta)
          </a>
        </div>
      )}
    </div>
  );
}
