/**
 * API: Categories (Multi-Tenant)
 * GET /api/categories - Get global categories + vendor-specific categories
 * POST /api/categories - Create vendor-specific category
 * PUT /api/categories - Update vendor-specific category
 * DELETE /api/categories - Delete vendor-specific category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    const supabase = getServiceSupabase();

    // TRUE MULTI-TENANT: Return global categories (vendor_id IS NULL) + vendor-specific categories
    let query = supabase
      .from('categories')
      .select('id, name, slug, description, icon, image_url, vendor_id, parent_id');

    if (vendorId) {
      // Get global categories OR categories owned by this vendor
      query = query.or(`vendor_id.is.null,vendor_id.eq.${vendorId}`);
    } else {
      // No vendor specified - only show global categories
      query = query.is('vendor_id', null);
    }

    const { data: categories, error } = await query.order('name', { ascending: true });

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

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, icon, image_url, parent_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Create unique slug
    const baseSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let finalSlug = baseSlug;
    const { data: existing } = await supabase
      .from('categories')
      .select('slug')
      .eq('slug', baseSlug)
      .or(`vendor_id.is.null,vendor_id.eq.${vendorId}`)
      .single();

    if (existing) {
      finalSlug = `${baseSlug}-${Date.now()}`;
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug: finalSlug,
        description: description || null,
        icon: icon || null,
        image_url: image_url || null,
        parent_id: parent_id || null,
        vendor_id: vendorId // TRUE MULTI-TENANT: Vendor owns this category
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      category
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, icon, image_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify vendor owns this category
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (existing.vendor_id !== vendorId) {
      return NextResponse.json(
        { error: 'Not authorized to edit this category' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      category
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify vendor owns this category
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('vendor_id')
      .eq('id', categoryId)
      .single();

    if (fetchError) throw fetchError;

    if (existing.vendor_id !== vendorId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this category' },
        { status: 403 }
      );
    }

    // Check if category has products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('primary_category_id', categoryId)
      .limit(1);

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
