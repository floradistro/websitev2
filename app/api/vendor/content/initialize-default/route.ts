import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { personalizeDefaultContent } from '@/lib/storefront/default-content-template';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Initialize default content for a new vendor
 * Uses the default content template (not Flora Distro clone)
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
        success: true, 
        message: 'Vendor already has content',
        sections_count: 0
      });
    }

    // Get personalized default content
    const defaultContent = personalizeDefaultContent(vendor_name);
    
    // Flatten all sections from all pages
    const allSections = [];
    
    for (const [pageType, sections] of Object.entries(defaultContent)) {
      sections.forEach((section: any) => {
        allSections.push({
          vendor_id,
          page_type: pageType,
          section_key: section.section_key,
          section_order: section.section_order,
          is_enabled: section.is_enabled,
          content_data: section.content_data
        });
      });
    }

    // Insert all sections
    const { error: insertError } = await supabase
      .from('vendor_storefront_sections')
      .insert(allSections);

    if (insertError) {
      console.error('Error initializing default content:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: insertError.message 
      }, { status: 500 });
    }

    console.log(`✅ Initialized ${allSections.length} default sections for ${vendor_name}`);

    return NextResponse.json({ 
      success: true, 
      message: `Initialized ${allSections.length} sections with default content`,
      sections_count: allSections.length
    });
    
  } catch (error: any) {
    console.error('POST /api/vendor/content/initialize-default error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal error' 
    }, { status: 500 });
  }
}

