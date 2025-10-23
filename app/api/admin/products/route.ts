import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { productCache, vendorCache, inventoryCache } from '@/lib/cache-manager';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

/**
 * GET - Fetch ALL products from ALL vendors for admin
 * No filtering by status or vendor - shows everything
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔵 ADMIN: Fetching ALL products from ALL vendors');
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100); // Max 100 for speed
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendor_id');
    const withWholesale = searchParams.get('with_wholesale') === 'true';
    
    const offset = (page - 1) * limit;
    
    const supabase = getServiceSupabase();
    
    // Build query - NO STATUS FILTER for admin, show ALL products
    let query = supabase
      .from('products')
      .select(`
        *,
        vendor:vendors(
          id,
          store_name,
          slug,
          email,
          vendor_type,
          wholesale_enabled,
          logo_url
        ),
        category:categories!primary_category_id(
          id,
          name,
          slug
        )
      `, { count: 'exact' });
    
    // Optional filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    
    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: products, error, count } = await query;
    
    if (error) {
      console.error('❌ Error fetching admin products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ Fetched ${products?.length || 0} products from ${count || 0} total`);
    
    // If wholesale info requested, fetch tier counts
    let productsWithTiers = products;
    if (withWholesale && products) {
      const productIds = products.map(p => p.id);
      
      // Get tier counts for each product
      const { data: tiers } = await supabase
        .from('wholesale_pricing')
        .select('product_id')
        .in('product_id', productIds)
        .eq('is_active', true);
      
      // Count tiers per product
      const tierCounts = new Map<string, number>();
      (tiers || []).forEach(tier => {
        tierCounts.set(
          tier.product_id,
          (tierCounts.get(tier.product_id) || 0) + 1
        );
      });
      
      productsWithTiers = products.map(p => ({
        ...p,
        tier_count: tierCounts.get(p.id) || 0
      }));
    }
    
    // Get vendor stats
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, store_name')
      .eq('status', 'active');
    
    console.log(`📊 Total vendors: ${vendors?.length || 0}`);
    
    return NextResponse.json({
      success: true,
      products: productsWithTiers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: {
        totalProducts: count || 0,
        totalVendors: vendors?.length || 0
      }
    });
    
  } catch (error: any) {
    console.error('❌ Admin products GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a product
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔵 DELETE /api/admin/products called');
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const forceDelete = searchParams.get('force') === 'true';

    console.log('📦 Product ID:', productId, 'Force:', forceDelete);

    if (!productId) {
      console.error('❌ No product ID provided');
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get product details
    console.log('🔍 Fetching product details...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId);

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return NextResponse.json({ error: `Database error: ${fetchError.message}` }, { status: 500 });
    }

    if (!products || products.length === 0) {
      console.error('❌ Product not found:', productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = products[0];
    console.log('✅ Product found:', product.name, 'ID:', product.id);

    // Check if product has inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, quantity, location:location_id(name)')
      .eq('product_id', product.id);

    if (inventory && inventory.length > 0 && !forceDelete) {
      const totalQty = inventory.reduce((sum, inv) => sum + parseFloat(inv.quantity || '0'), 0);
      
      if (totalQty > 0) {
        const locationsList = inventory
          .filter(inv => parseFloat(inv.quantity || '0') > 0)
          .map(inv => {
            const location = inv.location as any;
            return `${location?.name || 'Unknown'}: ${inv.quantity}g`;
          })
          .join(', ');
        
        return NextResponse.json({ 
          error: `Cannot delete product with existing inventory. Current stock: ${totalQty}g at ${inventory.length} location(s). (${locationsList})`,
          has_inventory: true,
          inventory_count: inventory.length,
          total_quantity: totalQty
        }, { status: 400 });
      }
    }

    console.log('🗑️ Admin deleting product:', product.name, 'ID:', productId, 'Force:', forceDelete);

    // If force delete, remove all inventory first
    if (forceDelete && inventory && inventory.length > 0) {
      console.log('⚠️ Force deleting inventory for product:', product.name);
      
      // Create stock movements for audit trail
      for (const inv of inventory) {
        await supabase
          .from('stock_movements')
          .insert({
            inventory_id: inv.id,
            product_id: product.id,
            movement_type: 'adjustment',
            quantity: -parseFloat(inv.quantity || '0'),
            quantity_before: parseFloat(inv.quantity || '0'),
            quantity_after: 0,
            reason: 'Product deleted by admin (force)',
            notes: `Product "${product.name}" force deleted with inventory`
          });
      }
      
      // Delete all inventory records
      await supabase
        .from('inventory')
        .delete()
        .eq('product_id', product.id);
      
      console.log('✅ Inventory deleted for product:', product.name);
    }

    // Delete the product (will cascade to related records)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ Error deleting product:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('✅ Product deleted successfully:', product.name);
    
    // Invalidate all caches after deletion
    console.log('🧹 Invalidating caches after product deletion');
    productCache.invalidatePattern('products:.*');
    vendorCache.clear();
    inventoryCache.clear();

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
