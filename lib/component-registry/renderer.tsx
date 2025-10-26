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
  'smart_shop_controls': Smart.SmartShopControls,
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
                ? `cursor-pointer relative group transition-all ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black' 
                      : 'hover:ring-2 hover:ring-blue-400/50 hover:ring-offset-2 hover:ring-offset-black'
                  }` 
                : ''
            }`}
            style={containerStyle}
            onClick={(e) => {
              if (isPreviewMode && onComponentSelect) {
                e.stopPropagation();
                onComponentSelect(componentId);
              }
            }}
            data-component-id={componentId}
            data-component-key={instance.component_key}
          >
            {/* Edit indicator overlay */}
            {isPreviewMode && (
              <div className={`absolute top-0 left-0 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-medium z-50 pointer-events-none transition-opacity ${
                isSelected || 'group-hover:opacity-100 opacity-0'
              }`}>
                {instance.component_key}
              </div>
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

