// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Save, Eye, Monitor, Smartphone, Plus, Trash2, EyeOff, GripVertical, Loader2, RefreshCw, Layout, Settings, Palette, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SECTION_LIBRARY, getSectionsForPage, SectionTemplate } from '@/lib/storefront/section-library';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AddCustomFieldButton } from '@/components/storefront/AddCustomFieldButton';
import { FieldLibraryPanel } from '@/components/vendor/FieldLibraryPanel';

interface ContentSection {
  id: string;
  page_type: string;
  section_key: string;
  section_order: number;
  is_enabled: boolean;
  content_data: any;
}

export default function LiveEditorV2() {
  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      .slider-modern::-webkit-slider-thumb {
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }
      .slider-modern::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { vendor } = useVendorAuth();
  const [selectedPage, setSelectedPage] = useState('home');
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<ContentSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'design' | 'settings' | 'fields'>('sections');
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['hero', 'content', 'features']);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [customFieldsCache, setCustomFieldsCache] = useState<Record<string, any[]>>({});

  const pages = [
    { id: 'home', name: 'Home' },
    { id: 'shop', name: 'Shop' },
    { id: 'about', name: 'About' },
    { id: 'contact', name: 'Contact' },
    { id: 'faq', name: 'FAQ' },
  ];

  useEffect(() => {
    if (vendor) {
      loadSections();
      loadCustomFields();
      updatePreviewPage();
    }
  }, [selectedPage, vendor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S / Ctrl+S - Manual save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          saveAllChanges();
        }
      }
      
      // Delete key - Delete selected section
      if (e.key === 'Delete' && selectedSection && !e.target.matches('input, textarea')) {
        e.preventDefault();
        deleteSection(selectedSection.id);
      }
      
      // Cmd+D / Ctrl+D - Duplicate selected section
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedSection) {
        e.preventDefault();
        duplicateSection(selectedSection.id);
      }

      // Escape - Close modals
      if (e.key === 'Escape') {
        setShowSectionLibrary(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSection, hasUnsavedChanges, showSectionLibrary]);

  function updatePreviewPage() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe && vendor) {
      let pageUrl = '';
      switch (selectedPage) {
        case 'home':
          pageUrl = `/storefront?vendor=${vendor.slug}&preview=true`;
          break;
        case 'shop':
          pageUrl = `/storefront/shop?vendor=${vendor.slug}&preview=true`;
          break;
        case 'about':
          pageUrl = `/storefront/about?vendor=${vendor.slug}&preview=true`;
          break;
        case 'contact':
          pageUrl = `/storefront/contact?vendor=${vendor.slug}&preview=true`;
          break;
        case 'faq':
          pageUrl = `/storefront/faq?vendor=${vendor.slug}&preview=true`;
          break;
        default:
          pageUrl = `/storefront?vendor=${vendor.slug}&preview=true`;
      }
      iframe.src = pageUrl;
      setIframeReady(false);
    }
  }

  // Auto-save when changes are made
  useEffect(() => {
    if (hasUnsavedChanges) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Auto-save after 2 seconds of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        saveAllChanges();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, sections]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'PREVIEW_READY') {
        setIframeReady(true);
        setTimeout(() => reloadPreviewSections(), 200);
      }
      
      if (event.data.type === 'PAGE_CHANGED') {
        const newPage = event.data.page;
        if (newPage && newPage !== selectedPage) {
          setSelectedPage(newPage);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sections, selectedPage]);

  function reloadPreviewSections() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'RELOAD_SECTIONS',
        data: { sections: sections.filter(s => s.page_type === selectedPage) }
      }, '*');
    }
  }
  
  // Reload preview when sections change OR when page changes
  useEffect(() => {
    if (iframeReady) {
      setTimeout(() => reloadPreviewSections(), 100);
    }
  }, [sections, selectedPage, iframeReady]);

  async function loadCustomFields() {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await fetch('/api/vendor/custom-fields', {
        headers: { 'x-vendor-id': vendorId! }
      });
      const data = await response.json();
      if (data.success) {
        // Group by section_key for easy lookup
        const grouped = (data.customFields || []).reduce((acc: any, field: any) => {
          const key = field.section_key;
          if (!acc[key]) acc[key] = [];
          acc[key].push(field);
          return acc;
        }, {});
        setCustomFieldsCache(grouped);
      }
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  }

  async function loadSections() {
    setLoading(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await fetch(`/api/vendor/content?page_type=${selectedPage}&vendor_id=${vendorId}`);
      const data = await response.json();
      
      if (data.success) {
        const sorted = (data.sections || []).sort((a: ContentSection, b: ContentSection) => 
          a.section_order - b.section_order
        );
        setSections(sorted);
        
        // Auto-select first section when switching pages
        if (sorted.length > 0) {
          setSelectedSection(sorted[0]);
        } else {
          setSelectedSection(null);
        }
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAllChanges() {
    if (saving) return; // Prevent concurrent saves
    
    setSaving(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      await Promise.all(sections.map(section => 
        fetch(`/api/vendor/content?vendor_id=${vendorId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_type: section.page_type,
            section_key: section.section_key,
            content_data: section.content_data,
            section_order: section.section_order,
            is_enabled: section.is_enabled
          })
        })
      ));
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  function refreshPreview() {
    setPreviewKey(prev => prev + 1);
    setIframeReady(false);
  }

  // Debounced update to preview
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function updateSectionContent(field: string, value: any) {
    if (!selectedSection) return;
    
    const updatedSection = {
      ...selectedSection,
      content_data: {
        ...selectedSection.content_data,
        [field]: value
      }
    };
    
    setSelectedSection(updatedSection);
    setSections(sections.map(s => s.id === selectedSection.id ? updatedSection : s));
    setHasUnsavedChanges(true);
    
    // Debounce preview updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (!iframeReady) return;

      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'UPDATE_SECTION',
          data: {
            section_key: selectedSection.section_key,
            field: field,
            value: value
          }
        }, '*');
      }
    }, 300);
  }

  function updateNestedContent(path: string, value: any) {
    if (!selectedSection) return;
    
    const keys = path.split('.');
    const newContentData = JSON.parse(JSON.stringify(selectedSection.content_data));
    let current = newContentData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    const updatedSection = {
      ...selectedSection,
      content_data: newContentData
    };
    
    setSelectedSection(updatedSection);
    setSections(sections.map(s => s.id === selectedSection.id ? updatedSection : s));
    setHasUnsavedChanges(true);

    if (!iframeReady) return;

    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'UPDATE_SECTION',
        data: {
          section_key: selectedSection.section_key,
          field: path,
          value: value
        }
      }, '*');
    }
  }

  function toggleSection(sectionId: string) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newEnabled = !section.is_enabled;
    
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, is_enabled: newEnabled } : s
    ));
    setHasUnsavedChanges(true);
    
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow && iframeReady) {
      iframe.contentWindow.postMessage({
        type: 'TOGGLE_SECTION',
        data: {
          section_key: section.section_key,
          is_enabled: newEnabled
        }
      }, '*');
    }
  }

  async function addSection(template: SectionTemplate) {
    const vendorId = localStorage.getItem('vendor_id');
    const newSection: ContentSection = {
      id: `temp-${Date.now()}`,
      vendor_id: vendorId!,
      page_type: selectedPage,
      section_key: template.key,
      section_order: sections.length,
      is_enabled: true,
      content_data: template.defaultContent
    };

    setSections([...sections, newSection]);
    setSelectedSection(newSection);
    setHasUnsavedChanges(true);
    setShowSectionLibrary(false);
    
    refreshPreview();
  }

  async function deleteSection(sectionId: string) {
    if (!confirm('Delete this section?')) return;

    setSections(sections.filter(s => s.id !== sectionId));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(sections[0] || null);
    }
    setHasUnsavedChanges(true);
    refreshPreview();
  }

  function duplicateSection(sectionId: string) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const duplicate: ContentSection = {
      ...section,
      id: `temp-${Date.now()}`,
      section_order: section.section_order + 1,
      content_data: { ...section.content_data }
    };

    // Insert after original section
    const newSections = [...sections];
    const index = newSections.findIndex(s => s.id === sectionId);
    newSections.splice(index + 1, 0, duplicate);
    
    // Reorder
    newSections.forEach((s, i) => s.section_order = i);

    setSections(newSections);
    setSelectedSection(duplicate);
    setHasUnsavedChanges(true);
    refreshPreview();
  }

  function onDragEnd(result: any) {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update section_order for all
    const updatedSections = items.map((item, index) => ({
      ...item,
      section_order: index
    }));

    setSections(updatedSections);
    setHasUnsavedChanges(true);
    refreshPreview();
  }

  function toggleSectionExpansion(sectionId: string) {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
    
    // Also set as selected
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSelectedSection(section);
    }
  }

  function renderSectionEditorInline(section: ContentSection) {
    const { section_key, content_data, id } = section;
    
    // Update functions for inline editing
    const updateContent = (field: string, value: any) => {
      const updatedSection = {
        ...section,
        content_data: {
          ...section.content_data,
          [field]: value
        }
      };
      
      setSections(sections.map(s => s.id === section.id ? updatedSection : s));
      setHasUnsavedChanges(true);
      
      // Debounced preview update
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        if (!iframeReady) return;
        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'UPDATE_SECTION',
            data: { section_key, field, value }
          }, '*');
        }
      }, 300);
    };
    
    const updateNested = (path: string, value: any) => {
      const keys = path.split('.');
      const newContentData = JSON.parse(JSON.stringify(section.content_data));
      let current = newContentData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      const updatedSection = { ...section, content_data: newContentData };
      setSections(sections.map(s => s.id === section.id ? updatedSection : s));
      setHasUnsavedChanges(true);
    };

    // Render appropriate editor for this section type
    if (section_key === 'shop_config') {
      return (
        <div className="space-y-3">
          {/* Page Header */}
          <div className="space-y-2 pb-2 border-b border-white/5">
            <label className="text-white/60 text-[10px] uppercase tracking-wider block font-medium">Page Header</label>
            <EditorField 
              label="Page Title" 
              value={content_data.page_title || 'Shop All'} 
              onChange={(v) => updateContent('page_title', v)} 
              placeholder="Shop All" 
            />
            <EditorField 
              label="Page Subtitle" 
              value={content_data.page_subtitle || ''} 
              onChange={(v) => updateContent('page_subtitle', v)} 
              placeholder="Browse our complete collection" 
            />
          </div>

          {/* Layout Settings */}
          <div className="space-y-2 pb-2 border-b border-white/5">
            <label className="text-white/60 text-[10px] uppercase tracking-wider block font-medium">Layout</label>
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Grid Columns</label>
              <select
                value={content_data.grid_columns || 3}
                onChange={(e) => updateContent('grid_columns', parseInt(e.target.value))}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Gap Size</label>
              <select
                value={content_data.grid_gap || 'md'}
                onChange={(e) => updateContent('grid_gap', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
          </div>

          {/* Card Container */}
          <div className="space-y-2 pb-2 border-b border-white/5">
            <label className="text-white/60 text-[10px] uppercase tracking-wider block font-medium">Card Container</label>
            <ColorPicker 
              label="Background" 
              value={content_data.card_bg || '#000000'} 
              onChange={(v) => updateContent('card_bg', v)} 
            />
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Padding</label>
              <select
                value={content_data.card_padding || 'md'}
                onChange={(e) => updateContent('card_padding', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Corner Radius</label>
              <select
                value={content_data.card_radius || 'lg'}
                onChange={(e) => updateContent('card_radius', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="none">None</option>
                <option value="sm">Small (4px)</option>
                <option value="md">Medium (8px)</option>
                <option value="lg">Large (12px)</option>
                <option value="xl">Extra Large (16px)</option>
                <option value="2xl">2XL (24px)</option>
              </select>
            </div>
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Border Width</label>
              <select
                value={content_data.card_border_width || '0'}
                onChange={(e) => updateContent('card_border_width', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="0">None</option>
                <option value="1">1px</option>
                <option value="2">2px</option>
                <option value="4">4px</option>
              </select>
            </div>
            {content_data.card_border_width !== '0' && (
              <ColorPicker 
                label="Border Color" 
                value={content_data.card_border_color || '#ffffff'} 
                onChange={(v) => updateContent('card_border_color', v)} 
              />
            )}
            <ColorPicker 
              label="Hover Background" 
              value={content_data.card_hover_bg || '#1a1a1a'} 
              onChange={(v) => updateContent('card_hover_bg', v)} 
            />
          </div>

          {/* Product Image */}
          <div className="space-y-2 pb-2 border-b border-white/5">
            <label className="text-white/60 text-[10px] uppercase tracking-wider block font-medium">Product Image</label>
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Aspect Ratio</label>
              <select
                value={content_data.image_aspect || 'square'}
                onChange={(e) => updateContent('image_aspect', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="square">Square (1:1)</option>
                <option value="portrait">Portrait (3:4)</option>
                <option value="landscape">Landscape (4:3)</option>
                <option value="wide">Wide (16:9)</option>
              </select>
            </div>
            <ColorPicker 
              label="Background" 
              value={content_data.image_bg || '#000000'} 
              onChange={(v) => updateContent('image_bg', v)} 
            />
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Object Fit</label>
              <select
                value={content_data.image_fit || 'contain'}
                onChange={(e) => updateContent('image_fit', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Corner Radius</label>
              <select
                value={content_data.image_radius || 'lg'}
                onChange={(e) => updateContent('image_radius', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
                <option value="2xl">2XL</option>
              </select>
            </div>
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Border Width</label>
              <select
                value={content_data.image_border_width || '0'}
                onChange={(e) => updateContent('image_border_width', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="0">None</option>
                <option value="1">1px</option>
                <option value="2">2px</option>
                <option value="4">4px</option>
                <option value="8">8px</option>
              </select>
            </div>
            {content_data.image_border_width !== '0' && (
              <ColorPicker 
                label="Border Color" 
                value={content_data.image_border_color || '#ffffff'} 
                onChange={(v) => updateContent('image_border_color', v)} 
              />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-2 pb-2 border-b border-white/5">
            <label className="text-white/60 text-[10px] uppercase tracking-wider block font-medium">Product Info</label>
            <ColorPicker 
              label="Background" 
              value={content_data.info_bg || '#000000'} 
              onChange={(v) => updateContent('info_bg', v)} 
            />
            <div>
              <label className="text-white/40 text-[11px] block mb-1 font-normal">Padding</label>
              <select
                value={content_data.info_padding || 'md'}
                onChange={(e) => updateContent('info_padding', e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            <ColorPicker 
              label="Product Name" 
              value={content_data.name_color || '#ffffff'} 
              onChange={(v) => updateContent('name_color', v)} 
            />
            <ColorPicker 
              label="Price Color" 
              value={content_data.price_color || '#ffffff'} 
              onChange={(v) => updateContent('price_color', v)} 
            />
            <ColorPicker 
              label="Field Labels" 
              value={content_data.field_label_color || '#737373'} 
              onChange={(v) => updateContent('field_label_color', v)} 
            />
            <ColorPicker 
              label="Field Values" 
              value={content_data.field_value_color || '#a3a3a3'} 
              onChange={(v) => updateContent('field_value_color', v)} 
            />
          </div>

          {/* Product Card Display */}
          <div className="space-y-2 pb-2 border-b border-white/5">
            <label className="text-white/60 text-[10px] uppercase tracking-wider block font-medium">Card Display</label>
            <CheckboxField 
              label="Quick Add Button" 
              value={content_data.show_quick_add !== false} 
              onChange={(v) => updateContent('show_quick_add', v)} 
            />
            <CheckboxField 
              label="Stock Badges" 
              value={content_data.show_stock_badge !== false} 
              onChange={(v) => updateContent('show_stock_badge', v)} 
            />
            <CheckboxField 
              label="Pricing Tiers" 
              value={content_data.show_pricing_tiers !== false} 
              onChange={(v) => updateContent('show_pricing_tiers', v)} 
            />
            <CheckboxField 
              label="Product Fields" 
              value={content_data.show_product_fields !== false} 
              onChange={(v) => updateContent('show_product_fields', v)} 
            />
            <CheckboxField 
              label="Hover Overlay" 
              value={content_data.show_hover_overlay !== false} 
              onChange={(v) => updateContent('show_hover_overlay', v)} 
            />
          </div>

          {/* Filters & Navigation */}
          <div className="space-y-2">
            <label className="text-white/60 text-[10px] uppercase tracking-wider block font-medium">Page Controls</label>
            <CheckboxField 
              label="Category Tabs" 
              value={content_data.show_categories !== false} 
              onChange={(v) => updateContent('show_categories', v)} 
            />
            <CheckboxField 
              label="Location Filter" 
              value={content_data.show_location_filter !== false} 
              onChange={(v) => updateContent('show_location_filter', v)} 
            />
            <CheckboxField 
              label="Sort Dropdown" 
              value={content_data.show_sort !== false} 
              onChange={(v) => updateContent('show_sort', v)} 
            />
          </div>
        </div>
      );
    }

    if (section_key === 'hero') {
      return (
        <div className="space-y-2">
          <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="Your bold headline..." />
          <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateContent('subheadline', v)} multiline placeholder="Supporting text..." />
          <div className="grid grid-cols-2 gap-1.5">
            <EditorField label="Primary Button" value={content_data.cta_primary?.text || ''} onChange={(v) => updateNested('cta_primary.text', v)} placeholder="Shop Now" />
            <EditorField label="Link" value={content_data.cta_primary?.link || ''} onChange={(v) => updateNested('cta_primary.link', v)} placeholder="/shop" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <EditorField label="Secondary Button" value={content_data.cta_secondary?.text || ''} onChange={(v) => updateNested('cta_secondary.text', v)} placeholder="Learn More" />
            <EditorField label="Link" value={content_data.cta_secondary?.link || ''} onChange={(v) => updateNested('cta_secondary.link', v)} placeholder="/about" />
          </div>
          <ColorPicker label="Background" value={content_data.background_color || '#000000'} onChange={(v) => updateContent('background_color', v)} />
          <SliderField label="Overlay" value={content_data.overlay_opacity || 0.6} min={0} max={1} step={0.1} onChange={(v) => updateContent('overlay_opacity', v)} />
          
          {/* Custom Fields (Vendor-Added) */}
          {customFieldsCache['hero']?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-500/20">
              <div className="text-xs text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>Custom Fields</span>
                <span className="bg-purple-500/20 px-1.5 py-0.5 rounded text-[10px]">
                  {customFieldsCache['hero'].length}
                </span>
              </div>
              {customFieldsCache['hero'].map((customField: any) => {
                const fieldDef = customField.field_definition;
                const fieldId = customField.field_id;
                
                if (fieldDef.type === 'text') {
                  return (
                    <EditorField 
                      key={fieldId}
                      label={`${fieldDef.label} 🔧`}
                      value={content_data[fieldId] || ''}
                      onChange={(v) => updateContent(fieldId, v)}
                      placeholder={fieldDef.placeholder}
                    />
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Add Custom Field Button */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <AddCustomFieldButton 
              sectionKey="hero" 
              vendorId={vendor?.id || localStorage.getItem('vendor_id') || ''} 
              onFieldAdded={() => {
                loadCustomFields(); // Reload to show new field
              }} 
            />
          </div>
        </div>
      );
    }

    if (section_key === 'process') {
      return (
        <div className="space-y-2">
          <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="How it works..." />
          <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateContent('subheadline', v)} placeholder="Simple process..." />
          <ArrayEditor 
            label="Steps" 
            items={content_data.steps || []}
            onChange={(items) => updateContent('steps', items)}
            renderItem={(item, index, onChange) => (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onChange({ ...item, title: e.target.value })}
                  placeholder="Step title"
                  className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                />
                <textarea
                  value={item.description}
                  onChange={(e) => onChange({ ...item, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:border-white/30 transition-all resize-none placeholder:text-white/20"
                />
              </div>
            )}
          />
          <ColorPicker label="Background" value={content_data.background_color || '#0a0a0a'} onChange={(v) => updateContent('background_color', v)} />
        </div>
      );
    }

    if (section_key === 'about_story' || section_key === 'story') {
      return (
        <div className="space-y-2">
          <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="Our story..." />
          <ArrayEditor 
            label="Paragraphs" 
            items={content_data.paragraphs || []}
            onChange={(items) => updateContent('paragraphs', items)}
            renderItem={(item, index, onChange) => (
              <textarea
                value={item}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Tell your story..."
                rows={2}
                className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:border-white/30 transition-all resize-none leading-relaxed placeholder:text-white/20"
              />
            )}
          />
          <ColorPicker label="Background" value={content_data.background_color || '#000000'} onChange={(v) => updateContent('background_color', v)} />
        </div>
      );
    }

    if (section_key === 'cta') {
      return (
        <div className="space-y-2">
          <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="Ready to start?" />
          <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateContent('subheadline', v)} multiline placeholder="Join thousands..." />
          <div className="grid grid-cols-2 gap-1.5">
            <EditorField label="Button Text" value={content_data.cta_button?.text || ''} onChange={(v) => updateNested('cta_button.text', v)} placeholder="Shop Now" />
            <EditorField label="Link" value={content_data.cta_button?.link || ''} onChange={(v) => updateNested('cta_button.link', v)} placeholder="/shop" />
          </div>
          <ColorPicker label="Background" value={content_data.background_color || '#000000'} onChange={(v) => updateContent('background_color', v)} />
        </div>
      );
    }

    // Fallback JSON editor for unknown section types
    return (
      <div className="space-y-2">
        {/* Dynamic Editors Based on Section Type */}
        {section_key === 'REMOVE_THIS' && (
          <>
            <div className="space-y-2">
              <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="Your bold headline..." />
              <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateContent('subheadline', v)} multiline placeholder="Supporting text..." />
              <div className="grid grid-cols-2 gap-1.5">
                <EditorField label="Primary Button" value={content_data.cta_primary?.text || ''} onChange={(v) => updateNested('cta_primary.text', v)} placeholder="Shop Now" />
                <EditorField label="Link" value={content_data.cta_primary?.link || ''} onChange={(v) => updateNested('cta_primary.link', v)} placeholder="/shop" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <EditorField label="Secondary Button" value={content_data.cta_secondary?.text || ''} onChange={(v) => updateNested('cta_secondary.text', v)} placeholder="Learn More" />
                <EditorField label="Link" value={content_data.cta_secondary?.link || ''} onChange={(v) => updateNested('cta_secondary.link', v)} placeholder="/about" />
              </div>
              <ColorPicker label="Background" value={content_data.background_color || '#000000'} onChange={(v) => updateContent('background_color', v)} />
              <SliderField label="Overlay" value={content_data.overlay_opacity || 0.6} min={0} max={1} step={0.1} onChange={(v) => updateContent('overlay_opacity', v)} />
              
              
              {/* Custom Fields (Vendor-Added) */}
              {customFieldsCache[section_key]?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                  <div className="text-xs text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>Custom Fields</span>
                    <span className="bg-purple-500/20 px-1.5 py-0.5 rounded text-[10px]">
                      {customFieldsCache[section_key].length}
                    </span>
                  </div>
                  {customFieldsCache[section_key].map((customField: any) => {
                    const fieldDef = customField.field_definition;
                    const fieldId = customField.field_id;
                    
                    if (fieldDef.type === 'text') {
                      return (
                        <EditorField 
                          key={fieldId}
                          label={`${fieldDef.label} 🔧`}
                          value={content_data[fieldId] || ''}
                          onChange={(v) => updateContent(fieldId, v)}
                          placeholder={fieldDef.placeholder}
                        />
                      );
                    } else if (fieldDef.type === 'textarea') {
                      return (
                        <EditorField 
                          key={fieldId}
                          label={`${fieldDef.label} 🔧`}
                          value={content_data[fieldId] || ''}
                          onChange={(v) => updateContent(fieldId, v)}
                          multiline
                          placeholder={fieldDef.placeholder}
                        />
                      );
                    } else if (fieldDef.type === 'color') {
                      return (
                        <ColorPicker 
                          key={fieldId}
                          label={`${fieldDef.label} 🔧`}
                          value={content_data[fieldId] || '#000000'}
                          onChange={(v) => updateContent(fieldId, v)}
                        />
                      );
                    } else if (fieldDef.type === 'boolean') {
                      return (
                        <div key={fieldId} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={content_data[fieldId] || false}
                            onChange={(e) => updateContent(fieldId, e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label className="text-white/60 text-xs">{fieldDef.label} 🔧</label>
                        </div>
                      );
                    } else if (fieldDef.type === 'url') {
                      return (
                        <EditorField 
                          key={fieldId}
                          label={`${fieldDef.label} 🔧`}
                          value={content_data[fieldId] || ''}
                          onChange={(v) => updateContent(fieldId, v)}
                          placeholder={fieldDef.placeholder || 'https://...'}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Add Custom Field Button */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <AddCustomFieldButton 
                  sectionKey="hero" 
                  vendorId={vendor?.id || localStorage.getItem('vendor_id') || ''} 
                  onFieldAdded={() => {
                    loadCustomFields(); // Reload to show new field
                  }} 
                />
              </div>
            </div>
          </>
        )}

        {section_key === 'process' && (
          <>
            <div className="space-y-2">
              <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="How it works..." />
              <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateContent('subheadline', v)} placeholder="Simple process..." />
              <ArrayEditor 
                label="Steps" 
                items={content_data.steps || []}
                onChange={(items) => updateContent('steps', items)}
                renderItem={(item, index, onChange) => (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => onChange({ ...item, title: e.target.value })}
                      placeholder="Step title"
                      className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => onChange({ ...item, description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                      className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:border-white/30 transition-all resize-none placeholder:text-white/20"
                    />
                  </div>
                )}
              />
              <ColorPicker label="Background" value={content_data.background_color || '#0a0a0a'} onChange={(v) => updateContent('background_color', v)} />
            </div>
          </>
        )}

        {section_key === 'about_story' && (
          <>
            <div className="space-y-2">
              <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="Our story..." />
              <ArrayEditor 
                label="Paragraphs" 
                items={content_data.paragraphs || []}
                onChange={(items) => updateContent('paragraphs', items)}
                renderItem={(item, index, onChange) => (
                  <textarea
                    value={item}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Tell your story..."
                    rows={2}
                    className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:border-white/30 transition-all resize-none leading-relaxed placeholder:text-white/20"
                  />
                )}
              />
              <ColorPicker label="Background" value={content_data.background_color || '#000000'} onChange={(v) => updateContent('background_color', v)} />
            </div>
          </>
        )}

        {section_key === 'cta' && (
          <>
            <div className="space-y-2">
              <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateContent('headline', v)} placeholder="Ready to start?" />
              <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateContent('subheadline', v)} multiline placeholder="Join thousands..." />
              <div className="grid grid-cols-2 gap-1.5">
                <EditorField label="Button Text" value={content_data.cta_button?.text || ''} onChange={(v) => updateNested('cta_button.text', v)} placeholder="Shop Now" />
                <EditorField label="Link" value={content_data.cta_button?.link || ''} onChange={(v) => updateNested('cta_button.link', v)} placeholder="/shop" />
              </div>
              <ColorPicker label="Background" value={content_data.background_color || '#000000'} onChange={(v) => updateContent('background_color', v)} />
            </div>
          </>
        )}

        {section_key === 'shop_config' && (
          <>
            <div className="space-y-2">
              <div>
                <label className="text-white/40 text-[11px] block mb-1 font-normal">Grid Columns</label>
                <select
                  value={content_data.grid_columns || 3}
                  onChange={(e) => updateContent('grid_columns', parseInt(e.target.value))}
                  className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-[11px] block mb-1 font-normal">Card Style</label>
                <select
                  value={content_data.card_style || 'card'}
                  onChange={(e) => updateContent('card_style', e.target.value)}
                  className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
                >
                  <option value="minimal">Minimal</option>
                  <option value="card">Card</option>
                  <option value="bordered">Bordered</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-[11px] block mb-1 font-normal">Corner Radius</label>
                <select
                  value={content_data.corner_radius || 'lg'}
                  onChange={(e) => updateContent('corner_radius', e.target.value)}
                  className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
                >
                  <option value="none">None</option>
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                  <option value="xl">Extra Large</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-[11px] block mb-1 font-normal">Image Aspect</label>
                <select
                  value={content_data.image_aspect || 'square'}
                  onChange={(e) => updateContent('image_aspect', e.target.value)}
                  className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all"
                >
                  <option value="square">Square (1:1)</option>
                  <option value="portrait">Portrait (3:4)</option>
                  <option value="landscape">Landscape (4:3)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Fallback JSON Editor */}
        {!['hero', 'process', 'about_story', 'cta', 'shop_config'].includes(section_key) && (
          <div>
            <label className="text-white/40 text-[11px] block mb-1 font-normal">Section Data</label>
            <textarea
              value={JSON.stringify(content_data, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setSections(sections.map(s => 
                    s.id === id ? { ...section, content_data: parsed } : s
                  ));
                  setHasUnsavedChanges(true);
                } catch (error) {
                  // Invalid JSON
                }
              }}
              rows={10}
              className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded font-mono text-[11px] leading-[1.6] focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>
        )}
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  const previewUrl = `/storefront?vendor=${vendor.slug}&preview=true&t=${previewKey}`;
  const availableSections = getSectionsForPage(selectedPage);

  // Group sections by category
  const sectionsByCategory = availableSections.reduce((acc, section) => {
    if (!acc[section.category]) acc[section.category] = [];
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, SectionTemplate[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col">
      {/* Ultra-Minimal Toolbar */}
      <div className="h-10 bg-[#000000] border-b border-[#1a1a1a] flex items-center justify-between px-3 flex-shrink-0">
        {/* Left */}
        <div className="flex items-center gap-2">
          <a href="/vendor/dashboard" className="text-[#6a6a6a] hover:text-white text-xs transition-colors">
            ←
          </a>
          <div className="w-px h-3 bg-[#1a1a1a]" />
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="bg-[#0a0a0a] border-0 text-white text-xs font-medium px-2 py-1 rounded focus:outline-none cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            {pages.map(page => (
              <option key={page.id} value={page.id} className="bg-[#1a1a1a]">{page.name}</option>
            ))}
          </select>
        </div>
        
        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Device Toggle - Dark */}
          <div className="flex gap-px bg-[#0a0a0a] rounded p-px">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-sm transition-all ${
                previewDevice === 'desktop'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#6a6a6a] hover:text-white'
              }`}
            >
              <Monitor size={12} />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-sm transition-all ${
                previewDevice === 'mobile'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#6a6a6a] hover:text-white'
              }`}
            >
              <Smartphone size={12} />
            </button>
          </div>

          {/* Status Dot Only */}
          {saving ? (
            <Loader2 size={10} className="animate-spin text-white/40" />
          ) : hasUnsavedChanges ? (
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" title="Unsaved changes"></span>
          ) : lastSaved ? (
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Saved"></span>
          ) : null}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Cursor AI Style */}
        <div className="w-[260px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col overflow-hidden flex-shrink-0">
          {/* Content - No header, start immediately */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-1.5">
              
              {loading ? (
                <div className="text-white/30 text-xs text-center py-8">
                  <Loader2 className="animate-spin mx-auto mb-2 text-white/30" size={16} />
                  Loading...
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowSectionLibrary(true)}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white hover:bg-white/5 px-2 py-1.5 rounded text-[11px] transition-colors w-full mb-1"
                  >
                    <Plus size={12} />
                    Add Section
                  </button>
                  <button 
                    onClick={() => setActiveTab(activeTab === 'fields' ? 'sections' : 'fields')}
                    className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2 py-1.5 rounded text-[11px] transition-colors w-full mb-1"
                  >
                    <Settings size={12} />
                    {activeTab === 'fields' ? 'Back to Sections' : 'Manage Custom Fields'}
                  </button>
                </>
              )}
              
              {/* Fields Manager Tab - Full Featured */}
              {activeTab === 'fields' && (
                <div className="h-full">
                  <FieldLibraryPanel
                    customFields={Object.values(customFieldsCache).flat()}
                    onAddField={async (sectionKey, fieldConfig) => {
                      // Handle adding field
                      console.log('Add field:', sectionKey, fieldConfig);
                    }}
                    onEditField={async (fieldId, updates) => {
                      // Handle editing field
                      const vendorId = localStorage.getItem('vendor_id');
                      // Update API call would go here
                      console.log('Edit field:', fieldId, updates);
                      loadCustomFields();
                    }}
                    onDeleteField={async (fieldId) => {
                      if (confirm('Delete this custom field?')) {
                        const vendorId = localStorage.getItem('vendor_id');
                        const response = await fetch(`/api/vendor/custom-fields?id=${fieldId}`, {
                          method: 'DELETE',
                          headers: { 'x-vendor-id': vendorId! }
                        });
                        if (response.ok) {
                          loadCustomFields();
                        }
                      }
                    }}
                    onRefresh={loadCustomFields}
                  />
                </div>
              )}
              
              {!loading && sections.length > 0 && activeTab === 'sections' && (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-1.5"
                        >
                          {sections.map((section, index) => {
                            const meta = SECTION_LIBRARY.find(s => s.key === section.section_key);
                            return (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`group rounded transition-all ${
                                      expandedSections.has(section.id)
                                        ? 'bg-white/5 mb-2'
                                        : ''
                                    } ${snapshot.isDragging ? 'bg-white/5' : ''}`}
                                  >
                                    {/* Section Header - Collapsible */}
                                    <div
                                      onClick={() => toggleSectionExpansion(section.id)}
                                      className="flex items-center gap-1 px-1.5 py-1 cursor-pointer hover:bg-white/[0.02] rounded"
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-white/10 hover:text-white/30 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical size={10} />
                                      </div>
                                      <ChevronDown 
                                        size={10} 
                                        className={`text-white/20 transition-transform ${expandedSections.has(section.id) ? 'rotate-0' : '-rotate-90'}`} 
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white/80 text-[11px] font-normal capitalize truncate">
                                          {section.section_key.replace(/_/g, ' ')}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-px opacity-0 group-hover:opacity-100">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            duplicateSection(section.id);
                                          }}
                                          className="text-white/20 hover:text-white/60 p-0.5 rounded"
                                          title="Duplicate"
                                        >
                                          <Plus size={9} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSection(section.id);
                                          }}
                                          className="text-white/20 hover:text-white/60 p-0.5 rounded"
                                          title={section.is_enabled ? 'Hide' : 'Show'}
                                        >
                                          {section.is_enabled ? <Eye size={9} /> : <EyeOff size={9} />}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSection(section.id);
                                          }}
                                          className="text-white/20 hover:text-red-400 p-0.5 rounded"
                                          title="Delete"
                                        >
                                          <Trash2 size={9} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Expanded Editor - Inline */}
                                    {expandedSections.has(section.id) && (
                                      <div className="px-1.5 pb-2 pt-1">
                                        {renderSectionEditorInline(section)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}

            </div>
          </div>
        </div>

        {/* Right Side - Edge-to-Edge Preview */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
          <div className={`flex-1 flex items-center justify-center overflow-hidden ${previewDevice === 'desktop' ? 'p-0' : 'p-8'}`}>
            <div 
              className={`bg-white overflow-hidden transition-all duration-300 ${
                previewDevice === 'mobile' 
                  ? 'w-[430px] h-[932px] rounded-[3.75rem] border-[18px] border-[#1d1d1f] shadow-2xl' 
                  : 'w-full h-full'
              }`}
              style={previewDevice === 'mobile' ? {
                boxShadow: '0 0 0 3px #2d2d2f, 0 30px 60px -15px rgba(0, 0, 0, 0.9)',
                transform: 'scale(0.95)'
              } : {}}
            >
              <iframe
                id="preview-iframe"
                key={previewKey}
                src={previewUrl}
                className="w-full h-full border-0 bg-white"
                title="Storefront Preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Library - Dark */}
      {showSectionLibrary && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center pt-20">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg max-w-2xl w-full max-h-[500px] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-white/10">
              <Plus size={14} className="text-white/40" />
              <h2 className="text-sm font-normal text-white flex-1">Add Section</h2>
              <button
                onClick={() => setShowSectionLibrary(false)}
                className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {availableSections.map((template) => (
                <button
                  key={template.key}
                  onClick={() => addSection(template)}
                  className="flex items-center gap-3 p-3 w-full text-left border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-xs font-normal">{template.name}</span>
                      <span className="text-[9px] text-white/30 px-1.5 py-0.5 bg-white/5 rounded">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-white/40 text-[10px] leading-relaxed">{template.description}</p>
                  </div>
                  <Plus size={11} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components - Dark Theme
function EditorField({ label, value, onChange, multiline = false, placeholder = '' }: any) {
  return (
    <div>
      <label className="text-white/40 text-[11px] block mb-1 font-normal">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] leading-[1.6] focus:outline-none focus:border-white/30 transition-all resize-none font-normal placeholder:text-white/20"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[13px] focus:outline-none focus:border-white/30 transition-all font-normal placeholder:text-white/20"
        />
      )}
    </div>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-white/40 text-[11px] block mb-1 font-normal">
        {label}
      </label>
      <div className="flex gap-1.5">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent opacity-0 absolute inset-0"
          />
          <div 
            className="w-8 h-8 rounded border border-white/10 pointer-events-none"
            style={{ backgroundColor: value }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-black border border-white/10 text-white px-2 py-1.5 rounded text-[12px] font-mono focus:outline-none focus:border-white/30 transition-all uppercase"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-white/40 text-[11px] font-normal">{label}</label>
        <span className="text-white/60 text-[11px] font-mono tabular-nums">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer slider-modern"
        style={{
          background: `linear-gradient(to right, white 0%, white ${value * 100}%, rgba(255,255,255,0.1) ${value * 100}%, rgba(255,255,255,0.1) 100%)`
        }}
      />
    </div>
  );
}

function ArrayEditor({ label, items, onChange, renderItem }: any) {
  const addItem = () => {
    onChange([...items, {}]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_: any, i: number) => i !== index));
  };

  const updateItem = (index: number, newItem: any) => {
    onChange(items.map((item: any, i: number) => i === index ? newItem : item));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-white/40 text-[11px] font-normal">
          {label}
          <span className="text-white/20 ml-1">({items.length})</span>
        </label>
        <button
          onClick={addItem}
          className="text-white/50 hover:text-white text-[10px] flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-all"
        >
          <Plus size={10} />
          Add
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item: any, index: number) => (
          <div key={index} className="bg-black border border-white/10 p-2 rounded group hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/30 text-[10px]">Item {index + 1}</span>
              <button
                onClick={() => removeItem(index)}
                className="text-white/30 hover:text-red-400 p-0.5 rounded transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={10} />
              </button>
            </div>
            {renderItem(item, index, (newItem: any) => updateItem(index, newItem))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckboxField({ label, value, onChange }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group py-1">
      <div className="relative">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="w-4 h-4 border-2 border-white/20 rounded bg-black peer-checked:bg-white peer-checked:border-white transition-all group-hover:border-white/40">
          {value && (
            <svg className="w-full h-full text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-white/70 text-[11px] font-normal group-hover:text-white transition-colors select-none">
        {label}
      </span>
    </label>
  );
}
