/**
 * Dynamic Component Renderer
 * Renders components based on registry definitions
 */

import React from 'react';

// Import all component libraries
import * as Atomic from '@/components/component-registry/atomic';
import * as Composite from '@/components/component-registry/composite';
import * as Smart from '@/components/component-registry/smart';

// Component map for dynamic rendering
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  // Atomic
  'text': Atomic.Text,
  'image': Atomic.Image,
  'button': Atomic.Button,
  'badge': Atomic.Badge,
  'icon': Atomic.Icon,
  'spacer': Atomic.Spacer,
  'divider': Atomic.Divider,
  
  // Composite
  'product_card': Composite.ProductCard,
  'product_grid': Composite.ProductGrid,
  
  // Smart
  'smart_product_grid': Smart.SmartProductGrid,
  'smart_category_nav': Smart.SmartCategoryNav,
  'smart_location_map': Smart.SmartLocationMap,
  'smart_testimonials': Smart.SmartTestimonials,
  'smart_stats_counter': Smart.SmartStatsCounter,
  'smart_product_showcase': Smart.SmartProductShowcase,
  'smart_product_detail': Smart.SmartProductDetail,
  'smart_header': Smart.SmartHeader,
  'smart_footer': Smart.SmartFooter,
  'smart_hero': Smart.SmartHero,
  'smart_shop_controls': Smart.SmartShopControls,
  'smart_features': Smart.SmartFeatures,
  'smart_faq': Smart.SmartFAQ,
  'smart_about': Smart.SmartAbout,
  'smart_contact': Smart.SmartContact,
  'smart_legal_page': Smart.SmartLegalPage,
  'smart_shipping': Smart.SmartShipping,
  'smart_returns': Smart.SmartReturns,
  'smart_lab_results': Smart.SmartLabResults,
  'flora_halloween_home': Smart.FloraDistroHalloweenHomepage,
  'flora_distro_hero': Smart.FloraDistroHero,
  'flora_distro_homepage': Smart.FloraDistroHomepage,
};

export interface DynamicComponentProps {
  componentKey: string;
  props: Record<string, any>;
  fieldBindings?: Record<string, any>;
  className?: string;
  isPreviewMode?: boolean;
  isSelected?: boolean;
  onInlineEdit?: (updates: Record<string, any>) => void;
}

/**
 * Renders a component dynamically based on component key
 */
export function DynamicComponent({
  componentKey,
  props,
  fieldBindings = {},
  className = '',
  isPreviewMode = false,
  isSelected = false,
  onInlineEdit,
  vendorId,
  vendorSlug,
  vendorName,
  vendorLogo,
}: DynamicComponentProps & { vendorId?: string; vendorSlug?: string; vendorName?: string; vendorLogo?: string }) {
  const Component = COMPONENT_MAP[componentKey];
  
  if (!Component) {
    return (
      <div className={`p-4 border border-red-500 rounded ${className}`}>
        <p className="text-red-500 text-sm">Component not found: {componentKey}</p>
      </div>
    );
  }
  
  // Merge props with field bindings and inline edit support
  // For smart components, inject vendorId and other vendor data
  const mergedProps = {
    ...props,
    ...fieldBindings,
    className,
    isPreviewMode,
    isSelected,
    onInlineEdit,
    ...(componentKey.startsWith('smart_') && vendorId ? { vendorId, vendorSlug, vendorName, vendorLogo } : {}),
  };
  
  try {
    return <Component {...mergedProps} />;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error rendering component:', componentKey, error);
    }
    return (
      <div className={`p-4 border border-red-500 rounded ${className}`}>
        <p className="text-red-500 text-sm">Error rendering: {componentKey}</p>
      </div>
    );
  }
}

export interface DynamicSectionProps {
  componentInstances: Array<{
    id?: string;
    component_key: string;
    props: Record<string, any>;
    field_bindings: Record<string, any>;
    container_config: Record<string, any>;
    position_order: number;
    is_enabled: boolean;
    is_visible: boolean;
  }>;
  className?: string;
  isPreviewMode?: boolean;
  onComponentSelect?: (componentId: string) => void;
  selectedComponentId?: string;
}

