import { getServiceSupabase } from '@/lib/supabase/client';
import { DEFAULT_CONTENT_TEMPLATE, personalizeDefaultContent } from './default-content-template';

/**
 * Initialize default content for a vendor (Shopify-style)
 * This runs automatically when a vendor has no sections configured
 */
export async function initializeVendorContent(vendorId: string, vendorName: string) {
  try {
    const supabase = getServiceSupabase();
    
    console.log(`🎨 Initializing default content for ${vendorName} (${vendorId})`);
    
    // Check if vendor already has sections
    const { data: existingSections, error: checkError } = await supabase
      .from('vendor_storefront_sections')
      .select('id')
      .eq('vendor_id', vendorId)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing sections:', checkError);
      return { success: false, error: checkError };
    }
    
    // If vendor already has content, don't overwrite
    if (existingSections && existingSections.length > 0) {
      console.log('✅ Vendor already has content, skipping initialization');
      return { success: true, skipped: true };
    }
    
    // Personalize the default template
    const personalizedContent = personalizeDefaultContent(vendorName);
    
    // Prepare all sections for insert
    const sectionsToInsert: any[] = [];
    
    // Home page sections
    personalizedContent.home.forEach((section: any) => {
      sectionsToInsert.push({
        vendor_id: vendorId,
        page_type: 'home',
        section_key: section.section_key,
        section_order: section.section_order,
        is_enabled: section.is_enabled,
        content_data: section.content_data,
      });
    });
    
    // About page sections
    personalizedContent.about.forEach((section: any) => {
      sectionsToInsert.push({
        vendor_id: vendorId,
        page_type: 'about',
        section_key: section.section_key,
        section_order: section.section_order,
        is_enabled: section.is_enabled,
        content_data: section.content_data,
      });
    });
    
    // Contact page sections
    personalizedContent.contact.forEach((section: any) => {
      sectionsToInsert.push({
        vendor_id: vendorId,
        page_type: 'contact',
        section_key: section.section_key,
        section_order: section.section_order,
        is_enabled: section.is_enabled,
        content_data: section.content_data,
      });
    });
    
    // FAQ page sections
    personalizedContent.faq.forEach((section: any) => {
      sectionsToInsert.push({
        vendor_id: vendorId,
        page_type: 'faq',
        section_key: section.section_key,
        section_order: section.section_order,
        is_enabled: section.is_enabled,
        content_data: section.content_data,
      });
    });
    
    // Insert all sections
    const { data: insertedSections, error: insertError } = await supabase
      .from('vendor_storefront_sections')
      .insert(sectionsToInsert)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting sections:', insertError);
      return { success: false, error: insertError };
    }
    
    console.log(`✅ Successfully initialized ${insertedSections?.length || 0} sections for ${vendorName}`);
    
    return { 
      success: true, 
      sectionsCreated: insertedSections?.length || 0,
      sections: insertedSections
    };
  } catch (error: any) {
    console.error('❌ Error in initializeVendorContent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get vendor sections with auto-initialization
 * If vendor has no content, automatically create default content
 */
export async function getVendorSectionsWithInit(
  vendorId: string, 
  vendorName: string, 
  pageType: string
) {
  const supabase = getServiceSupabase();
  
  // Try to get existing sections
  const { data: sections, error } = await supabase
    .from('vendor_storefront_sections')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('page_type', pageType)
    .eq('is_enabled', true)
    .order('section_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
  
  // If no sections found, initialize default content
  if (!sections || sections.length === 0) {
    console.log(`📝 No sections found for ${pageType}, initializing defaults...`);
    
    const initResult = await initializeVendorContent(vendorId, vendorName);
    
    if (initResult.success && !initResult.skipped) {
      // Re-fetch sections after initialization
      const { data: newSections } = await supabase
        .from('vendor_storefront_sections')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('page_type', pageType)
        .eq('is_enabled', true)
        .order('section_order', { ascending: true });
      
      return newSections || [];
    }
  }
  
  return sections || [];
}

