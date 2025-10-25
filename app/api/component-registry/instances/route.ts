/**
 * API: Get component instances
 * GET /api/component-registry/instances
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendor_id');
    const sectionIds = searchParams.get('section_ids')?.split(',').filter(Boolean);
    const sectionId = searchParams.get('section_id');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id is required' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('vendor_component_instances')
      .select('*')
      .eq('vendor_id', vendorId);
    
    if (sectionId) {
      query = query.eq('section_id', sectionId);
    } else if (sectionIds && sectionIds.length > 0) {
      query = query.in('section_id', sectionIds);
    }
    
    query = query.order('section_id').order('position_order');
    
    const { data: instances, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      instances: instances || [],
      count: instances?.length || 0,
    });
  } catch (error) {
    console.error('Get instances error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get component instances' },
      { status: 500 }
    );
  }
}