/**
 * Renders a section composed of multiple dynamic components
 */
export function DynamicSection({
  componentInstances,
  className = '',
  isPreviewMode = false,
  onComponentSelect,
  selectedComponentId,
  vendorId,
  vendorSlug,
  vendorName,
  vendorLogo,
}: DynamicSectionProps & { vendorId?: string; vendorSlug?: string; vendorName?: string; vendorLogo?: string }) {
  // Filter to enabled and visible components, then sort by position
  const activeComponents = componentInstances
    .filter(c => c.is_enabled !== false && c.is_visible !== false)
    .sort((a, b) => a.position_order - b.position_order);
  
  if (activeComponents.length === 0) {
    return null;
  }
  
  return (
    <div className={className}>
      {activeComponents.map((instance, index) => {
        const containerClasses = instance.container_config?.className || '';
        const containerStyle = instance.container_config?.style || {};
        const componentId = instance.id || `comp-${index}`;
        const isSelected = selectedComponentId === componentId;
        
        return (
          <div
            key={componentId}
            className={`${containerClasses} ${
              isPreviewMode 
                ? `cursor-pointer relative group transition-all duration-300 ${
                    isSelected 
                      ? 'ring-[6px] ring-white/90 ring-offset-[6px] ring-offset-black shadow-[0_0_60px_rgba(255,255,255,0.3)] z-[100]' 
                      : 'hover:ring-[3px] hover:ring-white/40 hover:ring-offset-[3px] hover:ring-offset-black hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                  }` 
                : ''
            }`}
            style={{
              ...containerStyle,
              ...(isPreviewMode && isSelected ? { position: 'relative', zIndex: 100 } : {})
            }}
            onClick={(e) => {
              if (isPreviewMode && onComponentSelect) {
                e.stopPropagation();
                onComponentSelect(componentId);
              }
            }}
            data-component-id={componentId}
            data-component-key={instance.component_key}
          >
            {/* Edit indicator badge */}
            {isPreviewMode && (
              <div className={`absolute -top-3 left-4 z-[110] pointer-events-none transition-all duration-300 ${
                isSelected ? 'opacity-100 scale-100' : 'group-hover:opacity-100 group-hover:scale-100 opacity-0 scale-95'
              }`}>
                <div className="bg-white text-black px-4 py-2 rounded-full shadow-2xl shadow-white/30 border-4 border-black">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                      {instance.component_key.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Editable indicators - corner dots */}
            {isPreviewMode && isSelected && (
              <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full border-2 border-black z-[110] pointer-events-none"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-black z-[110] pointer-events-none"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full border-2 border-black z-[110] pointer-events-none"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-black z-[110] pointer-events-none"></div>
              </>
            )}
            
            <DynamicComponent
              componentKey={instance.component_key}
              props={instance.props}
              fieldBindings={instance.field_bindings}
              isPreviewMode={isPreviewMode}
              isSelected={isSelected}
              vendorId={vendorId}
              vendorSlug={vendorSlug}
              vendorName={vendorName}
              vendorLogo={vendorLogo}
              onInlineEdit={(updates) => {
                // Send inline edit updates to parent via postMessage
                if (typeof window !== 'undefined' && window.parent) {
                  window.parent.postMessage({
                    type: 'INLINE_EDIT',
                    payload: { 
                      componentId: componentId,
                      updates: { props: updates }
                    }
                  }, '*');
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helper to register new components at runtime
 */
export function registerComponent(key: string, component: React.ComponentType<any>) {
  COMPONENT_MAP[key] = component;
}

/**
 * Get list of registered component keys
 */
export function getRegisteredComponents(): string[] {
  return Object.keys(COMPONENT_MAP);
}

/**
 * Check if component is registered
 */
export function isComponentRegistered(key: string): boolean {
  return key in COMPONENT_MAP;
}

