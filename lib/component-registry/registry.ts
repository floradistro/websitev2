/**
 * Component Registry System
 * Manages component templates, variants, and field bindings
 */

import { getServiceSupabase } from '@/lib/supabase/client';

export interface ComponentTemplate {
  id: string;
  component_key: string;
  name: string;
  description: string | null;
  category: 'atomic' | 'composite' | 'smart' | 'layout';
  sub_category: string | null;
  required_fields: string[];
  optional_fields: string[];
  field_schema: Record<string, any>;
  data_sources: string[];
  fetches_real_data: boolean;
  variants: string[];
  default_variant: string | null;
  props_schema: Record<string, any>;
  default_layout: Record<string, any>;
  responsive_breakpoints: Record<string, any>;
  child_components: string[];
  slot_definitions: Record<string, any>;
  is_public: boolean;
  is_deprecated: boolean;
  version: string;
  tags: string[];
}

export interface ComponentVariant {
  id: string;
  component_key: string;
  variant_key: string;
  variant_name: string;
  description: string | null;
  layout_type: string | null;
  layout_config: Record<string, any>;
  component_positions: any[];
  style_overrides: Record<string, any>;
  preview_image_url: string | null;
  is_default: boolean;
}

export interface FieldComponentBinding {
  id: string;
  field_type: string;
  component_key: string;
  is_recommended: boolean;
  compatibility_score: number;
  auto_config: Record<string, any>;
  min_items: number | null;
  max_items: number | null;
}

export interface VendorComponentInstance {
  id: string;
  vendor_id: string;
  section_id: string | null;
  component_key: string;
  instance_name: string | null;
  active_variant: string | null;
  props: Record<string, any>;
  field_bindings: Record<string, any>;
  position_order: number;
  container_config: Record<string, any>;
  is_enabled: boolean;
  is_visible: boolean;
}

/**
 * Get all public component templates
 */
export async function getAllComponentTemplates(): Promise<ComponentTemplate[]> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('component_templates')
    .select('*')
    .eq('is_public', true)
    .eq('is_deprecated', false)
    .order('name');
  
  if (error) {
    console.error('Failed to fetch component templates:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get component template by key
 */
export async function getComponentTemplate(componentKey: string): Promise<ComponentTemplate | null> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('component_templates')
    .select('*')
    .eq('component_key', componentKey)
    .single();
  
  if (error) {
    console.error(`Failed to fetch component template ${componentKey}:`, error);
    return null;
  }
  
  return data;
}

/**
 * Get variants for a component
 */
export async function getComponentVariants(componentKey: string): Promise<ComponentVariant[]> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('component_variant_configs')
    .select('*')
    .eq('component_key', componentKey)
    .order('is_default', { ascending: false });
  
  if (error) {
    console.error(`Failed to fetch variants for ${componentKey}:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Get recommended components for field types
 */
export async function getRecommendedComponents(fieldTypes: string[]): Promise<{
  component_key: string;
  component_name: string;
  compatibility_score: number;
  matching_fields: string[];
}[]> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .rpc('get_recommended_components_for_fields', {
      p_field_types: fieldTypes,
    });
  
  if (error) {
    console.error('Failed to get recommended components:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get field bindings for a component
 */
export async function getFieldBindingsForComponent(componentKey: string): Promise<FieldComponentBinding[]> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('field_component_bindings')
    .select('*')
    .eq('component_key', componentKey)
    .order('compatibility_score', { ascending: false });
  
  if (error) {
    console.error(`Failed to fetch field bindings for ${componentKey}:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Get compatible components for a field type
 */
export async function getCompatibleComponents(fieldType: string): Promise<FieldComponentBinding[]> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('field_component_bindings')
    .select('*, component_templates(*)')
    .eq('field_type', fieldType)
    .order('compatibility_score', { ascending: false });
  
  if (error) {
    console.error(`Failed to fetch compatible components for ${fieldType}:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Create vendor component instance
 */
export async function createVendorComponentInstance(
  vendorId: string,
  sectionId: string | null,
  componentKey: string,
  props: Record<string, any> = {},
  fieldBindings: Record<string, any> = {}
): Promise<string | null> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('vendor_component_instances')
    .insert({
      vendor_id: vendorId,
      section_id: sectionId,
      component_key: componentKey,
      props,
      field_bindings: fieldBindings,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create component instance:', error);
    return null;
  }
  
  return data?.id || null;
}

/**
 * Get vendor component instances
 */
export async function getVendorComponentInstances(
  vendorId: string,
  sectionId?: string
): Promise<VendorComponentInstance[]> {
  const supabase = getServiceSupabase();
  
  let query = supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('position_order');
  
  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to fetch vendor component instances:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Update component instance
 */
export async function updateComponentInstance(
  instanceId: string,
  updates: Partial<VendorComponentInstance>
): Promise<boolean> {
  const supabase = getServiceSupabase();
  
  const { error } = await supabase
    .from('vendor_component_instances')
    .update(updates)
    .eq('id', instanceId);
  
  if (error) {
    console.error('Failed to update component instance:', error);
    return false;
  }
  
  return true;
}

/**
 * Delete component instance
 */
export async function deleteComponentInstance(instanceId: string): Promise<boolean> {
  const supabase = getServiceSupabase();
  
  const { error } = await supabase
    .from('vendor_component_instances')
    .delete()
    .eq('id', instanceId);
  
  if (error) {
    console.error('Failed to delete component instance:', error);
    return false;
  }
  
  return true;
}

/**
 * Auto-configure component based on field data
 */
export async function autoConfigureComponent(
  vendorId: string,
  sectionId: string | null,
  componentKey: string,
  fieldData: Record<string, any>
): Promise<string | null> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .rpc('auto_configure_component_instance', {
      p_vendor_id: vendorId,
      p_section_id: sectionId,
      p_component_key: componentKey,
      p_field_data: fieldData,
    });
  
  if (error) {
    console.error('Failed to auto-configure component:', error);
    return null;
  }
  
  return data;
}

