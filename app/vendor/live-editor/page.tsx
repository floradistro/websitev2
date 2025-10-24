// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Save, Eye, Monitor, Smartphone, Plus, Trash2, EyeOff, GripVertical, Loader2, RefreshCw, Layout, Settings, Palette, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SECTION_LIBRARY, getSectionsForPage, SectionTemplate } from '@/lib/storefront/section-library';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ContentSection {
  id: string;
  page_type: string;
  section_key: string;
  section_order: number;
  is_enabled: boolean;
  content_data: any;
}

export default function LiveEditorV2() {
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
  const [activeTab, setActiveTab] = useState<'sections' | 'design' | 'settings'>('sections');
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['hero', 'content', 'features']);

  const pages = [
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'about', name: 'About', icon: '📖' },
    { id: 'contact', name: 'Contact', icon: '📧' },
    { id: 'faq', name: 'FAQ', icon: '❓' },
  ];

  useEffect(() => {
    if (vendor) {
      loadSections();
      updatePreviewPage();
    }
  }, [selectedPage, vendor]);

  function updatePreviewPage() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe && vendor) {
      let pageUrl = '';
      switch (selectedPage) {
        case 'home':
          pageUrl = `/storefront?vendor=${vendor.slug}&preview=true`;
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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return; // Security

      if (event.data.type === 'PREVIEW_READY') {
        console.log('✅ Preview iframe is ready');
        setIframeReady(true);
        // Reload sections to preview after a short delay
        setTimeout(() => reloadPreviewSections(), 200);
      }
      
      // Listen for page navigation inside iframe
      if (event.data.type === 'PAGE_CHANGED') {
        const newPage = event.data.page;
        console.log('📄 Page changed in iframe to:', newPage, '(current:', selectedPage, ')');
        if (newPage && newPage !== selectedPage) {
          console.log('🔄 Updating editor to match iframe page');
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
      console.log('📤 Sending RELOAD_SECTIONS for page:', selectedPage, 'Count:', sections.filter(s => s.page_type === selectedPage).length);
      iframe.contentWindow.postMessage({
        type: 'RELOAD_SECTIONS',
        data: { sections: sections.filter(s => s.page_type === selectedPage) }
      }, '*');
    }
  }
  
  // Reload preview when sections change OR when page changes
  useEffect(() => {
    if (iframeReady) {
      console.log(`🔄 Sections or page changed, reloading preview for ${selectedPage}`);
      setTimeout(() => reloadPreviewSections(), 100);
    }
  }, [sections, selectedPage, iframeReady]);

  async function loadSections() {
    setLoading(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      console.log(`🔄 Loading sections for page: ${selectedPage}, vendor: ${vendorId}`);
      const response = await fetch(`/api/vendor/content?page_type=${selectedPage}&vendor_id=${vendorId}`);
      const data = await response.json();
      
      if (data.success) {
        const sorted = (data.sections || []).sort((a: ContentSection, b: ContentSection) => 
          a.section_order - b.section_order
        );
        console.log(`✅ Loaded ${sorted.length} sections for ${selectedPage}`);
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
    setSaving(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      for (const section of sections) {
        await fetch(`/api/vendor/content?vendor_id=${vendorId}`, {
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
      }
      
      alert('✅ Changes saved successfully!');
      setHasUnsavedChanges(false);
      refreshPreview();
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function refreshPreview() {
    setPreviewKey(prev => prev + 1);
    setIframeReady(false);
  }

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
    if (!confirm('Are you sure you want to delete this section?')) return;

    setSections(sections.filter(s => s.id !== sectionId));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(sections[0] || null);
    }
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

  function renderSectionEditor() {
    if (!selectedSection) return null;

    const { section_key, content_data } = selectedSection;
    const sectionMeta = SECTION_LIBRARY.find(s => s.key === section_key);

    return (
      <div className="space-y-6">
        {/* Section Info */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{sectionMeta?.icon || '📄'}</span>
            <div>
              <h4 className="text-white font-semibold">{sectionMeta?.name || section_key}</h4>
              <p className="text-white/50 text-xs">{sectionMeta?.description}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Editors Based on Section Type */}
        {section_key === 'hero' && (
          <>
            <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateSectionContent('headline', v)} />
            <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateSectionContent('subheadline', v)} multiline />
            <EditorField label="Primary Button Text" value={content_data.cta_primary?.text || ''} onChange={(v) => updateNestedContent('cta_primary.text', v)} />
            <EditorField label="Primary Button Link" value={content_data.cta_primary?.link || ''} onChange={(v) => updateNestedContent('cta_primary.link', v)} />
            <EditorField label="Secondary Button Text" value={content_data.cta_secondary?.text || ''} onChange={(v) => updateNestedContent('cta_secondary.text', v)} />
            <ColorPicker label="Background Color" value={content_data.background_color || '#000000'} onChange={(v) => updateSectionContent('background_color', v)} />
            <SliderField label="Overlay Opacity" value={content_data.overlay_opacity || 0.6} min={0} max={1} step={0.1} onChange={(v) => updateSectionContent('overlay_opacity', v)} />
          </>
        )}

        {section_key === 'process' && (
          <>
            <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateSectionContent('headline', v)} />
            <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateSectionContent('subheadline', v)} />
            <ColorPicker label="Background Color" value={content_data.background_color || '#0a0a0a'} onChange={(v) => updateSectionContent('background_color', v)} />
            <ArrayEditor 
              label="Steps" 
              items={content_data.steps || []}
              onChange={(items) => updateSectionContent('steps', items)}
              renderItem={(item, index, onChange) => (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                    placeholder="Step title"
                    className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded text-sm"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) => onChange({ ...item, description: e.target.value })}
                    placeholder="Step description"
                    rows={2}
                    className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded text-sm"
                  />
                </div>
              )}
            />
          </>
        )}

        {section_key === 'about_story' && (
          <>
            <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateSectionContent('headline', v)} />
            <ArrayEditor 
              label="Paragraphs" 
              items={content_data.paragraphs || []}
              onChange={(items) => updateSectionContent('paragraphs', items)}
              renderItem={(item, index, onChange) => (
                <textarea
                  value={item}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={`Paragraph ${index + 1}`}
                  rows={3}
                  className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded text-sm"
                />
              )}
            />
            <ColorPicker label="Background Color" value={content_data.background_color || '#000000'} onChange={(v) => updateSectionContent('background_color', v)} />
          </>
        )}

        {section_key === 'cta' && (
          <>
            <EditorField label="Headline" value={content_data.headline || ''} onChange={(v) => updateSectionContent('headline', v)} />
            <EditorField label="Subheadline" value={content_data.subheadline || ''} onChange={(v) => updateSectionContent('subheadline', v)} multiline />
            <EditorField label="Button Text" value={content_data.cta_button?.text || ''} onChange={(v) => updateNestedContent('cta_button.text', v)} />
            <EditorField label="Button Link" value={content_data.cta_button?.link || ''} onChange={(v) => updateNestedContent('cta_button.link', v)} />
            <ColorPicker label="Background Color" value={content_data.background_color || '#000000'} onChange={(v) => updateSectionContent('background_color', v)} />
          </>
        )}

        {/* Fallback JSON Editor */}
        {!['hero', 'process', 'about_story', 'cta'].includes(section_key) && (
          <div>
            <label className="text-white/80 text-xs block mb-2 uppercase tracking-wider">Content (JSON)</label>
            <textarea
              value={JSON.stringify(content_data, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setSelectedSection({ ...selectedSection, content_data: parsed });
                  setSections(sections.map(s => 
                    s.id === selectedSection.id ? { ...selectedSection, content_data: parsed } : s
                  ));
                  setHasUnsavedChanges(true);
                } catch (error) {
                  // Invalid JSON
                }
              }}
              rows={12}
              className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded font-mono text-xs"
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
      {/* Top Bar */}
      <div className="h-14 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <a href="/vendor/dashboard" className="text-white/60 hover:text-white text-sm transition-colors">
            ← Dashboard
          </a>
          <div className="w-px h-6 bg-white/10" />
          <h1 className="text-white font-semibold text-sm">Live Editor</h1>
          
          {/* Page Selector */}
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="bg-black border border-white/20 text-white px-4 py-2 rounded text-sm font-medium hover:border-white/40 transition-colors"
          >
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.icon} {page.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Device Toggle */}
          <div className="flex gap-1 bg-black rounded p-1 border border-white/20">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`px-3 py-1.5 rounded text-xs transition-all font-medium ${
                previewDevice === 'desktop'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Monitor size={14} className="inline mr-1.5" />
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`px-3 py-1.5 rounded text-xs transition-all font-medium ${
                previewDevice === 'tablet'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Monitor size={14} className="inline mr-1.5" />
              Tablet
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`px-3 py-1.5 rounded text-xs transition-all font-medium ${
                previewDevice === 'mobile'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Smartphone size={14} className="inline mr-1.5" />
              Mobile
            </button>
          </div>

          <button
            onClick={refreshPreview}
            className="text-white/60 hover:text-white p-2 rounded hover:bg-white/5 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw size={16} />
          </button>

          {hasUnsavedChanges && (
            <span className="text-yellow-500 text-xs font-medium bg-yellow-500/10 px-3 py-1.5 rounded">
              Unsaved changes
            </span>
          )}
          
          <button
            onClick={saveAllChanges}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded text-sm font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/20"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
          
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-white/20 text-white px-4 py-2 rounded text-sm font-medium hover:border-white/40 hover:bg-white/5 transition-colors"
          >
            <Eye size={14} />
            View Live
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Editor */}
        <div className="w-[400px] bg-[#1a1a1a] border-r border-white/10 flex flex-col overflow-hidden flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-[#141414] flex-shrink-0">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'sections'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Layout size={16} className="inline mr-2" />
              Sections
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'design'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Palette size={16} className="inline mr-2" />
              Design
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Settings size={16} className="inline mr-2" />
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'sections' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                    Page Sections ({sections.length})
                  </h3>
                  <button 
                    onClick={() => setShowSectionLibrary(true)}
                    className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-white/20"
                  >
                    <Plus size={14} />
                    Add Section
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-white/40 text-sm text-center py-12">
                    <Loader2 className="animate-spin mx-auto mb-3" size={24} />
                    Loading sections...
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-white/30 text-5xl mb-4">📄</div>
                    <p className="text-white/50 text-sm mb-4">No sections yet</p>
                    <button 
                      onClick={() => setShowSectionLibrary(true)}
                      className="text-white text-sm font-medium hover:underline"
                    >
                      Add your first section
                    </button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {sections.map((section, index) => {
                            const meta = SECTION_LIBRARY.find(s => s.key === section.section_key);
                            return (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    onClick={() => setSelectedSection(section)}
                                    className={`group p-3 border rounded-lg cursor-pointer transition-all ${
                                      selectedSection?.id === section.id
                                        ? 'bg-white/10 border-white/30 shadow-lg'
                                        : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                                    } ${snapshot.isDragging ? 'shadow-2xl shadow-white/20' : ''}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical size={16} />
                                      </div>
                                      <span className="text-xl">{meta?.icon || '📄'}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-medium capitalize truncate">
                                          {meta?.name || section.section_key.replace('_', ' ')}
                                        </div>
                                        <div className="text-white/40 text-xs truncate">
                                          {section.content_data.headline || section.content_data.title || 'Click to edit'}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSection(section.id);
                                          }}
                                          className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                                          title={section.is_enabled ? 'Hide section' : 'Show section'}
                                        >
                                          {section.is_enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSection(section.id);
                                          }}
                                          className="text-white/40 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                          title="Delete section"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
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

                {/* Section Editor */}
                {selectedSection && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Edit Section
                    </h4>
                    {renderSectionEditor()}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'design' && (
              <div className="p-4">
                <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-4">
                  Global Design Settings
                </h3>
                <p className="text-white/50 text-sm">
                  Global theme customization coming soon...
                </p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-4">
                <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-4">
                  Page Settings
                </h3>
                <p className="text-white/50 text-sm">
                  SEO, meta tags, and page settings coming soon...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
          <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">
            <div 
              className={`bg-white shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 ${
                previewDevice === 'mobile' 
                  ? 'w-[393px] h-[852px] rounded-[3.5rem] border-[16px] border-[#1d1d1f]' 
                  : previewDevice === 'tablet'
                  ? 'w-[820px] h-[1180px] rounded-[2.5rem] border-[14px] border-[#1d1d1f]'
                  : 'w-full h-full rounded-lg'
              }`}
              style={previewDevice === 'mobile' ? {
                boxShadow: '0 0 0 2px #2d2d2f, 0 25px 50px -12px rgba(0, 0, 0, 0.8)'
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

      {/* Section Library Modal */}
      {showSectionLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Add Section</h2>
                <p className="text-white/50 text-sm">Choose a section to add to your page</p>
              </div>
              <button
                onClick={() => setShowSectionLibrary(false)}
                className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {Object.entries(sectionsByCategory).map(([category, sectionsInCategory]) => (
                <div key={category} className="mb-6">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full text-left mb-3 group"
                  >
                    <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                      {category}
                    </h3>
                    {expandedCategories.includes(category) ? (
                      <ChevronUp size={16} className="text-white/40 group-hover:text-white/60" />
                    ) : (
                      <ChevronDown size={16} className="text-white/40 group-hover:text-white/60" />
                    )}
                  </button>
                  
                  {expandedCategories.includes(category) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sectionsInCategory.map((template) => (
                        <button
                          key={template.key}
                          onClick={() => addSection(template)}
                          className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 rounded-lg transition-all text-left group"
                        >
                          <span className="text-3xl flex-shrink-0">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium mb-1 group-hover:text-white/90">{template.name}</h4>
                            <p className="text-white/50 text-xs leading-relaxed">{template.description}</p>
                          </div>
                          <Plus size={18} className="text-white/30 group-hover:text-white/60 flex-shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function EditorField({ label, value, onChange, multiline = false }: any) {
  return (
    <div>
      <label className="text-white/80 text-xs block mb-2 uppercase tracking-wider font-medium">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded focus:border-white/40 transition-colors text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded focus:border-white/40 transition-colors text-sm"
        />
      )}
    </div>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-white/80 text-xs block mb-2 uppercase tracking-wider font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 rounded cursor-pointer border border-white/20 bg-black"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-black border border-white/20 text-white px-3 py-2 rounded text-sm font-mono focus:border-white/40 transition-colors"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: any) {
  return (
    <div>
      <label className="text-white/80 text-xs block mb-2 uppercase tracking-wider font-medium">
        {label}: {(value * 100).toFixed(0)}%
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-white h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
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
      <div className="flex items-center justify-between mb-2">
        <label className="text-white/80 text-xs uppercase tracking-wider font-medium">
          {label} ({items.length})
        </label>
        <button
          onClick={addItem}
          className="text-white/60 hover:text-white text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item: any, index: number) => (
          <div key={index} className="bg-white/5 border border-white/10 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs font-medium">Item {index + 1}</span>
              <button
                onClick={() => removeItem(index)}
                className="text-white/40 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
            {renderItem(item, index, (newItem: any) => updateItem(index, newItem))}
          </div>
        ))}
      </div>
    </div>
  );
}

