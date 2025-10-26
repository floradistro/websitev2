/**
 * Component Editor - Fast Unified Drag System
 * Single @dnd-kit implementation, no iframe mess
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
import { useVendorAuth, VendorAuthProvider } from '@/context/VendorAuthContext';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
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
type DragType = 'section' | 'component';

const COMPONENT_TYPES = [
  // Smart Components (ALL 19) - WhaleTools Monochrome Theme
  { key: 'smart_hero', label: 'Hero Section', category: 'Content' },
  { key: 'smart_features', label: 'Features Grid', category: 'Content' },
  { key: 'smart_product_grid', label: 'Product Grid', category: 'Products' },
  { key: 'smart_product_detail', label: 'Product Detail', category: 'Products' },
  { key: 'smart_shop_controls', label: 'Shop Controls', category: 'Products' },
  { key: 'smart_product_showcase', label: 'Product Showcase', category: 'Products' },
  { key: 'smart_faq', label: 'FAQ Section', category: 'Content' },
  { key: 'smart_about', label: 'About Page', category: 'Content' },
  { key: 'smart_contact', label: 'Contact Page', category: 'Content' },
  { key: 'smart_legal_page', label: 'Legal Page', category: 'Content' },
  { key: 'smart_shipping', label: 'Shipping Info', category: 'Content' },
  { key: 'smart_returns', label: 'Returns Policy', category: 'Content' },
  { key: 'smart_lab_results', label: 'Lab Results', category: 'Content' },
  { key: 'smart_location_map', label: 'Location Map', category: 'Location' },
  { key: 'smart_testimonials', label: 'Testimonials', category: 'Social' },
  { key: 'smart_category_nav', label: 'Category Navigation', category: 'Navigation' },
  { key: 'smart_stats_counter', label: 'Stats Counter', category: 'Content' },
  { key: 'smart_header', label: 'Header', category: 'Layout' },
  { key: 'smart_footer', label: 'Footer', category: 'Layout' },
];

// Sortable Section Item
interface SortableSectionItemProps {
  section: Section;
  isExpanded: boolean;
  componentCount: number;
  isTargetForAi: boolean;
  hasNewComponents: boolean;
  isDragDisabled?: boolean;
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
  isDragDisabled,
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
  } = useSortable({ 
    id: section.id,
    disabled: isDragDisabled,
    data: {
      type: 'section',
      section,
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    opacity: isDragging ? 0.3 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`mb-0.5 ${isDragging ? 'z-50 shadow-2xl' : ''}`}
    >
      <div className={`flex items-center group transition-all rounded-xl ${
        isDragging 
          ? 'bg-white/10 border border-white/20' 
          : isTargetForAi 
            ? 'bg-white/5 border-l-2 border-white/40' 
            : hasNewComponents 
              ? 'border-l-2 border-white/20' 
              : 'hover:bg-white/5'
      }`}>
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="Drag section to reorder"
        disabled={isDragDisabled}
      >
        <GripVertical size={12} strokeWidth={2.5} />
      </button>
      <button
        onClick={onToggle}
        onDoubleClick={onSetAiTarget}
        className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-all rounded-xl"
        title="Click to expand, double-click to edit section"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={11} strokeWidth={2.5} className="text-white/40" /> : <ChevronRight size={11} strokeWidth={2.5} className="text-white/40" />}
          <span className="text-[10px] text-white/60 uppercase tracking-wide font-black" style={{ fontWeight: 900 }}>
            {section.section_key}
          </span>
        </div>
        <span className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{componentCount}</span>
      </button>
      <button
        onClick={onAddComponent}
        className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg mr-1"
        title="Add component"
      >
        <Plus size={11} strokeWidth={2.5} />
      </button>
    </div>
                      {children}
                    </div>
                  );
                }

// Sortable Component Item
interface SortableComponentItemProps {
  component: ComponentInstance;
  isSelected: boolean;
  isNewlyGenerated: boolean;
  isDragDisabled?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableComponentItem({
  component,
  isSelected,
  isNewlyGenerated,
  isDragDisabled,
  onSelect,
  onDelete,
}: SortableComponentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: component.id,
    disabled: isDragDisabled,
    data: {
      type: 'component',
      component,
      sectionId: component.section_id,
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    opacity: isDragging ? 0.3 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isNewlyGenerated ? 'bg-neutral-900/30' : ''} ${
        isDragging ? 'z-50 shadow-xl bg-blue-600/20 rounded' : ''
      }`}
    >
      <div className={`flex items-center gap-2 px-2 py-2 hover:bg-white/5 cursor-pointer transition-all rounded-xl ${
        isSelected ? 'bg-white/10 border-l-2 border-white' : ''
      } ${isDragging ? 'bg-white/10 border border-white/20' : ''}`}>
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed"
          title="Drag to reorder"
          disabled={isDragDisabled}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={10} strokeWidth={2.5} />
        </button>
        <div onClick={onSelect} className="flex-1 flex items-center gap-2 min-w-0">
          <div className="w-1 h-1 bg-white/30 rounded-full" />
          <span className="text-[10px] text-white/60 uppercase tracking-wide font-black truncate" style={{ fontWeight: 900 }}>
            {component.component_key.replace('smart_', '')}
          </span>
          {!component.is_enabled && (
            <span className="text-[8px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
              hidden
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
          title="Delete component"
        >
          <Trash2 size={10} strokeWidth={2.5} />
        </button>
      </div>
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
          <option value="storefront">Storefront</option>
                          <option value="product">Product</option>
                          <option value="about">About</option>
                        </select>
                      </div>
                      
      <div className="flex gap-2 pt-3">
                        <button
          onClick={() => onUpdate({ section_key: sectionKey })}
          className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-2 text-[11px] rounded transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={onDelete}
          className="px-3 py-2 text-[11px] text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        >
                          Delete Section
                        </button>
                      </div>
                    </div>
                  );
                }

function ComponentEditorContent() {
  const { vendor: authVendor, isAuthenticated, isLoading } = useVendorAuth();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [selectedPage, setSelectedPage] = useState('home');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [previewReady, setPreviewReady] = useState(false);
  
  // Derive selected component/section from IDs (single source of truth)
  const selectedComponent = selectedComponentId ? components.find(c => c.id === selectedComponentId) : null;
  const selectedSection = selectedSectionId ? sections.find(s => s.id === selectedSectionId) : null;
  
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('explorer');
  const [rightPanelMode, setRightPanelMode] = useState<'properties' | 'section'>('properties');
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>(null);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<DragType | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [targetSectionForAi, setTargetSectionForAi] = useState<string | null>(null);
  const [lastGeneratedComponents, setLastGeneratedComponents] = useState<string[]>([]);
  
  const previewRef = useRef<HTMLIFrameElement>(null);
  
  // Use authenticated vendor
  const vendor = authVendor;

  // Optimized sensors with proper activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/vendor/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load data when vendor changes
  useEffect(() => {
    if (vendor?.id) {
      loadData();
    }
  }, [selectedPage, vendor?.id]);
  
  // Listen for messages from preview iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      
      const { type, payload } = event.data;
      
      switch (type) {
        case 'PREVIEW_READY':
          console.log('✅ Preview ready');
          setPreviewReady(true);
          // Sync current components to preview
          if (previewRef.current?.contentWindow && components.length > 0) {
            previewRef.current.contentWindow.postMessage({
              type: 'UPDATE_COMPONENTS',
              payload: { components }
            }, '*');
          }
          break;
          
        case 'COMPONENT_SELECTED':
          const component = components.find(c => c.id === payload.componentId);
          if (component) {
            setSelectedComponentId(payload.componentId);
            setSelectedSectionId(null);
            setRightPanelMode('properties');
            
            // Expand the section containing this component
            setExpandedSections(prev => new Set([...prev, component.section_id]));
            
            // Scroll to the component in sidebar
            setTimeout(() => {
              const componentEl = document.querySelector(`[data-sidebar-component-id="${payload.componentId}"]`);
              if (componentEl) {
                componentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
          break;
          
        case 'SECTION_SELECTED':
          const section = sections.find(s => s.id === payload.sectionId);
          if (section) {
            setSelectedSectionId(payload.sectionId);
            setSelectedComponentId(null);
            setRightPanelMode('section');
            
            // Expand this section
            setExpandedSections(prev => new Set([...prev, payload.sectionId]));
            
            // Scroll to section in sidebar
            setTimeout(() => {
              const sectionEl = document.querySelector(`[data-sidebar-section-id="${payload.sectionId}"]`);
              if (sectionEl) {
                sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
          break;
          
        case 'COMPONENT_ACTION':
          handleComponentAction(payload.componentId, payload.action);
          break;
          
        case 'SECTION_ACTION':
          handleSectionAction(payload.sectionId, payload.action);
          break;
      }
    }
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [components, sections]);
  
  function handleComponentAction(componentId: string, action: string) {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    switch (action) {
      case 'edit':
        setSelectedComponentId(componentId);
        setRightPanelMode('properties');
        break;
      case 'delete':
        deleteComponent(componentId);
        break;
      case 'move-up':
        moveComponent(componentId, -1);
        break;
      case 'move-down':
        moveComponent(componentId, 1);
        break;
    }
  }
  
  function handleSectionAction(sectionId: string, action: string) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    switch (action) {
      case 'edit':
        setSelectedSectionId(sectionId);
        setRightPanelMode('section');
        break;
      case 'add':
        setSelectedSectionId(sectionId);
        setRightPanelMode('properties');
        break;
    }
  }
  
  function moveComponent(componentId: string, direction: number) {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    const sectionComponents = getComponentsForSection(component.section_id);
    const currentIndex = sectionComponents.findIndex(c => c.id === componentId);
    const newIndex = currentIndex + direction;
    
    if (newIndex < 0 || newIndex >= sectionComponents.length) return;
    
    // Reorder components
    const reordered = [...sectionComponents];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, movedItem);
    
    // Update position_order for all components in section
    const updatedSectionComponents = reordered.map((comp, index) => ({
      ...comp,
      position_order: index
    }));
    
    // Merge with components from other sections
    const otherComponents = components.filter(c => c.section_id !== component.section_id);
    const updatedComponents = [...otherComponents, ...updatedSectionComponents];
    
    setComponents(updatedComponents);
    setHasChanges(true);
    
    // Update preview immediately
    if (previewRef.current?.contentWindow) {
      previewRef.current.contentWindow.postMessage({
        type: 'UPDATE_COMPONENTS',
        payload: { components: updatedComponents }
      }, '*');
    }
  }

  async function loadData() {
    if (!vendor?.id) return;
    
    try {
      const [sectionsRes, componentsRes] = await Promise.all([
        fetch(`/api/vendor/content/sections?vendor_id=${vendor.id}&page_type=${selectedPage}`),
        fetch(`/api/vendor/content/components?vendor_id=${vendor.id}&page_type=${selectedPage}`)
      ]);
      
      // Check if responses are OK
      if (!sectionsRes.ok) {
        console.error('Sections API error:', sectionsRes.status, sectionsRes.statusText);
        const text = await sectionsRes.text();
        console.error('Response:', text);
        return;
      }
      
      if (!componentsRes.ok) {
        console.error('Components API error:', componentsRes.status, componentsRes.statusText);
        const text = await componentsRes.text();
        console.error('Response:', text);
        return;
      }
      
      const sectionsData = await sectionsRes.json();
      const componentsData = await componentsRes.json();
      
      if (sectionsData.success) {
        setSections(sectionsData.sections.sort((a: Section, b: Section) => a.section_order - b.section_order));
      }
      
      if (componentsData.success) {
        setComponents(componentsData.components.sort((a: ComponentInstance, b: ComponentInstance) => a.position_order - b.position_order));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  function getComponentsForSection(sectionId: string) {
    return components
      .filter(c => c.section_id === sectionId)
      .sort((a, b) => a.position_order - b.position_order);
  }
  
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    setIsDragging(true);
    
    // Determine drag type from data
    const data = active.data.current;
    if (data?.type === 'section') {
      setDragType('section');
    } else if (data?.type === 'component') {
      setDragType('component');
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    setIsDragging(false);
    setDragType(null);
    setActiveId(null);
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Section reorder
    if (activeData?.type === 'section' && overData?.type === 'section') {
      setSections((items) => {
        const oldIndex = items.findIndex(s => s.id === active.id);
        const newIndex = items.findIndex(s => s.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Update section_order
        const updated = reordered.map((section, index) => ({
          ...section,
          section_order: index
        }));
        
        setHasChanges(true);
        return updated;
      });
    }
    
    // Component reorder (within same section)
    if (activeData?.type === 'component' && overData?.type === 'component') {
      const activeSectionId = activeData.sectionId;
      const overSectionId = overData.sectionId;
      
      // Only allow reorder within same section
      if (activeSectionId !== overSectionId) {
        return;
      }
      
      setComponents((items) => {
        const sectionComponents = items
          .filter(c => c.section_id === activeSectionId)
          .sort((a, b) => a.position_order - b.position_order);
        
        const oldIndex = sectionComponents.findIndex(c => c.id === active.id);
        const newIndex = sectionComponents.findIndex(c => c.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(sectionComponents, oldIndex, newIndex);
        
        // Update position_order
        const updatedSectionComponents = reordered.map((comp, index) => ({
          ...comp,
          position_order: index
        }));
        
        // Merge back with other sections' components
        const otherComponents = items.filter(c => c.section_id !== activeSectionId);
        const updated = [...otherComponents, ...updatedSectionComponents];
        
        setHasChanges(true);
        
        // Update preview immediately
        if (previewRef.current?.contentWindow) {
          previewRef.current.contentWindow.postMessage({
            type: 'UPDATE_COMPONENTS',
            payload: { components: updated }
          }, '*');
        }
        
        return updated;
      });
    }
  }

  async function saveChanges() {
    if (!vendor?.id) return;
    
    setIsSaving(true);
    
    try {
      // Save sections
      const sectionsPayload = sections.map(s => ({
        id: s.id,
        section_order: s.section_order
      }));
      
      const reorderRes = await fetch('/api/vendor/content/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: vendor.id,
          sections: sectionsPayload
        })
      });
      
      if (!reorderRes.ok) {
        const text = await reorderRes.text();
        console.error('Reorder failed:', text);
        throw new Error('Failed to save section order');
      }
      
      // Save components (only ones that changed)
      const componentUpdates = components
        .filter(c => hasChanges) // Only if there are changes
        .map(component =>
          fetch(`/api/vendor/content/components/${component.id}`, {
            method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
              position_order: component.position_order,
              props: component.props,
              is_enabled: component.is_enabled,
            })
          })
        );
      
      await Promise.all(componentUpdates);
      
      setHasChanges(false);
      
      // Refresh preview
      if (previewRef.current) {
        previewRef.current.src = previewRef.current.src;
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  }

  async function addComponent(sectionId: string, componentKey: string) {
    if (!vendor?.id) return;
    
    const sectionComponents = getComponentsForSection(sectionId);
    const nextOrder = sectionComponents.length;
    
    try {
      const res = await fetch('/api/vendor/content/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          sectionId,
          componentKey,
          props: {},
          positionOrder: nextOrder,
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const newComponents = [...components, data.component];
        setComponents(newComponents);
        setSelectedComponentId(data.component.id);
        setSelectedSectionId(null);
        setRightPanelMode('properties');
        
        // Send to preview
        if (previewReady && previewRef.current?.contentWindow) {
          previewRef.current.contentWindow.postMessage({
            type: 'UPDATE_COMPONENTS',
            payload: { components: newComponents }
          }, '*');
        }
      }
    } catch (error) {
      console.error('Error adding component:', error);
    }
  }

  async function deleteComponent(componentId: string) {
    if (!vendor?.id) return;
    
    if (!confirm('Delete this component?')) return;
    
    try {
      const updatedComponents = components.filter(c => c.id !== componentId);
      setComponents(updatedComponents);
      
      if (selectedComponentId === componentId) {
        setSelectedComponentId(null);
      }
      
      // Update preview immediately
      if (previewReady && previewRef.current?.contentWindow) {
        previewRef.current.contentWindow.postMessage({
          type: 'UPDATE_COMPONENTS',
          payload: { components: updatedComponents }
        }, '*');
      }
      
      // Delete from database
      await fetch(`/api/vendor/content/components/${componentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id })
      });
      
      setHasChanges(true);
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  }

  async function addSection() {
    if (!vendor?.id) return;
    
    const nextOrder = sections.length;
    const sectionKey = `section_${nextOrder + 1}`;
    
    try {
      const res = await fetch('/api/vendor/content/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          sectionKey,
          pageType: selectedPage,
          sectionOrder: nextOrder,
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const newSections = [...sections, data.section];
        setSections(newSections);
        setExpandedSections(new Set([...expandedSections, data.section.id]));
        setSelectedSectionId(data.section.id);
        setRightPanelMode('section');
      }
    } catch (error) {
      console.error('Error adding section:', error);
    }
  }

  // Debounced preview update
  const debouncedPreviewUpdate = useRef<NodeJS.Timeout | null>(null);
  
  function updateComponent(componentId: string, updates: Partial<ComponentInstance>) {
    // Update components array immediately (optimistic)
    const updatedComponents = components.map(c => 
      c.id === componentId ? { ...c, ...updates } : c
    );
    
    setComponents(updatedComponents);
    setHasChanges(true);
    
    // Debounce preview update (prevent spam)
    if (debouncedPreviewUpdate.current) {
      clearTimeout(debouncedPreviewUpdate.current);
    }
    
    debouncedPreviewUpdate.current = setTimeout(() => {
      if (previewReady && previewRef.current?.contentWindow) {
        previewRef.current.contentWindow.postMessage({
          type: 'UPDATE_COMPONENT',
          payload: {
            componentId,
            updates,
            allComponents: updatedComponents
          }
        }, '*');
      }
    }, 150); // 150ms debounce for smooth typing
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) {
          saveChanges();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-neutral-500">Loading editor...</div>
      </div>
    );
  }
  
  // Redirect handled by useEffect
  if (!isAuthenticated || !vendor) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* Top Bar - WhaleTools Luxury */}
        <div className="h-14 bg-black border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-white/20 rounded-full" />
              <span className="text-xs text-white font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                {vendor.store_name}
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="bg-[#0a0a0a] border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white/60 uppercase tracking-wider font-black focus:outline-none focus:border-white/10 cursor-pointer hover:bg-white/5 transition-all"
              style={{ fontWeight: 900 }}
            >
              <option value="home">HOME</option>
              <option value="shop">SHOP</option>
              <option value="about">ABOUT</option>
              <option value="contact">CONTACT</option>
              <option value="faq">FAQ</option>
              <option value="lab-results">LAB RESULTS</option>
              <option value="shipping">SHIPPING</option>
              <option value="returns">RETURNS</option>
              <option value="privacy">PRIVACY</option>
              <option value="terms">TERMS</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
              <button
                onClick={() => setDevice('desktop')}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-black transition-all ${
                  device === 'desktop' 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={{ fontWeight: 900 }}
                title="Desktop view"
              >
                <Monitor size={14} strokeWidth={2.5} />
              </button>
              <div className="w-px bg-white/5" />
              <button
                onClick={() => setDevice('mobile')}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-black transition-all ${
                  device === 'mobile' 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={{ fontWeight: 900 }}
                title="Mobile view"
              >
                <Smartphone size={14} strokeWidth={2.5} />
              </button>
            </div>
            
            <button
              onClick={saveChanges}
              disabled={!hasChanges || isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black transition-all ${
                hasChanges
                  ? 'bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
              style={{ fontWeight: 900 }}
              title={hasChanges ? 'Save changes (Cmd+S)' : 'No changes to save'}
            >
              <Save size={14} strokeWidth={2.5} />
              <span>{isSaving ? 'SAVING' : hasChanges ? 'SAVE' : 'SAVED'}</span>
            </button>
          </div>
      </div>

        {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - WhaleTools Luxury */}
          <div className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setLeftPanel('explorer')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[9px] uppercase tracking-[0.15em] font-black transition-all ${
                  leftPanel === 'explorer' 
                    ? 'bg-black text-white border-b-2 border-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={{ fontWeight: 900 }}
              >
                <Layers size={12} strokeWidth={2.5} />
                <span>LAYERS</span>
              </button>
              <div className="w-px bg-white/5" />
              <button
                onClick={() => setLeftPanel('library')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[9px] uppercase tracking-[0.15em] font-black transition-all ${
                  leftPanel === 'library' 
                    ? 'bg-black text-white border-b-2 border-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={{ fontWeight: 900 }}
              >
                <Box size={12} strokeWidth={2.5} />
                <span>LIBRARY</span>
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Explorer/Layers */}
            {leftPanel === 'explorer' && (
              <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black">
                    <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black" style={{ fontWeight: 900 }}>
                      SECTIONS
                    </span>
                    <button
                      onClick={addSection}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      title="Add section"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>

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
                          sectionComponents.some(c => c.id === id)
                        );

                        return (
                          <div key={section.id} data-sidebar-section-id={section.id}>
                            <SortableSectionItem
                              section={section}
                              isExpanded={isExpanded}
                              componentCount={sectionComponents.length}
                              isTargetForAi={isTargetForAi}
                              hasNewComponents={hasNewComponents}
                              isDragDisabled={isDragging && dragType !== 'section'}
                              onToggle={() => {
                                setExpandedSections(prev => {
                                  const next = new Set(prev);
                                  if (next.has(section.id)) {
                                    next.delete(section.id);
                                  } else {
                                    next.add(section.id);
                                  }
                                  return next;
                                });
                                
                                // Highlight section in preview when clicked
                                if (previewRef.current?.contentWindow) {
                                  previewRef.current.contentWindow.postMessage({
                                    type: 'HIGHLIGHT_SECTION',
                                    payload: { sectionId: section.id }
                                  }, '*');
                                }
                              }}
                              onAddComponent={() => {
                                setSelectedSectionId(section.id);
                                setSelectedComponentId(null);
                                setRightPanelMode('section');
                              }}
                              onSetAiTarget={() => {
                                setTargetSectionForAi(section.id);
                                setSelectedSectionId(section.id);
                                setSelectedComponentId(null);
                                setRightPanelMode('section');
                              }}
                            >
                            {isExpanded && (
                              <div className="pl-4">
                                  <SortableContext
                                    items={sectionComponents.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                  {sectionComponents.map((comp) => {
                                    const isNewlyGenerated = lastGeneratedComponents.includes(comp.id);
                                    return (
                                      <div key={comp.id} data-sidebar-component-id={comp.id}>
                                        <SortableComponentItem
                                          component={comp}
                                          isSelected={selectedComponent?.id === comp.id}
                                          isNewlyGenerated={isNewlyGenerated}
                                          isDragDisabled={isDragging && dragType !== 'component'}
                                          onSelect={() => {
                                            setSelectedComponentId(comp.id);
                                            setSelectedSectionId(null);
                                            setRightPanelMode('properties');
                                            
                                            // Notify preview to highlight this component
                                            if (previewReady && previewRef.current?.contentWindow) {
                                              previewRef.current.contentWindow.postMessage({
                                                type: 'SELECT_COMPONENT',
                                                payload: { componentId: comp.id }
                                              }, '*');
                                            }
                                          }}
                                          onDelete={() => deleteComponent(comp.id)}
                                        />
                                      </div>
                                    );
                                  })}
                                  </SortableContext>
                              </div>
                            )}
                            </SortableSectionItem>
                          </div>
                        );
                      })}
                    </div>
                  </SortableContext>
              </>
            )}

            {/* Library - WhaleTools Luxury */}
            {leftPanel === 'library' && (
              <div className="px-4 py-4">
                <div className="mb-4">
                  <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black" style={{ fontWeight: 900 }}>
                    COMPONENTS
                  </span>
                </div>
                <div className="space-y-6">
                  {['Layout', 'Content', 'Products', 'Navigation', 'Location', 'Social'].map(category => {
                    const categoryComponents = COMPONENT_TYPES.filter(t => t.category === category);
                    if (categoryComponents.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <div className="text-[8px] text-white/30 uppercase tracking-[0.2em] mb-2 font-black" style={{ fontWeight: 900 }}>
                          {category}
                        </div>
                        <div className="space-y-1">
                          {categoryComponents.map(type => (
                            <button
                              key={type.key}
                              onClick={() => {
                                if (selectedSection) {
                                  addComponent(selectedSection.id, type.key);
                                } else if (sections.length > 0) {
                                  addComponent(sections[0].id, type.key);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-2xl transition-all text-left group"
                            >
                              <div className="w-1.5 h-1.5 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors" />
                              <span className="text-[10px] text-white/60 uppercase tracking-wide font-black group-hover:text-white transition-colors" style={{ fontWeight: 900 }}>
                                {type.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
                </div>
                      </div>

          {/* Center - Preview */}
          <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Loading Screen */}
            {!previewReady && (
              <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-center">
                  <div className="text-xs text-white/40 uppercase tracking-[0.2em] font-black">
                    Loading Preview...
                  </div>
                </div>
              </div>
            )}
            
            <div className={`bg-black rounded-lg shadow-2xl overflow-hidden ${
              device === 'desktop' ? 'w-full h-full max-w-7xl' : 'w-[375px] h-[667px]'
            } ${!previewReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
              <iframe
                ref={previewRef}
                src={`/storefront${selectedPage === 'shop' ? '/shop' : selectedPage === 'about' ? '/about' : selectedPage === 'contact' ? '/contact' : selectedPage === 'faq' ? '/faq' : ''}?vendor=${vendor.slug}&preview=true`}
                className="w-full h-full border-none bg-black"
                title="Preview"
              />
            </div>
          </div>

          {/* Right Sidebar - Properties - WhaleTools Luxury */}
          <div className="w-80 bg-[#0a0a0a] border-l border-white/5 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black">
              <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black" style={{ fontWeight: 900 }}>
                {rightPanelMode === 'properties' ? 'PROPERTIES' : 'SECTION'}
              </span>
              {selectedComponent && (
                <div className="flex items-center gap-2">
                  <div className="text-[8px] text-white/60 bg-white/5 px-2 py-1 rounded-lg uppercase tracking-wider font-black" style={{ fontWeight: 900 }}>
                    #{selectedComponent.position_order}
                  </div>
                  <button
                    onClick={() => setSelectedComponentId(null)}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}
                </div>

                <div className="flex-1 overflow-y-auto p-3">
              {selectedComponent && rightPanelMode === 'properties' ? (
                <ComponentInstanceEditor
                  instance={selectedComponent}
                      onUpdate={(updates) => selectedComponent && updateComponent(selectedComponent.id, updates)}
                      onDelete={() => selectedComponent && deleteComponent(selectedComponent.id)}
                />
              ) : selectedSection && rightPanelMode === 'section' ? (
                    <SectionEditor
                      section={selectedSection}
                  onUpdate={(updates) => {
                    if (selectedSection) {
                      setSections(sections.map(s => 
                        s.id === selectedSection.id ? { ...s, ...updates } : s
                      ));
                      setHasChanges(true);
                    }
                  }}
                      onDelete={async () => {
                    if (selectedSection && confirm('Delete this section and all its components?')) {
                          try {
                        await fetch(`/api/vendor/content/sections/${selectedSection.id}`, {
                              method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ vendorId: vendor.id })
                            });
                            
                        setSections(sections.filter(s => s.id !== selectedSection.id));
                        setComponents(components.filter(c => c.section_id !== selectedSection.id));
                        setSelectedSectionId(null);
                          } catch (error) {
                        console.error('Error deleting section:', error);
                      }
                    }
                  }}
                  onClose={() => {
                    setSelectedSectionId(null);
                    setRightPanelMode('properties');
                  }}
                    />
                  ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <Box size={24} className="text-white/20" strokeWidth={2} />
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-black mb-2" style={{ fontWeight: 900 }}>
                    NO SELECTION
                  </p>
                  <p className="text-[9px] text-white/20 max-w-[200px] leading-relaxed">
                    Select a component from layers or add from library
                  </p>
                </div>
                  )}
                </div>
                        </div>
                      </div>
                    </div>
    </DndContext>
  );
}

// Wrap with auth provider
export default function ComponentEditor() {
  return (
    <VendorAuthProvider>
      <ComponentEditorContent />
    </VendorAuthProvider>
  );
}
