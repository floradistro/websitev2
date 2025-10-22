import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Get all vendors from Supabase
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Get product counts in a single query
    const { data: productCounts } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('status', 'published')
      .gt('stock_quantity', 0);
    
    // Count products per vendor
    const productCountMap = (productCounts || []).reduce((acc: any, p: any) => {
      acc[p.vendor_id] = (acc[p.vendor_id] || 0) + 1;
      return acc;
    }, {});
    
    // Enrich vendors with product counts (no await needed)
    const enrichedVendors = vendors.map((vendor: any) => ({
      id: vendor.id,
      email: vendor.email,
      store_name: vendor.store_name,
      slug: vendor.slug,
      status: vendor.status,
      created_date: vendor.created_at,
      total_products: productCountMap[vendor.id] || 0,
      total_orders: 0,
      total_sales: 0,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      zip: vendor.zip,
      logo_url: vendor.logo_url,
      banner_url: vendor.banner_url,
      tagline: vendor.store_tagline,
      region: vendor.region || vendor.state,
      brand_colors: vendor.brand_colors,
      social_links: vendor.social_links,
      custom_font: vendor.custom_font,
      custom_css: vendor.custom_css,
      store_description: vendor.store_description,
      rating: 0,
      review_count: 0,
      product_count: productCountMap[vendor.id] || 0,
      verified: vendor.status === 'active' ? 1 : 0,
      featured: 0
    }));

    return NextResponse.json({
      success: true,
      vendors: enrichedVendors,
      total: enrichedVendors.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      }
    });

  } catch (error: any) {
    console.error('Get vendors error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch vendors'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, vendor_id, ...updateData } = body;
    const supabase = getServiceSupabase();

    // UPDATE VENDOR
    if (action === 'update') {
      console.log('🔵 Updating vendor:', vendor_id);
      
      const { error } = await supabase
        .from('vendors')
        .update({
          store_name: updateData.store_name,
          email: updateData.email,
          phone: updateData.phone,
          address: updateData.address,
          city: updateData.city,
          state: updateData.state,
          zip: updateData.zip,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor_id);

      if (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to update vendor',
          error: error.message
        }, { status: 500 });
      }
      
      console.log('✅ Vendor updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Vendor updated successfully'
      });
    }

    // SUSPEND VENDOR
    if (action === 'suspend') {
      console.log('🔵 Suspending vendor:', vendor_id);
      
      const { error } = await supabase
        .from('vendors')
        .update({ 
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor_id);

      if (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to suspend vendor',
          error: error.message
        }, { status: 500 });
      }
      
      // Also update all vendor's products to draft status
      await supabase
        .from('products')
        .update({ 
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('vendor_id', vendor_id);
      
      console.log('✅ Vendor suspended - all products hidden');

      return NextResponse.json({
        success: true,
        message: 'Vendor suspended - all products hidden immediately'
      });
    }

    // ACTIVATE VENDOR
    if (action === 'activate') {
      console.log('🔵 Activating vendor:', vendor_id);
      
      const { error } = await supabase
        .from('vendors')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor_id);

      if (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to activate vendor',
          error: error.message
        }, { status: 500 });
      }
      
      // Re-publish all previously suspended products (that were published before)
      // Note: Admin will need to manually approve any that should go live
      console.log('✅ Vendor activated - products remain in draft until manually approved');

      return NextResponse.json({
        success: true,
        message: 'Vendor activated - products require manual approval to go live'
      });
    }

    // DELETE VENDOR - Supabase Only
    if (action === 'delete') {
      console.log('🔵 Deleting vendor:', vendor_id);
      
      try {
        // 1. Get vendor data
        const { data: vendor, error: fetchError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendor_id)
          .single();

        if (fetchError || !vendor) {
          console.error('❌ Vendor not found:', fetchError);
          return NextResponse.json({
            success: false,
            message: 'Vendor not found'
          }, { status: 404 });
        }

        console.log('🔵 Found vendor:', vendor.store_name);

        // 2. Get all vendor locations first
        const { data: vendorLocations } = await supabase
          .from('locations')
          .select('id')
          .eq('vendor_id', vendor_id);
        
        const locationIds = vendorLocations?.map(l => l.id) || [];
        console.log(`🔵 Found ${locationIds.length} locations to clean up`);

        // 3. Delete stock_movements for these locations
        if (locationIds.length > 0) {
          console.log('🔵 Deleting stock movements...');
          const { error: movementsError } = await supabase
            .from('stock_movements')
            .delete()
            .or(locationIds.map(id => `from_location_id.eq.${id},to_location_id.eq.${id}`).join(','));
          
          if (movementsError) {
            console.error('❌ Failed to delete stock movements:', movementsError);
          } else {
            console.log('✅ Stock movements deleted');
          }
        }

        // 4. Delete inventory for these locations
        if (locationIds.length > 0) {
          console.log('🔵 Deleting inventory...');
          const { error: inventoryError } = await supabase
            .from('inventory')
            .delete()
            .in('location_id', locationIds);
          
          if (inventoryError) {
            console.error('❌ Failed to delete inventory:', inventoryError);
          } else {
            console.log('✅ Inventory deleted');
          }
        }

        // 5. Delete all vendor locations
        console.log('🔵 Deleting vendor locations...');
        const { error: locationsError } = await supabase
          .from('locations')
          .delete()
          .eq('vendor_id', vendor_id);
        
        if (locationsError) {
          console.error('❌ Failed to delete locations:', locationsError);
        } else {
          console.log('✅ Locations deleted');
        }

        // 6. Delete all vendor products
        console.log('🔵 Deleting vendor products...');
        const { error: productsError } = await supabase
          .from('products')
          .delete()
          .eq('vendor_id', vendor_id);
        
        if (productsError) {
          console.error('❌ Failed to delete products:', productsError);
        } else {
          console.log('✅ Products deleted');
        }

        // 7. Delete Supabase auth user
        console.log('🔵 Deleting auth user...');
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const authUser = authUsers.users.find(u => u.email === vendor.email);
          if (authUser) {
            await supabase.auth.admin.deleteUser(authUser.id);
            console.log('✅ Auth user deleted');
          }
        } catch (err: any) {
          console.error('⚠️ Auth user delete failed (non-blocking):', err.message);
          // Continue with vendor deletion
        }

        // 8. Delete vendor from Supabase
        console.log('🔵 Deleting vendor record...');
        const { error: deleteError } = await supabase
          .from('vendors')
          .delete()
          .eq('id', vendor_id);

        if (deleteError) {
          console.error('❌ Failed to delete vendor:', deleteError);
          return NextResponse.json({
            success: false,
            message: 'Failed to delete vendor from database',
            error: deleteError.message
          }, { status: 500 });
        }

        console.log('✅ Vendor deleted successfully');

        return NextResponse.json({
          success: true,
          message: 'Vendor deleted successfully'
        });
        
      } catch (deleteErr: any) {
        console.error('❌ Delete vendor error:', deleteErr);
        return NextResponse.json({
          success: false,
          message: 'Failed to delete vendor',
          error: deleteErr.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Vendor action error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to perform action'
    }, { status: 500 });
  }
}

