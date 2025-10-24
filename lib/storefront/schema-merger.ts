/**
 * Schema Merger - Combines Base Schema + Vendor Custom Fields
 * 
 * This is the magic that lets vendors extend sections infinitely
 */

import { getServiceSupabase } from '@/lib/supabase/client';

export interface FieldDefinition {
  id: string;
  type: string;
  label: string;
  [key: string]: any;
}

export interface MergedSchema {
  section_key: string;
  name: string;
  fields: FieldDefinition[]; // Base fields + Vendor custom fields
  variants: any[];
  base_field_count: number;
  custom_field_count: number;
}

/**
 * Get complete schema for a section (base + vendor custom fields)
 */
export async function getMergedSchema(
  sectionKey: string,
  vendorId?: string
): Promise<MergedSchema | null> {
  try {
    const supabase = getServiceSupabase();

    // Get base schema
    const { data: baseSchema, error: schemaError } = await supabase
      .from('section_schemas')
      .select('*')
      .eq('section_key', sectionKey)
      .eq('is_active', true)
      .single();

    if (schemaError || !baseSchema) {
      console.error('Base schema not found:', sectionKey);
      return null;
    }

    let mergedFields = [...(baseSchema.fields || [])];
    let customFieldCount = 0;

    // If vendor provided, get their custom fields
    if (vendorId) {
      const { data: customFields, error: customError } = await supabase
        .from('vendor_custom_fields')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .in('section_key', [sectionKey, 'global']) // Include global custom fields
        .order('sort_order', { ascending: true });

      if (!customError && customFields && customFields.length > 0) {
        // Merge custom field definitions
        customFields.forEach((customField: any) => {
          const fieldDef = customField.field_definition;
          
          // Add vendor-specific flag
          mergedFields.push({
            ...fieldDef,
            id: customField.field_id,
            is_custom: true, // Mark as vendor-added
            custom_field_db_id: customField.id
          });
        });

        customFieldCount = customFields.length;
      }
    }

    return {
      section_key: baseSchema.section_key,
      name: baseSchema.name,
      fields: mergedFields,
      variants: baseSchema.variants || [],
      base_field_count: baseSchema.fields?.length || 0,
      custom_field_count: customFieldCount
    };
  } catch (error) {
    console.error('Error merging schema:', error);
    return null;
  }
}

/**
 * Get all custom fields for a vendor
 */
export async function getVendorCustomFields(vendorId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('vendor_custom_fields')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('section_key', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching vendor custom fields:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a custom field for a vendor
 */
export async function addVendorCustomField(
  vendorId: string,
  sectionKey: string,
  fieldId: string,
  fieldDefinition: any
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('vendor_custom_fields')
    .insert({
      vendor_id: vendorId,
      section_key: sectionKey,
      field_id: fieldId,
      field_definition: fieldDefinition
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Remove a custom field
 */
export async function removeVendorCustomField(customFieldId: string) {
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from('vendor_custom_fields')
    .delete()
    .eq('id', customFieldId);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Validate section values against merged schema
 */
export function validateSectionValues(
  values: Record<string, any>,
  schema: MergedSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  schema.fields.forEach((field) => {
    const value = values[field.id];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label} is required`);
    }

    // Check min/max for numbers
    if (field.type === 'number' && value !== undefined) {
      if (field.min !== undefined && value < field.min) {
        errors.push(`${field.label} must be at least ${field.min}`);
      }
      if (field.max !== undefined && value > field.max) {
        errors.push(`${field.label} must be at most ${field.max}`);
      }
    }

    // Check max_length for text
    if ((field.type === 'text' || field.type === 'textarea') && field.max_length && value) {
      if (value.length > field.max_length) {
        errors.push(`${field.label} must be ${field.max_length} characters or less`);
      }
    }

    // Check array constraints
    if (field.type === 'array' && Array.isArray(value)) {
      if (field.min_items && value.length < field.min_items) {
        errors.push(`${field.label} must have at least ${field.min_items} items`);
      }
      if (field.max_items && value.length > field.max_items) {
        errors.push(`${field.label} can have at most ${field.max_items} items`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

