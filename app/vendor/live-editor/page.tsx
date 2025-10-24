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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  function renderSectionEditor() {
    if (!selectedSection) return null;

    const { section_key, content_data } = selectedSection;

    return (
      <div className="space-y-4">

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
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Minimal Top Bar */}
      <div className="h-12 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <a href="/vendor/dashboard" className="text-white/50 hover:text-white text-xs transition-colors">
            ← Back
          </a>
          <div className="w-px h-4 bg-white/10" />
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="bg-transparent border-0 text-white text-sm font-medium focus:outline-none cursor-pointer hover:text-white/80 transition-colors"
          >
            {pages.map(page => (
              <option key={page.id} value={page.id} className="bg-[#1a1a1a]">{page.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Device Toggle */}
          <div className="flex gap-0.5 bg-white/5 rounded-md p-0.5">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2 rounded transition-all ${
                previewDevice === 'desktop'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              title="Desktop"
            >
              <Monitor size={13} />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2 rounded transition-all ${
                previewDevice === 'mobile'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              title="Mobile"
            >
              <Smartphone size={13} />
            </button>
          </div>

          {/* Status */}
          <div className="text-[10px] text-white/40 flex items-center gap-1.5 min-w-[60px]">
            {saving ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                <span>Saving</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                <span>Unsaved</span>
              </>
            ) : lastSaved ? (
              <>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>Saved</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Compact */}
        <div className="w-[320px] bg-[#0a0a0a] border-r border-white/5 flex flex-col overflow-hidden flex-shrink-0">
          {/* Compact Header */}
          <div className="p-3 border-b border-white/5 bg-[#0a0a0a] flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/90 text-xs font-semibold uppercase tracking-wider">Sections</h3>
              <span className="text-white/30 text-[10px]">{sections.length}</span>
            </div>
            <button 
              onClick={() => setShowSectionLibrary(true)}
              className="flex items-center gap-1.5 text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded text-xs font-medium transition-colors border border-white/10 w-full justify-center"
            >
              <Plus size={12} />
              Add Section
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              
              {loading ? (
                <div className="text-white/40 text-xs text-center py-8">
                  <Loader2 className="animate-spin mx-auto mb-2" size={16} />
                  Loading...
                </div>
              ) : sections.length === 0 ? (
                <div className="text-center py-8 px-3">
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Layout size={18} className="text-white/20" />
                  </div>
                  <p className="text-white/40 text-xs mb-3">No sections</p>
                  <button 
                    onClick={() => setShowSectionLibrary(true)}
                    className="text-white/60 text-[10px] font-medium hover:text-white transition-colors"
                  >
                    Add first section
                  </button>
                </div>
              ) : (
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
                                    onClick={() => setSelectedSection(section)}
                                    className={`group p-2.5 border rounded cursor-pointer transition-all ${
                                      selectedSection?.id === section.id
                                        ? 'bg-white/10 border-white/20'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                                    } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical size={12} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white text-[11px] font-medium capitalize truncate">
                                          {section.section_key.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-white/25 text-[9px] truncate mt-0.5 leading-tight">
                                          {section.content_data.headline || section.content_data.title || '—'}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            duplicateSection(section.id);
                                          }}
                                          className="text-white/25 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                                          title="Duplicate"
                                        >
                                          <Plus size={11} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSection(section.id);
                                          }}
                                          className="text-white/25 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                                          title={section.is_enabled ? 'Hide' : 'Show'}
                                        >
                                          {section.is_enabled ? <Eye size={11} /> : <EyeOff size={11} />}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSection(section.id);
                                          }}
                                          className="text-white/25 hover:text-red-400 p-0.5 rounded hover:bg-red-500/10 transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={11} />
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
                <div className="mt-4 pt-4 border-t border-white/5">
                  <h4 className="text-white/60 text-[10px] font-semibold mb-3 uppercase tracking-wider px-1">
                    {selectedSection.section_key.replace(/_/g, ' ')}
                  </h4>
                  <div className="px-1">
                    {renderSectionEditor()}
                  </div>
                </div>
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

      {/* Section Library Modal */}
      {showSectionLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-white">Add Section</h2>
                <p className="text-white/40 text-xs mt-1">Choose a section type</p>
              </div>
              <button
                onClick={() => setShowSectionLibrary(false)}
                className="text-white/50 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableSections.map((template) => (
                  <button
                    key={template.key}
                    onClick={() => addSection(template)}
                    className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 rounded-lg transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium text-sm">{template.name}</h4>
                        <span className="text-[10px] uppercase tracking-wider text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs leading-relaxed">{template.description}</p>
                    </div>
                    <Plus size={16} className="text-white/30 group-hover:text-white flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components - Compact & Modern
function EditorField({ label, value, onChange, multiline = false }: any) {
  return (
    <div>
      <label className="text-white/50 text-[10px] block mb-1.5 font-medium">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full bg-white/5 border border-white/10 text-white px-2.5 py-2 rounded text-xs focus:border-white/30 focus:bg-white/10 transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white px-2.5 py-2 rounded text-xs focus:border-white/30 focus:bg-white/10 transition-all"
        />
      )}
    </div>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-white/50 text-[10px] block mb-1.5 font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-9 rounded cursor-pointer border border-white/10 bg-white/5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white px-2.5 py-2 rounded text-xs font-mono focus:border-white/30 focus:bg-white/10 transition-all"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-white/50 text-[10px] font-medium">{label}</label>
        <span className="text-white/40 text-[10px]">{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-white h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
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

