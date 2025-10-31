/**
 * API: Template Field Groups
 * GET - Get all field groups for a specific template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const supabase = getServiceSupabase();

    const { data: fieldGroups, error } = await supabase
      .from('template_field_groups')
      .select('*')
      .eq('template_id', templateId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      field_groups: fieldGroups || []
    });
  } catch (error: any) {
    console.error('Template field groups API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch field groups' },
      { status: 500 }
    );
  }
}
