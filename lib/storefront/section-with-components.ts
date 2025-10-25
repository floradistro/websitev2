/**
 * Section Library with Component Registry Integration
 * Sections can now be composed of dynamic components
 */

import {
  getAllComponentTemplates,
  getRecommendedComponents,
  getCompatibleComponents,
  ComponentTemplate,
} from '@/lib/component-registry';

export interface SectionWithComponents {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'hero' | 'content' | 'features' | 'social' | 'cta' | 'product';
  pageTypes: string[];
  
  // Component-based structure
  usesComponentRegistry: boolean;
  defaultComponents?: string[]; // Component keys to use by default
  recommendedComponents?: string[]; // Suggested components for this section
  
  // Legacy support
  defaultContent?: any;
}

/**
 * Enhanced section templates that integrate with component registry
 */
export const COMPONENT_BASED_SECTIONS: SectionWithComponents[] = [
  {
    key: 'featured_products',
    name: 'Featured Products',
    description: 'Showcase selected products with smart filtering',
    icon: '🛍️',
    category: 'product',
    pageTypes: ['home', 'shop'],
    usesComponentRegistry: true,
    defaultComponents: ['smart_product_grid'],
    recommendedComponents: ['smart_product_grid', 'product_grid', 'smart_product_showcase'],
  },
  {
    key: 'category_showcase',
    name: 'Category Showcase',
    description: 'Display product categories with navigation',
    icon: '🏷️',
    category: 'product',
    pageTypes: ['home', 'shop'],
    usesComponentRegistry: true,
    defaultComponents: ['smart_category_nav'],
    recommendedComponents: ['smart_category_nav', 'smart_product_grid'],
  },
  {
    key: 'location_finder',
    name: 'Location Finder',
    description: 'Show store locations with maps and directions',
    icon: '📍',
    category: 'content',
    pageTypes: ['home', 'about', 'contact'],
    usesComponentRegistry: true,
    defaultComponents: ['smart_location_map'],
    recommendedComponents: ['smart_location_map'],
  },
  {
    key: 'hero_dynamic',
    name: 'Dynamic Hero',
    description: 'Customizable hero section with any components',
    icon: '🎯',
    category: 'hero',
    pageTypes: ['home', 'shop', 'about'],
    usesComponentRegistry: true,
    defaultComponents: ['text', 'text', 'button', 'button'],
    recommendedComponents: ['text', 'button', 'image', 'spacer'],
  },
  {
    key: 'content_block',
    name: 'Content Block',
    description: 'Flexible content area - add any components',
    icon: '📝',
    category: 'content',
    pageTypes: ['home', 'about', 'contact', 'faq'],
    usesComponentRegistry: true,
    defaultComponents: ['text', 'text', 'divider'],
    recommendedComponents: ['text', 'image', 'button', 'spacer', 'divider'],
  },
  {
    key: 'social_proof',
    name: 'Social Proof',
    description: 'Reviews, testimonials, and stats',
    icon: '⭐',
    category: 'social',
    pageTypes: ['home', 'about'],
    usesComponentRegistry: true,
    defaultComponents: ['smart_testimonials', 'smart_stats_counter'],
    recommendedComponents: ['smart_testimonials', 'smart_stats_counter', 'text'],
  },
];

/**
 * Get component-based sections for a page type
 */
export function getComponentSectionsForPage(pageType: string): SectionWithComponents[] {
  return COMPONENT_BASED_SECTIONS.filter(section =>
    section.pageTypes.includes(pageType) || section.pageTypes.includes('all')
  );
}

/**
 * Get recommended components for a section
 */
export async function getRecommendedComponentsForSection(
  sectionKey: string
): Promise<ComponentTemplate[]> {
  const section = COMPONENT_BASED_SECTIONS.find(s => s.key === sectionKey);
  
  if (!section || !section.usesComponentRegistry) {
    return [];
  }
  
  const allComponents = await getAllComponentTemplates();
  
  if (!section.recommendedComponents || section.recommendedComponents.length === 0) {
    return allComponents;
  }
  
  return allComponents.filter(c =>
    section.recommendedComponents?.includes(c.component_key)
  );
}

/**
 * Initialize section with default components
 */
export function getDefaultComponentsForSection(sectionKey: string): Array<{
  component_key: string;
  props: Record<string, any>;
  field_bindings: Record<string, any>;
  position_order: number;
}> {
  const section = COMPONENT_BASED_SECTIONS.find(s => s.key === sectionKey);
  
  if (!section || !section.defaultComponents) {
    return [];
  }
  
  return section.defaultComponents.map((componentKey, index) => {
    // Set sensible defaults based on component type
    const props: Record<string, any> = {};
    
    if (componentKey === 'text') {
      if (index === 0) {
        props.variant = 'headline';
        props.content = 'Your Headline Here';
        props.size = '3xl';
      } else {
        props.variant = 'paragraph';
        props.content = 'Your content here...';
      }
    } else if (componentKey === 'button') {
      props.text = index === 0 ? 'Get Started' : 'Learn More';
      props.variant = index === 0 ? 'primary' : 'secondary';
    } else if (componentKey.startsWith('smart_')) {
      // Smart components need vendorId (added at runtime)
      props.columns = 3;
    }
    
    return {
      component_key: componentKey,
      props,
      field_bindings: {},
      position_order: index,
    };
  });
}

/**
 * Suggest components based on available fields in a section
 */
export async function suggestComponentsForFields(
  fieldTypes: string[]
): Promise<Array<{
  component_key: string;
  component_name: string;
  compatibility_score: number;
  matching_fields: string[];
}>> {
  if (fieldTypes.length === 0) {
    return [];
  }
  
  return await getRecommendedComponents(fieldTypes);
}

/**
 * Check if section uses component registry
 */
export function isComponentBasedSection(sectionKey: string): boolean {
  const section = COMPONENT_BASED_SECTIONS.find(s => s.key === sectionKey);
  return section?.usesComponentRegistry || false;
}

/**
 * Create a new component-based section for a vendor
 */
export interface CreateComponentSectionParams {
  vendorId: string;
  sectionKey: string;
  pageType: string;
  componentInstances?: Array<{
    component_key: string;
    props?: Record<string, any>;
    field_bindings?: Record<string, any>;
  }>;
}

export async function createComponentBasedSection({
  vendorId,
  sectionKey,
  pageType,
  componentInstances,
}: CreateComponentSectionParams): Promise<string | null> {
  const { getServiceSupabase } = await import('@/lib/supabase/client');
  const supabase = getServiceSupabase();
  
  // Create the section
  const { data: section, error: sectionError } = await supabase
    .from('vendor_storefront_sections')
    .insert({
      vendor_id: vendorId,
      page_type: pageType,
      section_key: sectionKey,
      section_order: 0,
      is_enabled: true,
      content_data: {},
    })
    .select('id')
    .single();
  
  if (sectionError || !section) {
    console.error('Failed to create section:', sectionError);
    return null;
  }
  
  // If no components specified, use defaults
  const components = componentInstances || getDefaultComponentsForSection(sectionKey);
  
  if (components.length === 0) {
    return section.id;
  }
  
  // Create component instances
  const { createVendorComponentInstance } = await import('@/lib/component-registry');
  
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    await createVendorComponentInstance(
      vendorId,
      section.id,
      comp.component_key,
      comp.props || {},
      comp.field_bindings || {}
    );
  }
  
  return section.id;
}

