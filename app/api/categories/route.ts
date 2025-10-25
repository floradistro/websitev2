/**
 * API: Categories
 * GET /api/categories
 */

import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, description')
      .order('name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      categories: categories || [],
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
