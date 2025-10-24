import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SOURCE_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro

/**
 * Initialize default content for a new vendor
 * Clones Flora Distro's content and rewords for new brand
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendor_id, vendor_name } = body;

    if (!vendor_id || !vendor_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: vendor_id, vendor_name' 
      }, { status: 400 });
    }

    // Check if vendor already has content
    const { data: existing } = await supabase
      .from('vendor_storefront_sections')
      .select('id')
      .eq('vendor_id', vendor_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vendor already has content' 
      }, { status: 400 });
    }

    // Fetch all sections from Flora Distro
    const { data: sourceSections, error: fetchError } = await supabase
      .from('vendor_storefront_sections')
      .select('*')
      .eq('vendor_id', SOURCE_VENDOR_ID);

    if (fetchError || !sourceSections || sourceSections.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No default content found' 
      }, { status: 500 });
    }

    // Clone and reword content
    const rewordedSections = sourceSections.map(section => {
      let contentData = JSON.stringify(section.content_data);
      
      // Simple rewording (replace brand name and generic phrases)
      contentData = contentData.replace(/Flora Distro/g, vendor_name);
      contentData = contentData.replace(/We're the biggest/g, `Welcome to ${vendor_name}`);
      contentData = contentData.replace(/Fresh\. Fast\. Fire\./g, 'Premium Cannabis, Delivered');
      contentData = contentData.replace(/Charlotte, NC/g, 'Our Location');
      contentData = contentData.replace(/Five retail locations/g, 'Multiple locations');
      
      return {
        vendor_id: vendor_id,
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
      return NextResponse.json({ 
        success: false, 
        error: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Initialized ${rewordedSections.length} content sections for ${vendor_name}`,
      sections_count: rewordedSections.length
    });
    
  } catch (error: any) {
    console.error('POST /api/vendor/content/initialize error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal error' 
    }, { status: 500 });
  }
}

