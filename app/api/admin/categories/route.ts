import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Fetch all categories
export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parent_id(id, name, slug)
      `)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      categories: categories || []
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate slug from name if not provided
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const categoryData: any = {
      name: body.name,
      slug: slug,
      description: body.description || null,
      parent_id: body.parent_id || null,
      image_url: body.image_url || null,
      banner_url: body.banner_url || null,
      display_order: body.display_order ?? 0,
      is_active: body.is_active ?? true,
      featured: body.featured ?? false,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      metadata: body.metadata || {}
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select(`
        *,
        parent:categories!parent_id(id, name, slug)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      category: data
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PATCH - Update category
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    // Generate slug if name is being updated and slug is not provided
    if (updates.name && !updates.slug) {
      updates.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        parent:categories!parent_id(id, name, slug)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      category: data
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    // Check if category has products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('primary_category_id', id)
      .limit(1);

    if (productsError) throw productsError;

    if (products && products.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete category with products. Please reassign products first.'
      }, { status: 400 });
    }

    // Check if category has children
    const { data: children, error: childrenError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id)
      .limit(1);

    if (childrenError) throw childrenError;

    if (children && children.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

