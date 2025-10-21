import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const parent = searchParams.get('parent');
    const activeOnly = searchParams.get('active') === 'true';
    const featured = searchParams.get('featured') === 'true';
    
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parent_id(id, name, slug)
      `);
    
    // Filter by parent
    if (parent === 'null' || parent === '0') {
      query = query.is('parent_id', null);
    } else if (parent) {
      query = query.eq('parent_id', parent);
    }
    
    // Active only
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    // Featured only
    if (featured) {
      query = query.eq('featured', true);
    }
    
    query = query.order('display_order', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      categories: data || []
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      slug,
      description,
      parent_id,
      image_url,
      banner_url,
      display_order = 0,
      is_active = true,
      featured = false,
      meta_title,
      meta_description
    } = body;
    
    if (!name || !slug) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, slug' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description,
        parent_id: parent_id || null,
        image_url,
        banner_url,
        display_order,
        is_active,
        featured,
        meta_title,
        meta_description
      })
      .select()
      .single();
    
    if (categoryError) {
      console.error('Error creating category:', categoryError);
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      category
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

