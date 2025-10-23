import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = getServiceSupabase();
    
    // Execute ALL queries in parallel - single round trip
    const [categoriesResult, locationsResult, productsResult, vendorsResult, pricingAssignmentsResult] = await Promise.all([
      // Categories
      supabase
        .from('categories')
        .select('id, name, slug, description')
        .order('name', { ascending: true }),
      
      // Locations (mark all as active for products page)
      supabase
        .from('locations')
        .select('id, name, city, state')
        .order('name', { ascending: true }),
      
      // Products with inventory and categories
      supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          regular_price,
          sale_price,
          stock_quantity,
          stock_status,
          featured_image_storage,
          image_gallery_storage,
          blueprint_fields,
          meta_data,
          vendor_id,
          created_at,
          product_categories(
            category:categories(id, name, slug)
          ),
          inventory(
            id,
            quantity,
            location_id,
            stock_status,
            location:locations(id, name, city, state)
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(200),
      
      // Active vendors
      supabase
        .from('vendors')
        .select('id, store_name, slug, logo_url, status, state, city')
        .eq('status', 'active')
        .order('store_name', { ascending: true}),
      
      // Pricing tier assignments
      supabase
        .from('product_pricing_assignments')
        .select(`
          product_id,
          price_overrides,
          blueprint:pricing_tier_blueprints(
            id,
            name,
            price_breaks
          )
        `)
        .eq('is_active', true)
    ]);
    
    // Check for errors
    if (categoriesResult.error) throw categoriesResult.error;
    if (locationsResult.error) throw locationsResult.error;
    if (productsResult.error) throw productsResult.error;
    if (vendorsResult.error) throw vendorsResult.error;
    if (pricingAssignmentsResult.error) console.warn('Pricing assignments error:', pricingAssignmentsResult.error);
    
    // Build pricing map by product_id
    const pricingMap = new Map();
    (pricingAssignmentsResult.data || []).forEach((assignment: any) => {
      if (!assignment.blueprint?.price_breaks) return;
      
      const tiers = assignment.blueprint.price_breaks.map((priceBreak: any) => {
        // Check for price override for this specific break
        const overridePrice = assignment.price_overrides?.[priceBreak.break_id];
        
        return {
          qty: priceBreak.qty,
          weight: `${priceBreak.qty}${priceBreak.unit}`,
          price: overridePrice || 0, // Will be calculated from base price if 0
          label: priceBreak.label,
          min_quantity: priceBreak.qty,
        };
      });
      
      pricingMap.set(assignment.product_id, tiers);
    });
    
    // Map products to expected format
    const products = (productsResult.data || []).map((p: any) => {
      // Extract blueprint fields (handle both array and object)
      const fields: { [key: string]: any } = {};
      const blueprintFields = p.blueprint_fields || {};
      
      // If it's an array (old format), convert it
      if (Array.isArray(blueprintFields)) {
        blueprintFields.forEach((field: any) => {
          if (field && field.field_name && field.field_value) {
            fields[field.field_name] = field.field_value;
          }
        });
      } 
      // If it's an object (new format), use it directly
      else if (typeof blueprintFields === 'object' && blueprintFields !== null) {
        Object.assign(fields, blueprintFields);
      }
      
      // Calculate actual stock from inventory
      const totalStock = p.inventory?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0;
      const actualStockStatus = totalStock > 0 ? 'instock' : 'outofstock';
      
      // Get pricing tiers for this product
      let pricingTiers = pricingMap.get(p.id) || [];
      
      // If we have tiers but no prices set, calculate based on base price
      if (pricingTiers.length > 0 && p.price) {
        const basePrice = parseFloat(p.price);
        pricingTiers = pricingTiers.map((tier: any) => ({
          ...tier,
          price: tier.price || (basePrice * tier.qty) // Calculate price if not set
        }));
      }
      
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        stock_quantity: totalStock, // Use calculated from inventory
        stock_status: actualStockStatus, // Use calculated status
        featured_image_storage: p.featured_image_storage,
        image_gallery_storage: p.image_gallery_storage,
        categories: p.product_categories?.map((pc: any) => pc.category) || [],
        inventory: p.inventory || [],
        total_stock: totalStock, // Use calculated value
        fields: fields,
        pricing_tiers: pricingTiers,
        vendor_id: p.vendor_id,
      };
    });
    
    // Map vendors
    const vendors = (vendorsResult.data || []).map((v: any) => ({
      id: v.id,
      name: v.store_name,
      slug: v.slug,
      logo: v.logo_url || '/yacht-club-logo.png',
      region: v.state || 'California',
      state: v.state,
    }));
    
    const responseTime = Date.now() - startTime;
    
    // Mark all locations as active (for product display purposes)
    const locationsWithActive = (locationsResult.data || []).map((loc: any) => ({
      ...loc,
      is_active: "1" // Mark as active for ProductCard compatibility
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesResult.data || [],
        locations: locationsWithActive,
        products: products,
        vendors: vendors,
      },
      meta: {
        responseTime: `${responseTime}ms`,
        productCount: products.length,
        categoryCount: categoriesResult.data?.length || 0,
        locationCount: locationsResult.data?.length || 0,
        vendorCount: vendors.length,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60',
        'X-Response-Time': `${responseTime}ms`,
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error in /api/page-data/products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch products data',
        data: {
          categories: [],
          locations: [],
          products: [],
          vendors: [],
        }
      },
      { status: 500 }
    );
  }
}

