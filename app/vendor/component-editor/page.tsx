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
      <div className={`flex items-center group transition-all rounded ${
        isDragging 
          ? 'bg-blue-600/30 border border-blue-500' 
          : isTargetForAi 
            ? 'bg-neutral-900/50 border-l-2 border-neutral-600' 
            : hasNewComponents 
              ? 'border-l-2 border-neutral-700' 
              : 'hover:bg-neutral-900/20'
      }`}>
      <button
        {...attributes}
        {...listeners}
          className="p-1 text-neutral-500 hover:text-neutral-300 cursor-grab active:cursor-grabbing transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        title="Drag section to reorder"
          disabled={isDragDisabled}
      >
        <GripVertical size={12} strokeWidth={2.5} className="text-neutral-600" />
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
      <div className={`flex items-center gap-1 pl-3 pr-1 py-1.5 hover:bg-neutral-900/40 cursor-pointer transition-colors rounded-sm ${
        isSelected ? 'bg-neutral-900 border-l-2 border-blue-500' : ''
      } ${isDragging ? 'bg-blue-600/20 border border-blue-500' : ''}`}>
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed"
          title="Drag to reorder"
          disabled={isDragDisabled}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={10} />
        </button>
        <div onClick={onSelect} className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs text-neutral-400 font-medium truncate">
            {component.component_key}
          </span>
          {!component.is_enabled && (
            <span className="text-[8px] text-neutral-600 bg-neutral-900 px-1 py-0.5 rounded">hidden</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-0.5 text-neutral-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete component"
        >
          <Trash2 size={10} />
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
  const [selectedComponent, setSelectedComponent] = useState<ComponentInstance | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
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
        case 'COMPONENT_SELECTED':
          const component = components.find(c => c.id === payload.componentId);
          if (component) {
            setSelectedComponent(component);
            setSelectedSection(null);
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
            setSelectedSection(section);
            setSelectedComponent(null);
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
        setSelectedComponent(component);
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
        setSelectedSection(section);
        setRightPanelMode('section');
        break;
      case 'add':
        setSelectedSection(section);
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
        setComponents([...components, data.component]);
        setSelectedComponent(data.component);
        setRightPanelMode('properties');
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
      
      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null);
      }
      
      // Update preview immediately
      if (previewRef.current?.contentWindow) {
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
        setSections([...sections, data.section]);
        setExpandedSections(new Set([...expandedSections, data.section.id]));
      }
    } catch (error) {
      console.error('Error adding section:', error);
    }
  }

  function updateComponent(componentId: string, updates: Partial<ComponentInstance>) {
    const updatedComponents = components.map(c => 
      c.id === componentId ? { ...c, ...updates } : c
    );
    
    setComponents(updatedComponents);
    
    if (selectedComponent?.id === componentId) {
      setSelectedComponent({ ...selectedComponent, ...updates });
    }
    
    setHasChanges(true);
    
    // Send live update to preview iframe
    if (previewRef.current?.contentWindow) {
      previewRef.current.contentWindow.postMessage({
        type: 'UPDATE_COMPONENT',
        payload: {
          componentId,
          updates,
          allComponents: updatedComponents
        }
      }, '*');
    }
  }

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
      <div className="h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-12 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
              <Store size={14} className="text-neutral-600" />
              <span className="text-[11px] text-neutral-500 font-medium">{vendor.store_name}</span>
        </div>
            <div className="h-3 w-px bg-neutral-800" />
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="bg-transparent border-none text-[11px] text-neutral-400 focus:outline-none cursor-pointer"
            >
              <option value="home">Home</option>
              <option value="about">About</option>
              <option value="contact">Contact</option>
              <option value="faq">FAQ</option>
              <option value="shop">Shop</option>
              <option value="product">Product</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#0a0a0a] rounded overflow-hidden">
            <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 ${device === 'desktop' ? 'bg-neutral-800 text-neutral-300' : 'text-neutral-600 hover:text-neutral-400'}`}
                title="Desktop view"
              >
                <Monitor size={14} />
            </button>
          <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 ${device === 'mobile' ? 'bg-neutral-800 text-neutral-300' : 'text-neutral-600 hover:text-neutral-400'}`}
                title="Mobile view"
              >
                <Smartphone size={14} />
          </button>
            </div>
            
          <button
            onClick={saveChanges}
              disabled={!hasChanges || isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-all ${
              hasChanges
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' 
                  : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
            }`}
          >
              <Save size={12} />
              <span>{isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}</span>
          </button>
        </div>
      </div>

        {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-60 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
            {/* Panel Tabs */}
          <div className="flex border-b border-[#1a1a1a]">
              <button
                onClick={() => setLeftPanel('explorer')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] ${
                  leftPanel === 'explorer' 
                    ? 'bg-[#0a0a0a] text-neutral-300 border-b-2 border-neutral-600' 
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                <Layers size={11} />
                <span>Layers</span>
              </button>
              <button
                onClick={() => setLeftPanel('library')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] ${
                  leftPanel === 'library' 
                    ? 'bg-[#0a0a0a] text-neutral-300 border-b-2 border-neutral-600' 
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                <Box size={11} />
                <span>Library</span>
              </button>
          </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Explorer/Layers */}
            {leftPanel === 'explorer' && (
              <>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a1a]">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Sections</span>
                      <button
                      onClick={addSection}
                      className="text-neutral-600 hover:text-neutral-400"
                      title="Add section"
                      >
                        <Plus size={12} />
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
                          <div data-sidebar-section-id={section.id}>
                            <SortableSectionItem
                              key={section.id}
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
                                setSelectedSection(section);
                                setRightPanelMode('properties');
                              }}
                              onSetAiTarget={() => {
                                setTargetSectionForAi(section.id);
                                setSelectedSection(section);
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
                                            setSelectedComponent(comp);
                                            setSelectedSection(null);
                                            setRightPanelMode('properties');
                                            
                                            // Notify preview to highlight this component
                                            if (previewRef.current?.contentWindow) {
                                              previewRef.current.contentWindow.postMessage({
                                                type: 'HIGHLIGHT_COMPONENT',
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

            {/* Library */}
            {leftPanel === 'library' && (
              <div className="px-3 py-2">
                <div className="mb-3">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Components</span>
                </div>
                <div className="space-y-4">
                    {['Basic', 'Smart'].map(category => (
                    <div key={category}>
                      <div className="text-[9px] text-neutral-600 uppercase tracking-wider mb-2 font-semibold">{category}</div>
                      <div className="space-y-0.5">
                        {COMPONENT_TYPES.filter(t => t.category === category).map(type => (
                          <button
                            key={type.key}
                            onClick={() => {
                                if (selectedSection) {
                                  addComponent(selectedSection.id, type.key);
                                } else if (sections.length > 0) {
                                  addComponent(sections[0].id, type.key);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-900/40 rounded transition-colors text-left"
                          >
                            <span className="text-sm">{type.icon}</span>
                              <span className="text-[11px] text-neutral-400">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                </div>
                      </div>

          {/* Center - Preview */}
          <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden">
            <div className={`bg-white rounded-lg shadow-2xl overflow-hidden ${
              device === 'desktop' ? 'w-full h-full max-w-7xl' : 'w-[375px] h-[667px]'
            }`}>
              <iframe
                ref={previewRef}
                src={`/storefront?vendor=${vendor.slug}${selectedPage !== 'home' ? `&page=${selectedPage}` : ''}&editor=true`}
                className="w-full h-full border-none"
                title="Preview"
              />
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 bg-[#0d0d0d] border-l border-[#1a1a1a] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1a]">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                {rightPanelMode === 'properties' ? 'Properties' : 'Section'}
                  </span>
                  {selectedComponent && (
                      <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-neutral-600 hover:text-neutral-400"
                >
                  <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3">
              {selectedComponent && rightPanelMode === 'properties' ? (
                <ComponentInstanceEditor
                  instance={selectedComponent}
                  onUpdate={(updates) => updateComponent(selectedComponent.id, updates)}
                  onDelete={() => deleteComponent(selectedComponent.id)}
                />
              ) : selectedSection && rightPanelMode === 'section' ? (
                    <SectionEditor
                      section={selectedSection}
                  onUpdate={(updates) => {
                    setSections(sections.map(s => 
                      s.id === selectedSection.id ? { ...s, ...updates } : s
                    ));
                    setHasChanges(true);
                      }}
                      onDelete={async () => {
                    if (confirm('Delete this section and all its components?')) {
                          try {
                        await fetch(`/api/vendor/content/sections/${selectedSection.id}`, {
                              method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ vendorId: vendor.id })
                            });
                            
                        setSections(sections.filter(s => s.id !== selectedSection.id));
                        setComponents(components.filter(c => c.section_id !== selectedSection.id));
                              setSelectedSection(null);
                          } catch (error) {
                        console.error('Error deleting section:', error);
                      }
                    }
                  }}
                  onClose={() => {
                    setSelectedSection(null);
                    setRightPanelMode('properties');
                  }}
                    />
                  ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Box size={32} className="text-neutral-700 mb-3" />
                  <p className="text-[11px] text-neutral-600 mb-1">No component selected</p>
                  <p className="text-[10px] text-neutral-700">Select a component from the layers panel or add one from the library</p>
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
