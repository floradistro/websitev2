/**
 * API: Business Templates
 * GET - Get all active business templates with counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Get all active templates
    const { data: templates, error } = await supabase
      .from('business_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Get counts for each template
    const templatesWithCounts = await Promise.all(
      (templates || []).map(async (template) => {
        const [categoriesRes, fieldGroupsRes] = await Promise.all([
          supabase
            .from('template_categories')
            .select('id', { count: 'exact', head: true })
            .eq('template_id', template.id),
          supabase
            .from('template_field_groups')
            .select('id', { count: 'exact', head: true })
            .eq('template_id', template.id)
        ]);

        return {
          ...template,
          category_count: categoriesRes.count || 0,
          field_group_count: fieldGroupsRes.count || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      templates: templatesWithCounts
    });
  } catch (error: any) {
    console.error('Business templates API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
