import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vendor products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      products: products || []
    });

  } catch (error: any) {
    console.error('Get vendor products error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    console.log('🔵 Vendor product submission - Vendor ID:', vendorId);
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const productData = await request.json();
    console.log('🔵 Product data received:', JSON.stringify(productData, null, 2));
    
    if (!productData.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();

    // Create unique slug from name
    const baseSlug = (productData.slug || productData.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Make slug unique by checking existing and appending timestamp if needed
    let slug = baseSlug;
    const { data: existingProduct } = await supabase
      .from('products')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (existingProduct) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    // Prepare product data for Supabase
    const stockQty = productData.initial_quantity ? parseInt(productData.initial_quantity) : 0;
    
    // Determine stock management strategy (following enterprise patterns)
    const shouldManageStock = stockQty > 0 || productData.manage_stock === true;
    
    // Derive stock status based on quantity (like Amazon/Apple)
    const deriveStockStatus = (quantity: number): string => {
      if (quantity > 0) return 'instock';
      if (productData.backorders_allowed) return 'onbackorder';
      return 'outofstock';
    };
    
    const newProduct: any = {
      name: productData.name,
      slug: slug,
      description: productData.description || '',
      short_description: productData.short_description || '',
      type: productData.product_type || 'simple',
      status: 'pending', // Requires admin approval (marketplace pattern)
      vendor_id: vendorId,
      regular_price: productData.price ? parseFloat(productData.price) : null,
      sku: productData.sku || `YC-${Date.now()}`,
      // Stock management follows enterprise patterns
      manage_stock: shouldManageStock,
      stock_quantity: shouldManageStock ? stockQty : null,
      stock_status: shouldManageStock ? deriveStockStatus(stockQty) : 'instock',
      backorders_allowed: productData.backorders_allowed || false,
      low_stock_amount: productData.low_stock_amount || 10,
      featured_image_storage: productData.image_urls?.[0] || null,
      image_gallery_storage: productData.image_urls || [],
      attributes: {},
      meta_data: {
        // Cannabis info
        thc_percentage: productData.thc_percentage || '',
        cbd_percentage: productData.cbd_percentage || '',
        strain_type: productData.strain_type || '',
        lineage: productData.lineage || '',
        terpenes: productData.terpenes || '',
        effects: productData.effects || '',
        coa_url: productData.coa_url || '',
        // Pricing tiers (if applicable)
        pricing_mode: productData.pricing_mode || 'single',
        pricing_tiers: productData.pricing_tiers || []
      }
    };

    // Get category ID if category name provided
    if (productData.category) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', productData.category) // Case-insensitive match
        .limit(1);
      
      if (categories && categories.length > 0) {
        newProduct.primary_category_id = categories[0].id;
        console.log('✅ Category matched:', productData.category, '→', categories[0].id);
      } else {
        console.warn('⚠️ Category not found:', productData.category);
      }
    }

    console.log('🔵 Inserting product:', JSON.stringify(newProduct, null, 2));

    // Insert product into Supabase
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(newProduct)
      .select()
      .single();
    
    if (productError) {
      console.error('❌ Error creating product:', productError);
      console.error('❌ Product data that failed:', JSON.stringify(newProduct, null, 2));
      return NextResponse.json(
        { error: productError.message || 'Failed to create product', details: productError },
        { status: 500 }
      );
    }

    console.log('✅ Product created successfully:', product.id);

    // Create inventory record if initial quantity provided (enterprise pattern)
    if (shouldManageStock && stockQty > 0) {
      // Get vendor's primary location
      const { data: vendorLocations } = await supabase
        .from('locations')
        .select('id, name, is_primary')
        .eq('vendor_id', vendorId)
        .eq('is_primary', true)
        .limit(1);
      
      const primaryLocation = vendorLocations?.[0];
      
      if (primaryLocation) {
        // Create inventory record at primary location
        const { data: inventoryRecord, error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            product_id: product.id,
            location_id: primaryLocation.id,
            vendor_id: vendorId,
            quantity: stockQty,
            low_stock_threshold: productData.low_stock_amount || 10,
            notes: 'Initial inventory from product creation',
            metadata: {
              source: 'vendor_product_submission',
              initial_quantity: stockQty
            }
          })
          .select()
          .single();
        
        if (inventoryError) {
          console.warn('⚠️ Could not create inventory record:', inventoryError);
          // Don't fail the product creation, just log the warning
        } else {
          console.log('✅ Inventory record created at', primaryLocation.name);
          
          // Create stock movement audit trail (compliance requirement)
          await supabase
            .from('stock_movements')
            .insert({
              inventory_id: inventoryRecord.id,
              product_id: product.id,
              location_id: primaryLocation.id,
              movement_type: 'adjustment',
              quantity: stockQty,
              reference_type: 'product_creation',
              reference_id: product.id,
              notes: 'Initial stock from product submission',
              created_by: vendorId
            });
        }
      } else {
        console.warn('⚠️ No primary location found for vendor, inventory not created');
      }
    }

    // Handle variants if provided
    if (productData.product_type === 'variable' && productData.variants && productData.variants.length > 0) {
      const variantsToInsert = productData.variants.map((variant: any) => ({
        parent_product_id: product.id,
        sku: variant.sku || `${product.sku}-${variant.name.toLowerCase().replace(/\s/g, '-')}`,
        regular_price: variant.price ? parseFloat(variant.price) : null,
        stock_quantity: variant.stock ? parseInt(variant.stock) : 0,
        attributes: variant.attributes || {},
      }));

      await supabase
        .from('product_variations')
        .insert(variantsToInsert);
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product submitted for approval'
    });

  } catch (error: any) {
    console.error('❌ Create product error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create product', details: error.toString() },
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
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify the product belongs to this vendor
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, name, vendor_id')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check ownership
    if (product.vendor_id !== vendorId) {
      return NextResponse.json({ 
        error: 'Not authorized to delete this product' 
      }, { status: 403 });
    }

    // Check if product has inventory - warn but allow deletion (cascade will handle it)
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('product_id', product.id);

    if (inventory && inventory.length > 0) {
      const totalQty = inventory.reduce((sum, inv) => sum + parseFloat(inv.quantity || '0'), 0);
      if (totalQty > 0) {
        return NextResponse.json({ 
          error: `Cannot delete product with existing inventory. Current stock: ${totalQty}g across ${inventory.length} location(s). Please remove all inventory first.` 
        }, { status: 400 });
      }
    }

    console.log('🗑️ Deleting product:', product.name, 'ID:', productId);

    // Delete the product (this will cascade to related records based on DB constraints)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ Error deleting product:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('✅ Product deleted successfully');

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
