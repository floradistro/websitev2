"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Save, Eye, Wand2, Plus, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface ContentSection {
  id: string;
  page_type: string;
  section_key: string;
  section_order: number;
  is_enabled: boolean;
  content_data: any;
}

export default function ContentManager() {
  const { vendor } = useVendorAuth();
  const [selectedPage, setSelectedPage] = useState('home');
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const pages = [
    { id: 'home', name: 'Home Page' },
    { id: 'about', name: 'About Page' },
    { id: 'contact', name: 'Contact Page' },
    { id: 'faq', name: 'FAQ Page' },
    { id: 'global', name: 'Global Settings' },
  ];

  useEffect(() => {
    loadSections();
  }, [selectedPage]);

  async function loadSections() {
    setLoading(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await fetch(`/api/vendor/content?page_type=${selectedPage}&vendor_id=${vendorId}`);
      const data = await response.json();
      
      if (data.success) {
        setSections(data.sections || []);
      } else {
        console.error('Failed to load sections:', data.error);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSection(section: ContentSection) {
    setSaving(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await fetch(`/api/vendor/content?vendor_id=${vendorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_type: section.page_type,
          section_key: section.section_key,
          content_data: section.content_data,
          section_order: section.section_order,
          is_enabled: section.is_enabled
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Section saved successfully!');
        loadSections();
      } else {
        console.error('Save failed:', data.error);
        alert(`❌ Failed to save section: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save section');
    } finally {
      setSaving(false);
    }
  }

  async function toggleSection(section: ContentSection) {
    const updatedSection = { ...section, is_enabled: !section.is_enabled };
    await saveSection(updatedSection);
  }

  function updateSectionContent(sectionKey: string, path: string, value: any) {
    setSections(sections.map(section => {
      if (section.section_key === sectionKey) {
        const newContentData = { ...section.content_data };
        
        // Update nested property
        const keys = path.split('.');
        let current = newContentData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        
        return { ...section, content_data: newContentData };
      }
      return section;
    }));
  }

  function renderSectionEditor(section: ContentSection) {
    const isExpanded = expandedSection === section.section_key;

    return (
      <div key={section.id} className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandedSection(isExpanded ? null : section.section_key)}
              className="text-white/60 hover:text-white"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <h3 className="text-white font-medium capitalize">
              {section.section_key.replace('_', ' ')} Section
            </h3>
            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
              Order: {section.section_order}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSection(section)}
              className="text-white/60 hover:text-white"
              title={section.is_enabled ? 'Disable' : 'Enable'}
            >
              {section.is_enabled ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
            </button>
            <button
              onClick={() => saveSection(section)}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded text-sm hover:bg-white/90 disabled:bg-white/50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>

        {/* Section Editor (Expanded) */}
        {isExpanded && (
          <div className="p-6 space-y-4">
            {renderSectionFields(section)}
          </div>
        )}
      </div>
    );
  }

  function renderSectionFields(section: ContentSection) {
    const { section_key, content_data } = section;

    // Hero Section
    if (section_key === 'hero') {
      return (
        <>
          <div>
            <label className="block text-white/80 text-sm mb-2">Headline</label>
            <input
              type="text"
              value={content_data.headline || ''}
              onChange={(e) => updateSectionContent(section_key, 'headline', e.target.value)}
              className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
            />
          </div>
          
          <div>
            <label className="block text-white/80 text-sm mb-2">Subheadline</label>
            <input
              type="text"
              value={content_data.subheadline || ''}
              onChange={(e) => updateSectionContent(section_key, 'subheadline', e.target.value)}
              className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Primary Button Text</label>
              <input
                type="text"
                value={content_data.cta_primary?.text || ''}
                onChange={(e) => updateSectionContent(section_key, 'cta_primary.text', e.target.value)}
                className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Primary Button Link</label>
              <input
                type="text"
                value={content_data.cta_primary?.link || ''}
                onChange={(e) => updateSectionContent(section_key, 'cta_primary.link', e.target.value)}
                className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Secondary Button Text</label>
              <input
                type="text"
                value={content_data.cta_secondary?.text || ''}
                onChange={(e) => updateSectionContent(section_key, 'cta_secondary.text', e.target.value)}
                className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Secondary Button Link</label>
              <input
                type="text"
                value={content_data.cta_secondary?.link || ''}
                onChange={(e) => updateSectionContent(section_key, 'cta_secondary.link', e.target.value)}
                className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
              />
            </div>
          </div>
        </>
      );
    }

    // About Story Section
    if (section_key === 'about_story') {
      return (
        <>
          <div>
            <label className="block text-white/80 text-sm mb-2">Headline</label>
            <input
              type="text"
              value={content_data.headline || ''}
              onChange={(e) => updateSectionContent(section_key, 'headline', e.target.value)}
              className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
            />
          </div>
          
          {content_data.paragraphs?.map((paragraph: string, index: number) => (
            <div key={index}>
              <label className="block text-white/80 text-sm mb-2">Paragraph {index + 1}</label>
              <textarea
                value={paragraph}
                onChange={(e) => {
                  const newParagraphs = [...content_data.paragraphs];
                  newParagraphs[index] = e.target.value;
                  updateSectionContent(section_key, 'paragraphs', newParagraphs);
                }}
                rows={3}
                className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
              />
            </div>
          ))}
          
          {content_data.cta_text !== undefined && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">CTA Text</label>
                <input
                  type="text"
                  value={content_data.cta_text || ''}
                  onChange={(e) => updateSectionContent(section_key, 'cta_text', e.target.value)}
                  className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-2">CTA Link</label>
                <input
                  type="text"
                  value={content_data.cta_link || ''}
                  onChange={(e) => updateSectionContent(section_key, 'cta_link', e.target.value)}
                  className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded"
                />
              </div>
            </div>
          )}
        </>
      );
    }

    // Generic JSON Editor for other sections
    return (
      <div>
        <label className="block text-white/80 text-sm mb-2">Content Data (JSON)</label>
        <textarea
          value={JSON.stringify(content_data, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setSections(sections.map(s => 
                s.section_key === section_key ? { ...s, content_data: parsed } : s
              ));
            } catch (error) {
              // Invalid JSON, don't update
            }
          }}
          rows={15}
          className="w-full bg-black border border-white/20 text-white px-4 py-2 rounded font-mono text-sm"
        />
        <p className="text-white/40 text-xs mt-2">Edit JSON directly. Must be valid JSON.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2 font-light tracking-tight">
          Content Manager
        </h1>
        <p className="text-white/50 text-sm mb-4">
          Edit your storefront content - changes apply to all templates
        </p>
        
        <div className="flex gap-2">
          <a
            href={`/storefront?vendor=${vendor?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 text-white px-4 py-2 rounded text-sm hover:border-white/40"
          >
            <Eye size={14} />
            Preview Storefront
          </a>
          <button
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
            title="AI Reword (Coming Soon)"
          >
            <Wand2 size={14} />
            AI Reword
            <span className="text-xs bg-purple-800 px-2 py-0.5 rounded">Soon</span>
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setSelectedPage(page.id)}
            className={`px-6 py-3 text-sm uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedPage === page.id
                ? 'text-white border-b-2 border-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {page.name}
          </button>
        ))}
      </div>

      {/* Sections List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-white/60" size={32} />
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
          <p className="text-white/60 mb-4">No content sections found for this page</p>
          <p className="text-white/40 text-sm">
            Sections will be created automatically when you add products or configure your storefront
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => renderSectionEditor(section))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-white font-medium mb-2">How Content Management Works</h3>
        <ul className="text-white/60 text-sm space-y-2 list-disc list-inside">
          <li>Edit content for each section independently</li>
          <li>Changes apply to your current template immediately</li>
          <li>Switch templates anytime - your content stays the same</li>
          <li>Toggle sections on/off to customize your page layout</li>
          <li>Use AI Reword (coming soon) to adapt content for your brand voice</li>
        </ul>
      </div>
    </div>
  );
}

