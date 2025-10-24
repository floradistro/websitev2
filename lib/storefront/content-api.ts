import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Fetch all content sections for a vendor's page
 */
export async function getVendorPageSections(vendorId: string, pageType: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vendor_storefront_sections')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('page_type', pageType)
    .eq('is_enabled', true)
    .order('section_order', { ascending: true });

  if (error) {
    console.error('Error fetching vendor sections:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch a specific section for a vendor
 */
export async function getVendorSection(vendorId: string, pageType: string, sectionKey: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vendor_storefront_sections')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('page_type', pageType)
    .eq('section_key', sectionKey)
    .eq('is_enabled', true)
    .single();

  if (error) {
    console.error(`Error fetching section ${sectionKey}:`, error);
    return null;
  }

  return data;
}

/**
 * Get all sections for a vendor across all pages
 */
export async function getAllVendorSections(vendorId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vendor_storefront_sections')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_enabled', true)
    .order('page_type', { ascending: true })
    .order('section_order', { ascending: true });

  if (error) {
    console.error('Error fetching all vendor sections:', error);
    return [];
  }

  return data || [];
}

/**
 * Update or create a content section
 */
export async function upsertVendorSection(
  vendorId: string,
  pageType: string,
  sectionKey: string,
  contentData: any,
  sectionOrder?: number
) {
  const supabase = getServiceSupabase();
  const { data, error} = await supabase
    .from('vendor_storefront_sections')
    .upsert({
      vendor_id: vendorId,
      page_type: pageType,
      section_key: sectionKey,
      content_data: contentData,
      section_order: sectionOrder,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'vendor_id,page_type,section_key'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting section:', error);
    throw error;
  }

  return data;
}

/**
 * Toggle section visibility
 */
export async function toggleSectionVisibility(
  vendorId: string,
  pageType: string,
  sectionKey: string,
  isEnabled: boolean
) {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('vendor_storefront_sections')
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq('vendor_id', vendorId)
    .eq('page_type', pageType)
    .eq('section_key', sectionKey);

  if (error) {
    console.error('Error toggling section:', error);
    throw error;
  }
}

