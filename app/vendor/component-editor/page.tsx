/**
 * Component Editor - Cursor AI Style
 * Configurable panels, sliding views, AI-ready
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Save, Eye, Monitor, Smartphone, Plus, Trash2, GripVertical, RefreshCw, 
  ChevronDown, ChevronRight, X, Code, Layers, Palette, Sparkles, 
  Command, Terminal, FileCode, Box, Image as ImageIcon,
  Undo, Redo, Copy, Settings, Layout, Grid3x3, PanelBottomOpen, 
  PanelBottomClose, Maximize2, MessageSquare, FileText, Wand2, Store, Lightbulb
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ComponentInstanceEditor } from '@/components/vendor/ComponentInstanceEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Section {
  id: string;
  section_key: string;
  section_order: number;
  page_type: string;
}

interface ComponentInstance {
  id: string;
  section_id: string;
  component_key: string;
  props: Record<string, any>;
  field_bindings?: Record<string, any>;
  position_order: number;
  container_config?: Record<string, any>;
  is_enabled: boolean;
  is_visible?: boolean;
}

type ViewMode = 'visual' | 'code' | 'split';
type LeftPanel = 'explorer' | 'library' | 'layers' | 'marketplace';
type BottomPanel = 'code' | 'suggestions' | null;

const COMPONENT_TYPES = [
  { key: 'text', label: 'Text', icon: '📝', category: 'Basic' },
  { key: 'image', label: 'Image/Logo', icon: '🖼️', category: 'Basic' },
  { key: 'button', label: 'Button', icon: '🔘', category: 'Basic' },
  { key: 'spacer', label: 'Spacer', icon: '↕️', category: 'Basic' },
  { key: 'icon', label: 'Icon', icon: '✨', category: 'Basic' },
  { key: 'divider', label: 'Divider', icon: '➖', category: 'Basic' },
  { key: 'smart_product_grid', label: 'Product Grid', icon: '▦', category: 'Smart' },
  { key: 'smart_product_detail', label: 'Product Detail', icon: '🏷️', category: 'Smart' },
  { key: 'smart_locations', label: 'Locations', icon: '📍', category: 'Smart' },
  { key: 'smart_reviews', label: 'Reviews', icon: '⭐', category: 'Smart' },
];

// Phase 4: Sortable Section Item
interface SortableSectionItemProps {
  section: Section;
  isExpanded: boolean;
  componentCount: number;
  isTargetForAi: boolean;
  hasNewComponents: boolean;
  onToggle: () => void;
  onAddComponent: () => void;
  onSetAiTarget: () => void;
  children?: React.ReactNode;
}

function SortableSectionItem({
  section,
  isExpanded,
  componentCount,
  isTargetForAi,
  hasNewComponents,
  onToggle,
  onAddComponent,
  onSetAiTarget,
  children,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} className="mb-1">
      <div className={`flex items-center group ${isTargetForAi ? 'bg-neutral-900/50 border-l-2 border-neutral-600' : ''} ${hasNewComponents ? 'border-l-2 border-neutral-700' : ''}`}>
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag section to reorder"
        >
          <GripVertical size={11} strokeWidth={2} />
        </button>
        <button
          onClick={onToggle}
          onDoubleClick={onSetAiTarget}
          className="flex-1 flex items-center justify-between px-2 py-1 hover:bg-neutral-900/30 transition-colors"
          title="Click to expand, double-click to edit section"
        >
          <div className="flex items-center gap-1.5">
            {isExpanded ? <ChevronDown size={11} className="text-neutral-600" /> : <ChevronRight size={11} className="text-neutral-600" />}
            <span className="text-[11px] text-neutral-400 font-medium">{section.section_key}</span>
            {hasNewComponents && (
              <span className="text-[8px] text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded">new</span>
            )}
          </div>
          <span className="text-[10px] text-neutral-700">{componentCount}</span>
        </button>
                        <button
                          onClick={onSetAiTarget}
                          className={`p-1 text-neutral-600 hover:text-neutral-400 opacity-0 group-hover:opacity-100 transition-all ${isTargetForAi ? 'opacity-100 text-neutral-400' : ''}`}
                          title="Set as AI target"
                        >
                          <Sparkles size={11} />
                        </button>
                        <button
                          onClick={onAddComponent}
                          className="p-1 text-neutral-600 hover:text-neutral-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Add component"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      {children}
                    </div>
                  );
                }
                
                // Section Editor Component
                interface SectionEditorProps {
                  section: Section;
                  onUpdate: (updates: Partial<Section>) => void;
                  onDelete: () => void;
                  onClose: () => void;
                }
                
                function SectionEditor({ section, onUpdate, onDelete, onClose }: SectionEditorProps) {
                  const [sectionKey, setSectionKey] = useState(section.section_key);
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
                        <h4 className="text-[11px] text-neutral-500 uppercase tracking-wider">Section Settings</h4>
                        <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400">
                          <X size={14} />
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-neutral-600 mb-2">Section Key</label>
                        <input
                          type="text"
                          value={sectionKey}
                          onChange={(e) => setSectionKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                          className="w-full bg-[#0d0d0d] border border-[#1a1a1a] text-neutral-300 px-3 py-2 text-[12px] rounded focus:outline-none focus:border-neutral-700"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-neutral-600 mb-2">Page Type</label>
                        <select
                          value={section.page_type}
                          onChange={(e) => onUpdate({ page_type: e.target.value })}
                          className="w-full bg-[#0d0d0d] border border-[#1a1a1a] text-neutral-300 px-3 py-2 text-[12px] rounded focus:outline-none focus:border-neutral-700"
                        >
                          <option value="home">Home</option>
                          <option value="shop">Shop</option>
                          <option value="product">Product</option>
                          <option value="about">About</option>
                          <option value="contact">Contact</option>
                          <option value="faq">FAQ</option>
                          <option value="all">All Pages</option>
                        </select>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (sectionKey !== section.section_key) {
                              onUpdate({ section_key: sectionKey });
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded text-[11px] font-medium transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={onDelete}
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded text-[11px] transition-colors"
                        >
                          Delete Section
                        </button>
                      </div>
                    </div>
                  );
                }

// Phase 4: Sortable Component Item for Drag-Drop
interface SortableComponentItemProps {
  component: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
}

function SortableComponentItem({ component, isSelected, onSelect }: SortableComponentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 transition-colors group ${
        isSelected
          ? 'bg-blue-600/20 text-neutral-200 border-l-2 border-blue-600'
          : 'hover:bg-neutral-900/30 text-neutral-500'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-neutral-700 hover:text-neutral-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical size={12} strokeWidth={2} />
      </button>
      <button
        onClick={onSelect}
        className="flex-1 text-left px-2 py-1.5 text-[11px] rounded-[14px]"
      >
        {component.component_key}
      </button>
    </div>
  );
}

export default function ComponentEditor() {
  const [vendor, setVendor] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState('home');
  const [sections, setSections] = useState<Section[]>([]);
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInstance | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hero']));
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('explorer');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightPanelMode, setRightPanelMode] = useState<'properties' | 'chat'>('properties');
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string, streaming?: boolean}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [addToSectionId, setAddToSectionId] = useState<string | null>(null);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newSectionKey, setNewSectionKey] = useState('');
  const [pages, setPages] = useState(['home', 'shop', 'product', 'about', 'contact', 'faq', 'all']);
  
  // Phase 4: Enhanced features
  const [isDragging, setIsDragging] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [componentVariants, setComponentVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [targetSectionForAi, setTargetSectionForAi] = useState<string | null>(null);
  const [lastGeneratedComponents, setLastGeneratedComponents] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [editingSectionKey, setEditingSectionKey] = useState('');
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Check URL params first (for platform editor), then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const vendorIdFromUrl = urlParams.get('vendor_id');
    
    const vendorId = vendorIdFromUrl || localStorage.getItem('vendor_id');
    
    if (vendorId) {
      // Fetch full vendor details from API
      fetch(`/api/vendors/${vendorId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setVendor(data.vendor);
          } else {
            // Fallback to basic vendor info
            const isPlatformVendor = vendorId === '00000000-0000-0000-0000-000000000001';
            setVendor({
              id: vendorId,
              slug: isPlatformVendor ? 'yacht-club' : (urlParams.get('slug') || localStorage.getItem('vendor_slug') || 'vendor'),
              store_name: isPlatformVendor ? 'Yacht Club' : (urlParams.get('store_name') || localStorage.getItem('store_name') || 'Vendor'),
              logo_url: null
            });
          }
        })
        .catch(err => {
          console.error('Error fetching vendor:', err);
          // Fallback to basic vendor info
          const isPlatformVendor = vendorId === '00000000-0000-0000-0000-000000000001';
          setVendor({
            id: vendorId,
            slug: isPlatformVendor ? 'yacht-club' : (urlParams.get('slug') || localStorage.getItem('vendor_slug') || 'vendor'),
            store_name: isPlatformVendor ? 'Yacht Club' : (urlParams.get('store_name') || localStorage.getItem('store_name') || 'Vendor'),
            logo_url: null
          });
        });
    }
  }, []);

  useEffect(() => {
    if (vendor) {
      loadData();
    }
  }, [selectedPage, vendor]);

  // Listen for component selection from preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security
      if (event.origin !== window.location.origin) {
        return;
      }
      
      // Handle component selection from preview
      if (event.data.type === 'COMPONENT_SELECTED') {
        const { componentId } = event.data.payload;
        setComponents(currentComponents => {
          const component = currentComponents.find(c => c.id === componentId);
          if (component) {
            console.log('🎯 Component selected from preview:', componentId, component.component_key);
            setSelectedComponent({ ...component }); // Create new reference
            // Expand the section containing this component
            setSections(currentSections => {
              const section = currentSections.find(s => s.id === component.section_id);
              if (section) {
                setExpandedSections(prev => new Set([...prev, section.id]));
              }
              return currentSections;
            });
            // Scroll right panel to top when selecting new component
            setTimeout(() => {
              const rightPanel = document.querySelector('.flex-1.overflow-y-auto.p-3');
              if (rightPanel) {
                rightPanel.scrollTop = 0;
              }
            }, 0);
          }
          return currentComponents;
        });
      }
      
      // Handle inline edits from preview
      if (event.data.type === 'INLINE_EDIT') {
        const { componentId, updates } = event.data.payload;
        console.log('✏️ Inline edit:', componentId, updates);
        
        // Update components array
        setComponents(currentComponents => {
          const updatedComponents = currentComponents.map(c => {
            if (c.id === componentId) {
              const updated = {
                ...c,
                ...updates,
                props: updates.props ? { ...c.props, ...updates.props } : c.props,
              };
              
              // Update selectedComponent if this is the selected one
              setSelectedComponent(current => {
                if (current?.id === componentId) {
                  return { ...updated }; // New reference to force re-render
                }
                return current;
              });
              
              return updated;
            }
            return c;
          });
          
          // Send to iframe
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
              type: 'UPDATE_COMPONENTS',
              payload: { components: updatedComponents, updatedId: componentId }
            }, '*');
          }
          
          return updatedComponents;
        });
        
        setHasChanges(true);
      }
      
      // Handle preview ready notification
      if (event.data.type === 'PREVIEW_READY') {
        console.log('✅ Preview iframe ready for touch-to-edit');
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // No dependencies - use setters with callbacks

  useEffect(() => {
    if (selectedComponent) {
      setCodeEditorValue(JSON.stringify({
        component_key: selectedComponent.component_key,
        props: selectedComponent.props,
        field_bindings: selectedComponent.field_bindings,
      }, null, 2));
    }
  }, [selectedComponent]);

  async function loadData() {
    try {
      // Load sections for selected page
      const sectionsRes = await fetch(`/api/vendor/content?page_type=${selectedPage}&vendor_id=${vendor.id}`);
      const sectionsData = await sectionsRes.json();
      
      // Also load header and footer (page_type = 'all')
      const layoutRes = await fetch(`/api/vendor/content?page_type=all&vendor_id=${vendor.id}`);
      const layoutData = await layoutRes.json();
      
      if (sectionsData.success) {
        const pageSections = sectionsData.sections || [];
        const layoutSections = layoutData.success ? (layoutData.sections || []) : [];
        
        // Combine and sort: header first, then page sections, then footer last
        const allSections = [...layoutSections, ...pageSections].sort((a, b) => a.section_order - b.section_order);
        setSections(allSections);
        
        const sectionIds = allSections.map((s: any) => s.id);
        if (sectionIds.length > 0) {
          const compRes = await fetch(`/api/component-registry/instances?vendor_id=${vendor.id}&section_ids=${sectionIds.join(',')}`);
          const compData = await compRes.json();
          
          if (compData.success) {
            setComponents(compData.instances || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function saveChanges() {
    if (!vendor || saving) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/component-registry/instances/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          instances: components,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  function updateComponent(componentId: string, updates: Partial<ComponentInstance>) {
    // Update components array with deep merge for props
    const updatedComponents = components.map(c => {
      if (c.id === componentId) {
        return {
          ...c,
          ...updates,
          props: updates.props ? { ...c.props, ...updates.props } : c.props,
          field_bindings: updates.field_bindings ? { ...c.field_bindings, ...updates.field_bindings } : c.field_bindings,
        };
      }
      return c;
    });
    
    setComponents(updatedComponents);
    
    // Update selected component to keep UI in sync with deep merge
    if (selectedComponent?.id === componentId) {
      setSelectedComponent({
        ...selectedComponent,
        ...updates,
        props: updates.props ? { ...selectedComponent.props, ...updates.props } : selectedComponent.props,
        field_bindings: updates.field_bindings ? { ...selectedComponent.field_bindings, ...updates.field_bindings } : selectedComponent.field_bindings,
      });
    }
    
    // Immediately send update to iframe preview
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_COMPONENTS',
        payload: { components: updatedComponents, updatedId: componentId }
      }, '*');
    }
    
    setHasChanges(true);
  }

  function addComponent(sectionId: string, componentKey: string) {
    const sectionComponents = components.filter(c => c.section_id === sectionId);
    const newPosition = sectionComponents.length;
    
    const defaultProps: Record<string, any> = {
      text: { content: 'New text', variant: 'paragraph', size: 'md', align: 'left', color: '#ffffff' },
      image: { src: '/yacht-club-logo.png', alt: 'Logo', aspect: 'auto', fit: 'contain', radius: 'none' },
      button: { text: 'Click me', href: '#', variant: 'primary', size: 'md' },
      spacer: { size: 'md' },
      icon: { name: '⭐', size: 'md' },
      divider: { color: '#333333', thickness: 1, spacing: 'md' },
      smart_header: { 
        vendorId: vendor.id, 
        vendorSlug: vendor.slug,
        vendorName: vendor.store_name,
        logoUrl: vendor.logo_url || '/yacht-club-logo.png',
        showAnnouncement: true,
        announcementText: 'Free shipping over $45',
        showSearch: true,
        showCart: true,
        showAccount: true,
        hideOnScroll: true,
        sticky: true,
        navLinks: [
          { label: 'Shop', href: '/shop', showDropdown: true },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' }
        ]
      },
      smart_footer: { 
        vendorId: vendor.id,
        vendorSlug: vendor.slug,
        vendorName: vendor.store_name,
        showLegalCompliance: true,
        showCopyright: true,
        showPoweredBy: true
      },
      smart_product_grid: { vendorId: vendor.id, columns: 3, maxProducts: 12, showPrice: true },
      smart_product_detail: { vendorId: vendor.id, showGallery: true },
      smart_locations: { vendorId: vendor.id },
      smart_reviews: { vendorId: vendor.id, limit: 6 },
    };
    
    const newComponent: ComponentInstance = {
      id: `temp_${Date.now()}`,
      section_id: sectionId,
      component_key: componentKey,
      props: defaultProps[componentKey] || {},
      field_bindings: {},
      position_order: newPosition,
      is_enabled: true,
      is_visible: true,
    } as ComponentInstance;
    
    const updated = [...components, newComponent];
    setComponents(updated);
    setSelectedComponent(newComponent);
    setHasChanges(true);
    
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_COMPONENTS',
        payload: { components: updated, updatedId: newComponent.id }
      }, '*');
    }
  }

  function deleteComponent(componentId: string) {
    const updated = components.filter(c => c.id !== componentId);
    setComponents(updated);
    setHasChanges(true);
    setSelectedComponent(null);
    
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_COMPONENTS',
        payload: { components: updated }
      }, '*');
    }
  }

  function toggleSection(sectionId: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  function getComponentsForSection(sectionId: string) {
    return components
      .filter(c => c.section_id === sectionId)
      .sort((a, b) => a.position_order - b.position_order);
  }
  
  // Phase 4: Drag and Drop Handler (Components)
  function handleDragEnd(event: DragEndEvent, sectionId: string) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setIsDragging(false);
      return;
    }
    
    const sectionComponents = getComponentsForSection(sectionId);
    const oldIndex = sectionComponents.findIndex(c => c.id === active.id);
    const newIndex = sectionComponents.findIndex(c => c.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      setIsDragging(false);
      return;
    }
    
    // Reorder components
    const reorderedComponents = arrayMove(sectionComponents, oldIndex, newIndex);
    
    // Update position_order for all components in section
    const updatedComponents = components.map(c => {
      if (c.section_id === sectionId) {
        const newPosition = reorderedComponents.findIndex(rc => rc.id === c.id);
        if (newPosition !== -1) {
          return { ...c, position_order: newPosition };
        }
      }
      return c;
    });
    
    setComponents(updatedComponents);
    setHasChanges(true);
    setIsDragging(false);
    
    // Send update to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_COMPONENTS',
        payload: { components: updatedComponents }
      }, '*');
    }
  }
  
  // Phase 4: Drag and Drop Handler (Sections)
  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setIsDragging(false);
      return;
    }
    
    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      setIsDragging(false);
      return;
    }
    
    // Reorder sections
    const reorderedSections = arrayMove(sections, oldIndex, newIndex);
    
    // Update section_order for all sections
    const updatedSections = reorderedSections.map((s, idx) => ({
      ...s,
      section_order: idx,
    }));
    
    setSections(updatedSections);
    setHasChanges(true);
    setIsDragging(false);
    
    // Save section order to database
    fetch('/api/vendor/content/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: vendor.id,
        sections: updatedSections.map(s => ({ id: s.id, section_order: s.section_order })),
      }),
    });
  }
  
  // Phase 4: AI Layout Suggestions
  async function generateAiSuggestions() {
    if (!vendor || !selectedComponent) return;
    
    setLoadingAiSuggestions(true);
    try {
      const response = await fetch('/api/ai/component-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          componentKey: selectedComponent.component_key,
          currentProps: selectedComponent.props,
          pageType: selectedPage,
          sectionComponents: getComponentsForSection(selectedComponent.section_id).map(c => c.component_key),
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setLoadingAiSuggestions(false);
    }
  }
  
  // Phase 4: Apply AI Suggestion
  function applyAiSuggestion(suggestion: any) {
    if (!selectedComponent) return;
    
    updateComponent(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        ...suggestion.proposedProps,
      },
    });
    
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }
  
  // Phase 4: Load Component Variants
  async function loadComponentVariants(componentKey: string) {
    try {
      const response = await fetch(`/api/component-registry/variants/${componentKey}`);
      const data = await response.json();
      
      if (data.success) {
        setComponentVariants(data.variants || []);
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
    }
  }
  
  // Phase 4: Apply Component Variant
  function applyComponentVariant(variant: any) {
    if (!selectedComponent) return;
    
    updateComponent(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        ...variant.style_overrides,
      },
      container_config: variant.layout_config,
    });
    
    setSelectedVariant(null);
  }

  const getPreviewUrl = () => {
    const base = selectedPage === 'home' ? '/storefront' 
      : selectedPage === 'product' ? '/storefront/products/tiger-runtz'
      : `/storefront/${selectedPage}`;
    return `${base}?vendor=${vendor?.slug}&preview=true`;
  };

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  if (!vendor) {
    return <div className="min-h-screen bg-[#181818] flex items-center justify-center text-neutral-400">Loading editor...</div>;
  }

  return (
    <div className="h-screen bg-[#181818] text-neutral-300 flex flex-col overflow-hidden">
      {/* Top Toolbar - Cursor Style */}
      <div className="flex items-center justify-between h-8 px-2 border-b border-[#0d0d0d] bg-[#0d0d0d]">
        <div className="flex items-center gap-2">
          <FileCode size={12} className="text-neutral-600" />
          <span className="text-[11px] text-neutral-400">Component Editor</span>
          <span className="text-neutral-700">•</span>
          <span className="text-[11px] text-neutral-500">{vendor.store_name}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* View Modes */}
          <div className="flex items-center border-r border-[#1a1a1a] pr-1 mr-1">
            {(['visual', 'split'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2 py-1 text-[10px] transition-colors ${
                  viewMode === mode
                    ? 'text-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                {mode === 'visual' ? 'Preview' : 'Split'}
              </button>
            ))}
          </div>

          {/* Device Toggle */}
          {(['desktop', 'tablet', 'mobile'] as const).map(device => (
            <button
              key={device}
              onClick={() => setPreviewDevice(device)}
              className={`p-1 transition-colors ${
                previewDevice === device
                  ? 'text-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-400'
              }`}
              title={device}
            >
              {device === 'desktop' && <Monitor size={11} />}
              {device === 'tablet' && <Grid3x3 size={11} />}
              {device === 'mobile' && <Smartphone size={11} />}
            </button>
          ))}

            <div className="h-4 w-px bg-black mx-1" />

          {/* Bottom Panel Toggles */}
          <button
            onClick={() => setBottomPanel(bottomPanel === 'code' ? null : 'code')}
            className={`p-1 transition-colors ${
              bottomPanel === 'code'
                ? 'text-neutral-200 bg-neutral-800'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
            title="Code Editor"
          >
            <Code size={11} />
          </button>
          <button
              onClick={() => setBottomPanel(bottomPanel === 'suggestions' ? null : 'suggestions')}
            className={`p-1 transition-colors ${
                bottomPanel === 'suggestions'
                ? 'text-neutral-200 bg-neutral-800'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
              title="AI Suggestions"
          >
              <Lightbulb size={11} />
          </button>

            <div className="h-4 w-px bg-black mx-1" />

          {/* Right Panel Toggle */}
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="p-1 text-neutral-600 hover:text-neutral-400"
            title="Toggle Right Panel"
          >
            <Layout size={11} />
          </button>

          <div className="h-4 w-px bg-black mx-1" />

          {/* Save */}
          <button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            className={`px-2 py-1 text-[10px] transition-colors ${
              hasChanges
                ? 'text-neutral-200 hover:text-white'
                : 'text-neutral-700 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : hasChanges ? '● Save' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - VSCode Style */}
        <div className="w-56 border-r border-[#1a1a1a] flex flex-col bg-black/98">
          <div className="flex border-b border-[#1a1a1a]">
            {[
              { key: 'explorer' as LeftPanel, icon: Box, label: 'Explorer' },
              { key: 'library' as LeftPanel, icon: Grid3x3, label: 'Library' },
              { key: 'layers' as LeftPanel, icon: Layers, label: 'Layers' },
              { key: 'marketplace' as LeftPanel, icon: Store, label: 'Marketplace' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setLeftPanel(tab.key)}
                className={`flex-1 py-2 flex items-center justify-center transition-colors ${
                  leftPanel === tab.key
                    ? 'text-neutral-200 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-400 hover:bg-black'
                }`}
                title={tab.label}
              >
                <tab.icon size={16} />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-0">
            {/* Explorer */}
            {leftPanel === 'explorer' && (
              <>
                <div className="px-3 py-2 border-b border-[#1a1a1a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Sections</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowAddSectionModal(true)}
                        className="p-1 hover:bg-black text-neutral-500 hover:text-neutral-300 rounded-[14px] transition-colors"
                        title="Add Section"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => setShowAddPageModal(true)}
                        className="p-1 hover:bg-black text-neutral-500 hover:text-neutral-300 rounded-[14px] transition-colors"
                        title="Add Page"
                      >
                        <FileText size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleSectionDragEnd}
                >
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="px-2 py-1">
                      {sections.map(section => {
                        const sectionComponents = getComponentsForSection(section.id);
                        const isExpanded = expandedSections.has(section.id);
                        const isTargetForAi = targetSectionForAi === section.id;
                        const hasNewComponents = lastGeneratedComponents.some(id => 
                          components.find(c => c.id === id && c.section_id === section.id)
                        );

                        return (
                          <SortableSectionItem
                            key={section.id}
                            section={section}
                            isExpanded={isExpanded}
                            componentCount={sectionComponents.length}
                            isTargetForAi={isTargetForAi}
                            hasNewComponents={hasNewComponents}
                            onToggle={() => toggleSection(section.id)}
                            onAddComponent={() => {
                              setAddToSectionId(section.id);
                              setShowAddComponentModal(true);
                            }}
                            onSetAiTarget={() => {
                              setTargetSectionForAi(section.id);
                              setSelectedSection(section);
                              setRightPanelMode('properties');
                            }}
                          >
                            {isExpanded && (
                              <div className="ml-4 space-y-0.5 mt-0.5">
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragStart={() => setIsDragging(true)}
                                  onDragEnd={(event) => handleDragEnd(event, section.id)}
                                >
                                  <SortableContext
                                    items={sectionComponents.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {sectionComponents.map((comp) => {
                                      const isNewlyGenerated = lastGeneratedComponents.includes(comp.id);
                                      return (
                                        <div key={comp.id} className={`relative group ${isNewlyGenerated ? 'bg-neutral-900/30' : ''}`}>
                                          <SortableComponentItem
                                            component={comp}
                                            isSelected={selectedComponent?.id === comp.id}
                                            onSelect={() => {
                                              setSelectedComponent(comp);
                                              setSelectedSection(null);
                                            }}
                                          />
                                          {isNewlyGenerated && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded">
                                              ai
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </SortableContext>
                                </DndContext>
                              </div>
                            )}
                          </SortableSectionItem>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}

            {/* Library */}
            {leftPanel === 'library' && (
              <div className="px-3 py-2">
                <div className="mb-3">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Components</span>
                </div>
                <div className="space-y-4">
                  {['Basic', 'Layout', 'Smart'].map(category => (
                    <div key={category}>
                      <div className="text-[9px] text-neutral-600 uppercase tracking-wider mb-2 font-semibold">{category}</div>
                      <div className="space-y-0.5">
                        {COMPONENT_TYPES.filter(t => t.category === category).map(type => (
                          <button
                            key={type.key}
                            onClick={() => {
                              if (sections.length > 0) {
                                setAddToSectionId(sections[0].id);
                                setShowAddComponentModal(true);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-black rounded-[14px] transition-colors text-left"
                          >
                            <span className="text-sm">{type.icon}</span>
                            <span className="text-[10px] text-neutral-400">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Layers */}
            {leftPanel === 'layers' && (
              <div className="px-3 py-2">
                <div className="mb-3">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Layers</span>
                </div>
                <div className="space-y-3">
                  {sections.map(section => (
                    <div key={section.id}>
                      <div className="text-[10px] text-neutral-500 font-medium mb-1">{section.section_key}</div>
                      <div className="ml-3 space-y-0.5">
                        {getComponentsForSection(section.id).map((comp, idx) => (
                          <button
                            key={comp.id}
                            onClick={() => setSelectedComponent(comp)}
                            className={`w-full text-left px-2 py-1 transition-colors text-[10px] rounded-[14px] ${
                              selectedComponent?.id === comp.id
                                ? 'bg-black text-neutral-200 border-l-2 border-blue-600'
                                : 'hover:bg-black text-neutral-500'
                            }`}
                          >
                            <span className="text-neutral-600">{idx + 1}.</span> {comp.component_key}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Phase 4: Marketplace */}
            {leftPanel === 'marketplace' && (
              <div className="px-3 py-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Component Templates</span>
                  <Store size={14} className="text-neutral-600" />
                </div>
                
                {!selectedComponent ? (
                  <div className="text-center text-neutral-600 py-8">
                    <Store size={32} className="mx-auto mb-3 opacity-20" />
                    <div className="text-[10px]">Select a component</div>
                    <div className="text-[9px] text-neutral-700 mt-1">to view available variants</div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 p-2 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[14px]">
                      <div className="text-[9px] text-neutral-600 mb-1">Selected Component</div>
                      <div className="text-[11px] text-neutral-300">{selectedComponent.component_key}</div>
                    </div>
                    
                    <button
                      onClick={() => loadComponentVariants(selectedComponent.component_key)}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded-[14px] mb-3 transition-colors"
                    >
                      Load Variants
                    </button>
                    
                    {componentVariants.length === 0 ? (
                      <div className="text-[9px] text-neutral-600 text-center py-4">
                        No variants available yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {componentVariants.map((variant: any) => (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariant(variant);
                              applyComponentVariant(variant);
                            }}
                            className="w-full p-3 bg-[#0d0d0d] border border-[#1a1a1a] hover:border-blue-600 rounded-[14px] text-left transition-colors group"
                          >
                            {variant.preview_image_url && (
                              <div className="w-full h-20 mb-2 bg-black rounded-[14px] overflow-hidden">
                                <img 
                                  src={variant.preview_image_url} 
                                  alt={variant.variant_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="text-[11px] text-neutral-300 mb-1">{variant.variant_name}</div>
                            {variant.description && (
                              <div className="text-[9px] text-neutral-600">{variant.description}</div>
                            )}
                            <div className="text-[9px] text-neutral-700 mt-2 group-hover:text-blue-400 transition-colors">
                              Click to apply →
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className={`${bottomPanel ? 'h-2/3' : 'flex-1'} flex items-center justify-center bg-black`}>
            <div
              className="bg-white overflow-hidden transition-all"
              style={{
                width: deviceWidths[previewDevice],
                height: previewDevice === 'mobile' ? '667px' : '100%',
              }}
            >
              <iframe
                ref={iframeRef}
                src={getPreviewUrl()}
                className="w-full h-full"
                title="Preview"
              />
            </div>
          </div>

          {/* Bottom Panel - VSCode Style */}
          {bottomPanel && (
            <div className="h-1/3 border-t border-[#1a1a1a] bg-black/98 flex flex-col">
              <div className="flex items-center justify-between px-2 py-1 border-b border-[#1a1a1a]">
                <div className="flex items-center">
                  {[
                    { key: 'suggestions' as BottomPanel, icon: Lightbulb, label: 'AI Suggestions' },
                    { key: 'code' as BottomPanel, icon: Code, label: 'Code' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setBottomPanel(tab.key)}
                      className={`px-3 py-1.5 text-[10px] flex items-center gap-1.5 transition-colors ${
                        bottomPanel === tab.key
                          ? 'text-neutral-200 border-b-2 border-blue-600 -mb-[1px]'
                          : 'text-neutral-600 hover:text-neutral-400'
                      }`}
                    >
                      <tab.icon size={12} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setBottomPanel(null)}
                  className="p-1 hover:bg-black rounded-[14px] text-neutral-600 hover:text-neutral-400"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {/* Phase 4: AI Suggestions Panel */}
                {bottomPanel === 'suggestions' && (
                  <div className="h-full flex flex-col p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={14} className="text-yellow-500" />
                        <div className="text-[11px] text-neutral-400">AI-Powered Suggestions</div>
                      </div>
                      {selectedComponent && (
                        <button
                          onClick={generateAiSuggestions}
                          disabled={loadingAiSuggestions}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-[14px] text-[9px] transition-colors font-medium flex items-center gap-1.5"
                        >
                          <Wand2 size={10} />
                          {loadingAiSuggestions ? 'Analyzing...' : 'Generate Suggestions'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {!selectedComponent ? (
                        <div className="text-center text-neutral-600 py-8">
                          <Lightbulb size={32} className="mx-auto mb-3 opacity-20" />
                          <div className="text-[10px]">Select a component</div>
                          <div className="text-[9px] text-neutral-700 mt-1">to get AI-powered optimization suggestions</div>
                        </div>
                      ) : aiSuggestions.length === 0 && !loadingAiSuggestions ? (
                        <div className="text-center text-neutral-600 py-8">
                          <Wand2 size={32} className="mx-auto mb-3 opacity-20" />
                          <div className="text-[10px]">No suggestions yet</div>
                          <div className="text-[9px] text-neutral-700 mt-1">Click "Generate Suggestions" to analyze this component</div>
                        </div>
                      ) : loadingAiSuggestions ? (
                        <div className="text-center text-neutral-600 py-8">
                          <div className="animate-spin mx-auto mb-3">⚡</div>
                          <div className="text-[10px]">Analyzing component...</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion: any, idx: number) => (
                            <div key={idx} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[14px] p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-[14px]">
                                    {suggestion.type || 'Optimization'}
                                  </div>
                                  <div className="text-[10px] text-neutral-500">
                                    {suggestion.impact || 'Medium'} Impact
                                  </div>
                                </div>
                                <button
                                  onClick={() => applyAiSuggestion(suggestion)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] text-[9px] transition-colors"
                                >
                                  Apply
                                </button>
                              </div>
                              <div className="text-[11px] text-neutral-300 mb-2 font-medium">
                                {suggestion.title}
                              </div>
                              <div className="text-[10px] text-neutral-500 mb-2">
                                {suggestion.description}
                              </div>
                              {suggestion.reason && (
                                <div className="text-[9px] text-neutral-600 mt-2 pt-2 border-t border-[#1a1a1a]">
                                  💡 {suggestion.reason}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {bottomPanel === 'code' && (
                  <div className="h-full">
                    <MonacoEditor
                      height="100%"
                      language="json"
                      theme="vs-dark"
                      value={codeEditorValue}
                      onChange={(value) => setCodeEditorValue(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 11,
                        fontFamily: "'Consolas', 'Monaco', monospace",
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties or Chat */}
        {showRightPanel && (
          <div className="w-[480px] border-l border-[#0d0d0d] bg-black flex flex-col overflow-hidden">
            {/* Tabs - Black Monochrome */}
            <div className="flex items-center h-9 px-2 border-b border-[#0d0d0d] bg-black">
              <button
                onClick={() => setRightPanelMode('properties')}
                className={`flex items-center gap-2 px-3 py-1 text-[11px] font-normal transition-all ${
                  rightPanelMode === 'properties'
                    ? 'text-white'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                <Settings size={12} />
                Properties
              </button>
              <button
                onClick={() => setRightPanelMode('chat')}
                className={`flex items-center gap-2 px-3 py-1 text-[11px] font-normal transition-all ${
                  rightPanelMode === 'chat'
                    ? 'text-white'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                <MessageSquare size={12} />
                Chat
                {isGenerating && (
                  <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse ml-1"></div>
                )}
              </button>
            </div>

            {/* Properties Panel */}
            {rightPanelMode === 'properties' && (
              <>
            <div className="px-3 py-2 border-b border-[#1a1a1a] flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Component Settings</span>
              {selectedComponent && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setBottomPanel('suggestions');
                          generateAiSuggestions();
                        }}
                        className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-[14px] text-[9px] transition-colors flex items-center gap-1"
                        title="Get AI suggestions"
                      >
                        <Lightbulb size={10} />
                        AI
                      </button>
                <div className="flex items-center gap-1.5 text-[9px] text-green-400">
                  <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                  <span>LIVE</span>
                      </div>
                </div>
              )}
            </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {selectedSection ? (
                    <SectionEditor
                      section={selectedSection}
                      onUpdate={async (updates) => {
                        try {
                          const res = await fetch('/api/vendor/content', {
                            method: 'PUT',
                            headers: { 
                              'Content-Type': 'application/json',
                              'x-vendor-id': vendor.id
                            },
                            body: JSON.stringify({
                              sectionId: selectedSection.id,
                              ...updates,
                            }),
                          });
                          
                          const data = await res.json();
                          if (data.success) {
                            loadData();
                            setSelectedSection(null);
                          }
                        } catch (error) {
                          console.error('Section update error:', error);
                        }
                      }}
                      onDelete={async () => {
                        if (confirm(`Delete section "${selectedSection.section_key}"?`)) {
                          try {
                            const res = await fetch(`/api/vendor/content?sectionId=${selectedSection.id}&vendorId=${vendor.id}`, {
                              method: 'DELETE',
                              headers: { 'x-vendor-id': vendor.id },
                            });
                            
                            const data = await res.json();
                            if (data.success) {
                              loadData();
                              setSelectedSection(null);
                            }
                          } catch (error) {
                            console.error('Section delete error:', error);
                          }
                        }
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  ) : selectedComponent ? (
                    <ComponentInstanceEditor
                      key={`${selectedComponent.id}-editor`}
                      instance={selectedComponent}
                      onUpdate={(updates) => {
                        console.log('🔄 Updating component from drawer:', selectedComponent.id, updates);
                        updateComponent(selectedComponent.id, updates);
                      }}
                      onDelete={() => deleteComponent(selectedComponent.id)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-neutral-600">
                        <Settings size={32} className="mx-auto mb-3 opacity-20" />
                        <div className="text-[10px]">No selection</div>
                        <div className="text-[9px] text-neutral-700 mt-1">Select a component or section</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Claude AI Chat Panel - Pure Cursor Black Style */}
            {rightPanelMode === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-black">
                {/* Messages Container - Edge to Edge */}
                <div className="flex-1 overflow-y-auto">
                  {aiChatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full px-6">
                      <div className="text-center max-w-md">
                        <div className="text-[13px] text-neutral-500 mb-6">Ask Claude to generate components</div>
                        <div className="space-y-2 text-left text-[12px] text-neutral-600">
                          <div>"Create a hero section"</div>
                          <div>"Add a 3-column product grid"</div>
                          <div>"Build a testimonial section"</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {aiChatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`border-b border-[#0d0d0d] ${
                            msg.role === 'user' ? 'bg-[#0a0a0a]' : 'bg-black'
                          }`}
                        >
                          <div className="px-6 py-5">
                            {/* User/Assistant Label */}
                            <div className="text-[11px] text-neutral-600 mb-3 font-medium">
                              {msg.role === 'user' ? 'You' : 'Claude'}
                              {msg.streaming && (
                                <span className="ml-3 text-neutral-700 font-normal">generating...</span>
                              )}
                            </div>
                            
                            {/* Message Content */}
                            <div className="text-[13px] leading-relaxed">
                              {msg.streaming && msg.content === '' ? (
                                <div className="text-neutral-700 italic text-[12px]">Thinking...</div>
                              ) : (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({node, ...props}) => <p className="text-neutral-300 mb-4 last:mb-0" {...props} />,
                                    code: ({node, className, children, ...props}: any) => {
                                      const match = /language-(\w+)/.exec(className || '');
                                      const inline = !className;
                                      return !inline ? (
                                        <div className="my-4 not-prose">
                                          <div className="flex items-center justify-between h-8 px-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-t-md">
                                            <span className="text-[10px] text-neutral-600 font-mono tracking-wide">{match?.[1] || 'code'}</span>
                                            <button
                                              onClick={() => navigator.clipboard.writeText(String(children))}
                                              className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
                                            >
                                              copy
                                            </button>
                                          </div>
                                          <pre className="bg-[#0d0d0d] border-x border-b border-[#1a1a1a] rounded-b-md p-4 overflow-x-auto m-0">
                                            <code className="text-[12px] font-mono text-neutral-400 leading-relaxed" {...props}>
                                              {children}
                                            </code>
                                          </pre>
                                        </div>
                                      ) : (
                                        <code className="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-[12px] font-mono text-neutral-400" {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                    ul: ({node, ...props}) => <ul className="text-neutral-300 space-y-2 my-3 ml-4" {...props} />,
                                    ol: ({node, ...props}) => <ol className="text-neutral-300 space-y-2 my-3 ml-4" {...props} />,
                                    li: ({node, ...props}) => <li className="text-neutral-300 leading-relaxed" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-[14px] font-medium text-white mt-5 mb-3" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-medium text-white" {...props} />,
                                    em: ({node, ...props}) => <em className="text-neutral-400" {...props} />,
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              )}
                              {msg.streaming && msg.content && (
                                <span className="inline-block w-2 h-4 bg-neutral-500 ml-1 animate-pulse"></span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>
                
                {/* Input Area - Cursor Black Style */}
                <div className="border-t border-[#0d0d0d] bg-black p-4">
                  {/* Section Selector for AI */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600">Generate in:</span>
                    <select
                      value={targetSectionForAi || ''}
                      onChange={(e) => setTargetSectionForAi(e.target.value || null)}
                      className="flex-1 bg-[#0d0d0d] border border-[#1a1a1a] text-neutral-400 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-neutral-700"
                    >
                      <option value="">First section (default)</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.section_key} ({getComponentsForSection(section.id).length} components)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const section = sections.find(s => s.id === targetSectionForAi);
                        if (section) {
                          setExpandedSections(prev => new Set([...prev, section.id]));
                        }
                      }}
                      className="text-[10px] text-neutral-600 hover:text-neutral-400 px-2 py-1 hover:bg-[#1a1a1a] rounded transition-colors"
                      title="View section"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                  
                  <div className="flex items-end gap-3">
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isGenerating && aiPrompt.trim()) {
                          e.preventDefault();
                          document.querySelector<HTMLButtonElement>('.claude-send-button')?.click();
                        }
                      }}
                      placeholder="Generate components, build sections, create layouts..."
                      className="flex-1 bg-[#0d0d0d] border border-[#1a1a1a] text-neutral-300 rounded px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:border-neutral-700 placeholder-neutral-700 leading-relaxed"
                      rows={2}
                      disabled={isGenerating}
                    />
                    <button
                      className="claude-send-button px-5 py-2.5 bg-white hover:bg-neutral-200 disabled:bg-neutral-900 disabled:text-neutral-700 text-black rounded text-[12px] font-medium transition-colors h-[52px] disabled:cursor-not-allowed"
                      disabled={!aiPrompt.trim() || isGenerating}
                      onClick={async () => {
                        if (!aiPrompt.trim() || isGenerating) return;
                        
                        const userMessage = aiPrompt;
                        setAiPrompt('');
                        setIsGenerating(true);
                        setRightPanelMode('chat');
                        setShowRightPanel(true);
                        
                        // Add user message
                        setAiChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                        
                        // Add streaming assistant message
                        setAiChatMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
                        
                        console.log('🚀 Starting Claude generation:', userMessage);
                        
                        try {
                          const response = await fetch('/api/ai/claude-code-gen', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Accept': 'text/event-stream'
                            },
                            body: JSON.stringify({
                              prompt: userMessage,
                              action: 'generate',
                              pageType: selectedPage,
                              vendorId: vendor?.id,
                              targetSectionId: targetSectionForAi,
                            }),
                          });
                          
                          console.log('📡 Response status:', response.status, response.headers.get('content-type'));
                          
                          if (!response.body) {
                            console.error('❌ No response body');
                            throw new Error('No response body');
                          }
                          
                          console.log('📥 Starting to read stream...');
                          
                          const reader = response.body.getReader();
                          const decoder = new TextDecoder();
                          let buffer = '';
                          
                          while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                              console.log('✅ Stream complete');
                              break;
                            }
                            
                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n\n');
                            buffer = lines.pop() || '';
                            
                            for (const line of lines) {
                              if (line.startsWith('data: ')) {
                                try {
                                  const data = JSON.parse(line.slice(6));
                                  console.log('📨 Event:', data.type);
                                  
                                  if (data.type === 'content') {
                                    setAiChatMessages(prev => {
                                      const newMessages = [...prev];
                                      const lastMsg = newMessages[newMessages.length - 1];
                                      if (lastMsg.role === 'assistant') {
                                        lastMsg.content = data.fullText;
                                      }
                                      return newMessages;
                                    });
                                    
                                    if (chatEndRef.current) {
                                      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  } else if (data.type === 'complete') {
                                    setAiChatMessages(prev => {
                                      const newMessages = [...prev];
                                      const lastMsg = newMessages[newMessages.length - 1];
                                      if (lastMsg.role === 'assistant') {
                                        lastMsg.streaming = false;
                                      }
                                      return newMessages;
                                    });
                                    
                                    if (data.components && data.components.length > 0) {
                                      // Use target section or first section
                                      const targetSection = targetSectionForAi 
                                        ? sections.find(s => s.id === targetSectionForAi)
                                        : sections[0];
                                      
                                      if (targetSection) {
                                        const newComponents: ComponentInstance[] = [];
                                        const newComponentIds: string[] = [];
                                        
                                        data.components.forEach((comp: any, idx: number) => {
                                          const componentId = `temp_${Date.now()}_${idx}`;
                                          const newComponent: ComponentInstance = {
                                            id: componentId,
                                            section_id: targetSection.id,
                                            component_key: comp.component_key,
                                            props: comp.props,
                                            field_bindings: {},
                                            position_order: components.filter(c => c.section_id === targetSection.id).length + idx,
                                            is_enabled: true,
                                            is_visible: true,
                                          } as ComponentInstance;
                                          
                                          newComponents.push(newComponent);
                                          newComponentIds.push(componentId);
                                        });
                                        
                                        setComponents(prev => [...prev, ...newComponents]);
                                        setHasChanges(true);
                                        setLastGeneratedComponents(newComponentIds);
                                        
                                        // Auto-expand target section to show new components
                                        setExpandedSections(prev => new Set([...prev, targetSection.id]));
                                        
                                        setTimeout(async () => {
                                          try {
                                            const saveRes = await fetch('/api/component-registry/instances/bulk-update', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                vendorId: vendor.id,
                                                instances: [...components, ...newComponents],
                                              }),
                                            });
                                            
                                            const saveData = await saveRes.json();
                                            if (saveData.success) {
                                              setHasChanges(false);
                                              
                                              if (iframeRef.current) {
                                                const currentSrc = iframeRef.current.src;
                                                iframeRef.current.src = '';
                                                setTimeout(() => {
                                                  if (iframeRef.current) {
                                                    iframeRef.current.src = currentSrc + (currentSrc.includes('?') ? '&' : '?') + 'refresh=' + Date.now();
                                                  }
                                                }, 100);
                                              }
                                              
                                              setAiChatMessages(prev => [...prev, {
                                                role: 'assistant',
                                                content: `**Saved ${data.components.length} component(s)**\n\nAdded to **${targetSection.section_key}** section\n\nComponents:\n${data.components.map((c: any) => `- ${c.component_key}`).join('\n')}\n\nCheck Explorer to see them marked as "new"`,
                                                streaming: false
                                              }]);
                                              
                                              // Clear after 10 seconds
                                              setTimeout(() => {
                                                setLastGeneratedComponents([]);
                                              }, 10000);
                                            }
                                          } catch (error) {
                                            console.error('Save error:', error);
                                          }
                                        }, 300);
                                      }
                                    }
                                  }
                                } catch (parseError) {
                                  console.error('Parse error:', parseError);
                                }
                              }
                            }
                          }
                        } catch (error: any) {
                          console.error('Claude streaming error:', error);
                          setAiChatMessages(prev => {
                            const newMessages = [...prev];
                            const lastMsg = newMessages[newMessages.length - 1];
                            if (lastMsg.role === 'assistant') {
                              lastMsg.content = `❌ Error: ${error.message}`;
                              lastMsg.streaming = false;
                            }
                            return newMessages;
                          });
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                    >
                      {isGenerating ? 'Generating' : 'Send'}
                    </button>
                  </div>
                  
                  {aiChatMessages.length > 0 && (
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-[10px] text-neutral-700">
                        {aiChatMessages.length} message{aiChatMessages.length !== 1 ? 's' : ''}
                      </div>
                      <button
                        onClick={() => setAiChatMessages([])}
                        className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
                      >
                        clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Component Modal */}
      {showAddComponentModal && addToSectionId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#0d0d0d] rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#0d0d0d]">
              <h2 className="text-[13px] font-medium text-neutral-200">Add Component</h2>
              <button
                onClick={() => {
                  setShowAddComponentModal(false);
                  setAddToSectionId(null);
                }}
                className="text-neutral-600 hover:text-neutral-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {COMPONENT_TYPES.map(type => (
                <button
                  key={type.key}
                  onClick={() => {
                    addComponent(addToSectionId, type.key);
                    setShowAddComponentModal(false);
                    setAddToSectionId(null);
                  }}
                  className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-neutral-600 rounded-[14px] p-3 text-left transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="text-2xl">{type.icon}</div>
                    <div>
                      <div className="text-[12px] text-neutral-200 mb-1">{type.label}</div>
                      <div className="text-[10px] text-neutral-600">{type.category}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#0d0d0d] rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#0d0d0d]">
              <h2 className="text-[13px] font-medium text-neutral-200">Add New Section</h2>
              <button onClick={() => setShowAddSectionModal(false)} className="text-neutral-600 hover:text-neutral-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-[11px] text-neutral-400 mb-2">Section Key (e.g., "features", "testimonials")</label>
              <input
                type="text"
                value={newSectionKey}
                onChange={(e) => setNewSectionKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                className="w-full bg-[#0d0d0d] border border-[#1a1a1a] text-neutral-300 rounded-[14px] px-3 py-2 text-[12px] mb-4"
                placeholder="section_key"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddSectionModal(false)}
                  className="flex-1 px-4 py-2 bg-[#0d0d0d] hover:bg-black text-neutral-400 rounded-[14px] text-[11px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newSectionKey) return;
                    try {
                      const res = await fetch('/api/vendor/content', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'x-vendor-id': vendor.id
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          page_type: selectedPage,
                          section_key: newSectionKey,
                          content_data: {},
                          section_order: sections.filter(s => s.page_type === selectedPage).length,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setNewSectionKey('');
                        setShowAddSectionModal(false);
                        loadData();
                      } else {
                        console.error('Failed to create section:', data.error);
                        alert('Failed to create section: ' + data.error);
                      }
                    } catch (error) {
                      console.error('Error adding section:', error);
                      alert('Error adding section: ' + error);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-[14px] text-[11px] transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#0d0d0d] rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#0d0d0d]">
              <h2 className="text-[13px] font-medium text-neutral-200">Add New Page</h2>
              <button onClick={() => setShowAddPageModal(false)} className="text-neutral-600 hover:text-neutral-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-[11px] text-neutral-400 mb-2">Page Name (e.g., "pricing", "team")</label>
              <input
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full bg-[#0d0d0d] border border-[#1a1a1a] text-neutral-300 rounded-[14px] px-3 py-2 text-[12px] mb-4"
                placeholder="page-name"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddPageModal(false)}
                  className="flex-1 px-4 py-2 bg-[#0d0d0d] hover:bg-black text-neutral-400 rounded-[14px] text-[11px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newPageName) return;
                    // Add to pages list and switch to it
                    if (!pages.includes(newPageName)) {
                      setPages(prev => [...prev, newPageName]);
                    }
                    setSelectedPage(newPageName);
                    setNewPageName('');
                    setShowAddPageModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-[14px] text-[11px] transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
