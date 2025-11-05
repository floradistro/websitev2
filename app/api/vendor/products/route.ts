import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { productCache, vendorCache, inventoryCache } from '@/lib/cache-manager';
import { jobQueue } from '@/lib/job-queue';
import { requireVendor } from '@/lib/auth/middleware';
import { withErrorHandler } from '@/lib/api-handler';
import { createProductSchema, safeValidateProductData } from '@/lib/validations/product';

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    // SECURITY FIX: Use authenticated session instead of spoofable headers
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return auth error
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories:primary_category_id(id, name, slug), meta_data')
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
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    // SECURITY FIX: Use authenticated session instead of spoofable headers
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return auth error
    }
    const { vendorId } = authResult;

    const body = await request.json();

    // Validate request body with Zod schema
    const validation = safeValidateProductData(createProductSchema, body);

    if (!validation.success) {
      const errorMessages = validation.errors.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      }, { status: 400 });
    }

    const productData = validation.data;
    
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
    const stockQty = productData.initial_quantity ? parseInt(productData.initial_quantity.toString()) : 0;
    
    // Determine stock management strategy (following enterprise patterns)
    const shouldManageStock = stockQty > 0 || productData.manage_stock === true;
    
    // Derive stock status based on quantity (like Amazon/Apple)
    const deriveStockStatus = (quantity: number): string => {
      if (quantity > 0) return 'instock';
      if (productData.backorders_allowed) return 'onbackorder';
      return 'outofstock';
    };
    
    // TRUE MULTI-TENANT: Vendor autonomy based on product visibility
    // - internal products: auto-publish (vendor has full control)
    // - marketplace products: pending approval (admin quality control)
    const productVisibility = productData.product_visibility || 'internal';
    const productStatus = productVisibility === 'internal' ? 'published' : 'pending';

    const newProduct: any = {
      name: productData.name,
      slug: slug,
      description: productData.description || '',
      type: productData.product_type || 'simple',
      status: productStatus,
      product_visibility: productVisibility,
      vendor_id: vendorId,
      regular_price: productData.price ? parseFloat(productData.price.toString()) : null,
      cost_price: productData.cost_price ? parseFloat(productData.cost_price.toString()) : null,
      sku: productData.sku || `YC-${Date.now()}`,
      // Stock management follows enterprise patterns
      manage_stock: shouldManageStock,
      stock_quantity: shouldManageStock ? stockQty : null,
      stock_status: shouldManageStock ? deriveStockStatus(stockQty) : 'instock',
      backorders_allowed: productData.backorders_allowed || false,
      low_stock_amount: productData.low_stock_amount || 10,
      featured_image_storage: productData.image_urls?.[0] || null,
      image_gallery_storage: productData.image_urls || [],
      custom_fields: productData.custom_fields || {}, // Vendors have full autonomy over custom fields
      attributes: {},
      meta_data: {
        // Cannabis info (DEPRECATED - migrate to custom_fields)
        thc_percentage: productData.thc_percentage || '',
        cbd_percentage: productData.cbd_percentage || '',
        strain_type: productData.strain_type || '',
        lineage: productData.lineage || '',
        terpenes: productData.terpenes || '',
        effects: productData.effects || '',
        coa_url: productData.coa_url || '',
        // Pricing configuration
        pricing_mode: productData.pricing_mode || 'single',
        pricing_tiers: productData.pricing_tiers || [],
        pricing_template_id: productData.pricing_template_id || null
      }
    };

    // Get category ID - accept either category_id (UUID) or category (name)
    if (productData.category_id) {
      // Direct category ID provided
      newProduct.primary_category_id = productData.category_id;
    } else if (productData.category) {
      // Category name provided - look up ID
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', productData.category) // Case-insensitive match
        .limit(1);

      if (categories && categories.length > 0) {
        newProduct.primary_category_id = categories[0].id;
      } else {
        console.warn('⚠️ Category not found:', productData.category);
      }
    }

    // Insert product into Supabase
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(newProduct)
      .select()
      .single();
    
    if (productError) {
      console.error('❌ Error creating product:', productError);
      return NextResponse.json(
        { error: productError.message || 'Failed to create product', details: productError },
        { status: 500 }
      );
    }

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

    // Invalidate relevant caches after product creation
    productCache.invalidatePattern('products:.*');
    vendorCache.invalidatePattern(`vendor-.*:.*vendorId:${vendorId}.*`);
    inventoryCache.invalidatePattern('.*');

    // Queue background jobs (non-blocking)
    
    // Queue email notification to admin
    await jobQueue.enqueue(
      'send-email',
      {
        to: 'admin@floradistro.com',
        subject: 'New Product Submission',
        html: `
          <h2>New Product Submitted for Review</h2>
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>Vendor ID:</strong> ${vendorId}</p>
          <p><strong>Price:</strong> $${product.regular_price}</p>
          <p><strong>Stock:</strong> ${stockQty}g</p>
          <p>Please review and approve/reject in the admin dashboard.</p>
        `,
        productId: product.id,
        vendorId
      },
      { priority: 2 }
    );
    
    // Queue image processing if images exist
    if (productData.image_urls && productData.image_urls.length > 0) {
      await jobQueue.enqueue(
        'process-image',
        {
          productId: product.id,
          images: productData.image_urls
        },
        { priority: 3 }
      );
    }

    // Handle pricing template assignment if provided (NEW SYSTEM)
    if (productData.pricing_template_id) {
      const { error: assignmentError } = await supabase
        .from('product_pricing_assignments')
        .insert({
          product_id: product.id,
          template_id: productData.pricing_template_id,
          is_active: true
        });

      if (assignmentError) {
        console.error('Template assignment error:', assignmentError);
      }
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product submitted for approval'
    });

  } catch (error: any) {
    console.error('❌ Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product', details: error.toString() },
      { status: 500 }
    );
  }
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
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

    // Delete the product (this will cascade to related records based on DB constraints)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ Error deleting product:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

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
});
