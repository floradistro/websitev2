import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET - List component instances
 * POST - Create component instance
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const vendorId = searchParams.get('vendor_id');
    const pageType = searchParams.get('page_type');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Missing vendor_id' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Get all sections for this vendor/page
    let sectionsQuery = supabase
      .from('vendor_storefront_sections')
      .select('id')
      .eq('vendor_id', vendorId);
    
    if (pageType) {
      sectionsQuery = sectionsQuery.eq('page_type', pageType);
    }
    
    const { data: sections, error: sectionsError } = await sectionsQuery;
    
    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json(
        { success: false, error: sectionsError.message },
        { status: 500 }
      );
    }
    
    if (!sections || sections.length === 0) {
      return NextResponse.json({
        success: true,
        components: []
      });
    }
    
    const sectionIds = sections.map(s => s.id);
    
    // Get all components for these sections
    const { data: components, error: componentsError } = await supabase
      .from('vendor_component_instances')
      .select('*')
      .in('section_id', sectionIds)
      .order('position_order', { ascending: true });
    
    if (componentsError) {
      console.error('Error fetching components:', componentsError);
      return NextResponse.json(
        { success: false, error: componentsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      components: components || []
    });
    
  } catch (error: any) {
    console.error('GET components error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, sectionId, componentKey, props, positionOrder } = body;
    
    if (!vendorId || !sectionId || !componentKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Verify section belongs to vendor
    const { data: section, error: sectionError } = await supabase
      .from('vendor_storefront_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('vendor_id', vendorId)
      .single();
    
    if (sectionError || !section) {
      return NextResponse.json(
        { success: false, error: 'Invalid section' },
        { status: 400 }
      );
    }
    
    const { data: component, error } = await supabase
      .from('vendor_component_instances')
      .insert({
        section_id: sectionId,
        component_key: componentKey,
        props: props || {},
        position_order: positionOrder ?? 0,
        is_enabled: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating component:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      component
    });
    
  } catch (error: any) {
    console.error('POST component error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

