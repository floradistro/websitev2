/**
 * API: Category Field Visibility
 * PUT /api/categories/[id]/field-visibility - Update field visibility config for a category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
    const body = await request.json();
    const { fieldSlug, config } = body;

    if (!fieldSlug) {
      return NextResponse.json({ error: 'Field slug is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get current category
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('field_visibility')
      .eq('id', categoryId)
      .single();

    if (fetchError) throw fetchError;

    // Update field_visibility JSONB with the new config for this field
    const currentVisibility = category?.field_visibility || {};
    const updatedVisibility = {
      ...currentVisibility,
      [fieldSlug]: config
    };

    const { error: updateError } = await supabase
      .from('categories')
      .update({ field_visibility: updatedVisibility })
      .eq('id', categoryId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Field visibility updated'
    });
  } catch (error) {
    console.error('Field visibility update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update field visibility' },
      { status: 500 }
    );
  }
}
