import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Clone default content from Flora Distro to a new vendor
 * This gives new vendors a professional starting point
 */
export async function cloneDefaultContentToVendor(targetVendorId: string, targetVendorName: string) {
  const SOURCE_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro
  
  try {
    // Fetch all sections from Flora Distro
    const { data: sourceSections, error: fetchError } = await supabase
      .from('vendor_storefront_sections')
      .select('*')
      .eq('vendor_id', SOURCE_VENDOR_ID);

    if (fetchError) {
      console.error('Error fetching source sections:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!sourceSections || sourceSections.length === 0) {
      console.error('No source sections found');
      return { success: false, error: 'No default content found' };
    }

    // AI Reword content for new vendor (simple string replacement for now)
    const rewordedSections = sourceSections.map(section => {
      let contentData = JSON.stringify(section.content_data);
      
      // Replace "Flora Distro" with new vendor name
      contentData = contentData.replace(/Flora Distro/g, targetVendorName);
      
      // Simple rewording (can be enhanced with AI later)
      contentData = contentData.replace(/We're the biggest/g, `Welcome to ${targetVendorName}`);
      contentData = contentData.replace(/Fresh\. Fast\. Fire\./g, 'Premium Cannabis, Delivered');
      
      return {
        vendor_id: targetVendorId,
        page_type: section.page_type,
        section_key: section.section_key,
        section_order: section.section_order,
        is_enabled: section.is_enabled,
        content_data: JSON.parse(contentData)
      };
    });

    // Insert new sections
    const { error: insertError } = await supabase
      .from('vendor_storefront_sections')
      .insert(rewordedSections);

    if (insertError) {
      console.error('Error inserting sections:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ Cloned ${rewordedSections.length} sections to ${targetVendorName}`);
    return { 
      success: true, 
      message: `Cloned ${rewordedSections.length} sections`,
      sections_count: rewordedSections.length 
    };
    
  } catch (error: any) {
    console.error('Clone content error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize default content for a vendor if they have none
 */
export async function initializeVendorContent(vendorId: string, vendorName: string) {
  // Check if vendor already has content
  const { data: existing } = await supabase
    .from('vendor_storefront_sections')
    .select('id')
    .eq('vendor_id', vendorId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('Vendor already has content, skipping initialization');
    return { success: true, message: 'Content already exists' };
  }

  // Clone default content
  return await cloneDefaultContentToVendor(vendorId, vendorName);
}

// CLI usage
if (require.main === module) {
  const vendorId = process.argv[2];
  const vendorName = process.argv[3];

  if (!vendorId || !vendorName) {
    console.error('Usage: ts-node clone-default-content.ts <vendor_id> <vendor_name>');
    process.exit(1);
  }

  initializeVendorContent(vendorId, vendorName)
    .then(result => {
      console.log('Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

