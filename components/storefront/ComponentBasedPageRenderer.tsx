/**
 * Component-Based Page Renderer
 * Renders pages using Component Registry with Flora Distro styling
 */

"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DynamicSection } from '@/lib/component-registry';
import { resolveFieldBindings, type BindingContext } from '@/lib/component-registry/field-binding-resolver';

interface ComponentBasedPageRendererProps {
  vendor: any;
  pageType: string;
  sections: Array<{
    id: string;
    section_key: string;
    section_order: number;
    is_enabled: boolean;
  }>;
  componentInstances: Array<{
    id: string;
    section_id: string;
    component_key: string;
    props: Record<string, any>;
    field_bindings: Record<string, any>;
    position_order: number;
    container_config: Record<string, any>;
    is_enabled: boolean;
    is_visible: boolean;
  }>;
  isPreview?: boolean;
}

export function ComponentBasedPageRenderer({
  vendor,
  pageType,
  sections,
  componentInstances: initialInstances,
  isPreview = false,
}: ComponentBasedPageRendererProps) {
  // Always start with server data to avoid hydration mismatch
  const [componentInstances, setComponentInstances] = useState(initialInstances);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  
  // Listen for postMessage updates from parent editor (INSTANT updates via postMessage)
  // Attach immediately on mount - no dependency on isClient state to avoid race conditions
  useEffect(() => {
    // Only in browser (not SSR) and preview mode
    if (typeof window === 'undefined' || !isPreview) return;
    
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security
      if (event.origin !== window.location.origin) {
        return;
      }
      
      // Handle component updates (bulk)
      if (event.data.type === 'UPDATE_COMPONENTS') {
        const { components, updatedId } = event.data.payload;
        setComponentInstances(components);
      }
      
      // Handle single component update (live editing)
      if (event.data.type === 'UPDATE_COMPONENT') {
        const { componentId, updates, allComponents } = event.data.payload;
        if (allComponents) {
          setComponentInstances(allComponents);
        } else {
          // Fallback: update just the one component
          setComponentInstances(prev => 
            prev.map(c => c.id === componentId ? { ...c, ...updates } : c)
          );
        }
      }
      
      // Handle component selection from parent editor
      if (event.data.type === 'SELECT_COMPONENT') {
        setSelectedComponentId(event.data.payload.componentId);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Notify parent we're ready for touch-to-edit
    window.parent.postMessage({ type: 'PREVIEW_READY', payload: { isPreview } }, '*');
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isPreview]);  // Only depend on isPreview, NOT isClient
  
  // Handle component selection from touch/click
  const handleComponentSelect = (componentId: string) => {
    if (!isPreview) return;
    
    setSelectedComponentId(componentId);
    
    // Notify parent editor about the selection
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'COMPONENT_SELECTED',
        payload: { componentId }
      }, '*');
    }
  };
  
  // Group component instances by section
  const instancesBySection = useMemo(() => {
    return componentInstances.reduce((acc, instance) => {
      if (!acc[instance.section_id]) {
        acc[instance.section_id] = [];
      }
      acc[instance.section_id].push(instance);
      return acc;
    }, {} as Record<string, typeof componentInstances>);
  }, [componentInstances]);
  
  // Filter and sort sections
  const activeSections = useMemo(() => {
    return sections
      .filter(s => s.is_enabled !== false)
      .sort((a, b) => a.section_order - b.section_order);
  }, [sections]);
  
  if (activeSections.length === 0) {
    return null;
  }
  
  // Section-specific styling
  const getSectionStyle = (sectionKey: string) => {
    switch (sectionKey) {
      case 'header':
        return ''; // Header handles its own styling
      case 'hero':
        return 'min-h-[600px] flex items-center justify-center text-center bg-gradient-to-b from-black via-neutral-900 to-black';
      case 'process':
        return 'bg-neutral-950 border-y border-neutral-900';
      case 'locations':
        return 'bg-black';
      case 'featured_products':
        return 'bg-neutral-950';
      case 'reviews':
        return 'bg-black';
      case 'about_story':
        return 'bg-neutral-900';
      case 'shipping_badges':
        return 'bg-black border-t border-neutral-800';
      case 'footer':
        return ''; // Footer handles its own styling
      case 'differentiators':
        return 'bg-neutral-950';
      case 'stats':
        return 'bg-black border-y border-neutral-900';
      case 'cta':
        return 'bg-gradient-to-r from-neutral-900 via-black to-neutral-900';
      case 'contact_info':
        return 'bg-black';
      case 'faq_items':
        return 'bg-black';
      case 'shop_config':
        return 'bg-black';
      case 'product_detail_config':
        return 'bg-black';
      case 'product_detail':
        return ''; // SmartProductDetail handles its own background
      default:
        return 'bg-black';
    }
  };
  
  const getSectionLayout = (sectionKey: string) => {
    switch (sectionKey) {
      case 'shop_config':
        return 'space-y-8';
      case 'product_detail_config':
        return 'space-y-6';
      case 'hero':
        return 'flex flex-col items-center justify-center gap-6';
      case 'process':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8';
      case 'locations':
        return 'space-y-8';
      case 'featured_products':
        return 'space-y-8';
      case 'reviews':
        return 'space-y-8';
      case 'about_story':
        return 'max-w-4xl mx-auto space-y-6';
      case 'shipping_badges':
        return 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto';
      case 'footer':
        return 'space-y-4 text-center';
      case 'differentiators':
        return 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto';
      case 'stats':
        return 'grid grid-cols-2 md:grid-cols-4 gap-8';
      case 'cta':
        return 'text-center space-y-6 max-w-3xl mx-auto';
      case 'contact_info':
        return 'space-y-8';
      case 'faq_items':
        return 'max-w-4xl mx-auto space-y-6';
      default:
        return 'space-y-6';
    }
  };

  const getSectionPadding = (sectionKey: string) => {
    switch (sectionKey) {
      case 'shop_controls':
        return 'pt-6 pb-4 px-3 sm:px-4 md:px-8 lg:px-12'; // Tight spacing for filters
      case 'shop_grid':
        return 'pt-2 pb-8 px-3 sm:px-4 md:px-8 lg:px-12'; // Minimal padding, full width on mobile
      case 'shop_hero':
        return 'py-8 sm:py-12 px-3 sm:px-4 md:px-8 lg:px-12'; // Less padding for shop hero
      default:
        return 'py-12 sm:py-16 px-3 sm:px-4 md:px-8 lg:px-12'; // Default padding
    }
  };
  
  // Check if this is a layout section (header/footer)
  const isOnlyLayoutSections = activeSections.every(s => s.section_key === 'header' || s.section_key === 'footer');
  
  return (
    <div className={`${!isOnlyLayoutSections ? 'min-h-screen' : ''} relative`}>
      {/* Background gradient */}
      {!isOnlyLayoutSections && (
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {activeSections.map((section) => {
          const instances = instancesBySection[section.id] || [];
          
          if (instances.length === 0) {
            return null;
          }
          
          // Header, footer, and product_detail sections render without padding/container
          const isLayoutSection = section.section_key === 'header' || section.section_key === 'footer' || section.section_key === 'product_detail';
          
          if (isLayoutSection) {
            return (
              <section
                key={section.id}
                data-section-id={section.id}
                data-section-key={section.section_key}
                data-page-type={pageType}
                className={getSectionStyle(section.section_key)}
              >
                <DynamicSection
                  componentInstances={instances}
                  isPreviewMode={isPreview}
                  onComponentSelect={handleComponentSelect}
                  selectedComponentId={selectedComponentId || undefined}
                  vendorId={vendor.id}
                  vendorSlug={vendor.slug}
                  vendorName={vendor.store_name || vendor.slug}
                  vendorLogo={vendor.logo_url}
                />
              </section>
            );
          }
          
          return (
            <section
              key={section.id}
              data-section-id={section.id}
              data-section-key={section.section_key}
              data-page-type={pageType}
              className={`${getSectionPadding(section.section_key)} ${getSectionStyle(section.section_key)}`}
            >
              <div className="max-w-7xl mx-auto">
                <div className={getSectionLayout(section.section_key)}>
                  <DynamicSection
                    componentInstances={instances}
                    isPreviewMode={isPreview}
                    onComponentSelect={handleComponentSelect}
                    selectedComponentId={selectedComponentId || undefined}
                    vendorId={vendor.id}
                    vendorSlug={vendor.slug}
                    vendorName={vendor.store_name || vendor.slug}
                    vendorLogo={vendor.logo_url}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

