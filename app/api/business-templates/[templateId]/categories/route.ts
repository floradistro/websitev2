/**
 * API: Template Categories
 * GET - Get all categories for a specific template
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

    const { data: categories, error } = await supabase
      .from('template_categories')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      categories: categories || []
    });
  } catch (error: any) {
    console.error('Template categories API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
