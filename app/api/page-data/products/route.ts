import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = getServiceSupabase();
    
    // Execute ALL queries in parallel - single round trip
    const [categoriesResult, locationsResult, productsResult, vendorsResult, vendorPricingConfigsResult] = await Promise.all([
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
          description,
          price,
          regular_price,
          sale_price,
          stock_quantity,
          stock_status,
          featured_image_storage,
          image_gallery_storage,
          custom_fields,
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
      
      // Vendor pricing configs (auto-applies to ALL vendor products)
      supabase
        .from('vendor_pricing_configs')
        .select(`
          vendor_id,
          pricing_values,
          blueprint:pricing_tier_blueprints(
            id,
            name,
            slug,
            tier_type,
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
    if (vendorPricingConfigsResult.error) console.warn('Vendor pricing configs error:', vendorPricingConfigsResult.error);
    
    // Build pricing map by vendor_id (pricing applies to ALL products from that vendor)
    const vendorPricingMap = new Map();
    
    (vendorPricingConfigsResult.data || []).forEach((config: any) => {
      if (!config.blueprint?.price_breaks) return;
      
      const pricingValues = config.pricing_values || {};
      const tiers: any[] = [];
      
      config.blueprint.price_breaks.forEach((priceBreak: any) => {
        const breakId = priceBreak.break_id;
        const vendorPrice = pricingValues[breakId];
        
        // Only add if tier is ENABLED and has a price
        if (vendorPrice && vendorPrice.enabled !== false && vendorPrice.price) {
          tiers.push({
            weight: priceBreak.label || `${priceBreak.qty}${priceBreak.unit || ''}`,
            qty: priceBreak.qty || 1,
            price: parseFloat(vendorPrice.price),
            label: priceBreak.label,
            tier_name: priceBreak.label,
            break_id: breakId,
            blueprint_name: config.blueprint.name,
            sort_order: priceBreak.sort_order || 0,
            min_quantity: priceBreak.qty,
          });
        }
      });
      
      // Sort by sort_order
      tiers.sort((a, b) => a.sort_order - b.sort_order);
      
      // Store tiers for this vendor (will apply to ALL their products)
      vendorPricingMap.set(config.vendor_id, tiers);
    });
    
    // Map products to expected format
    const products = (productsResult.data || []).map((p: any, index: number) => {
      // Extract blueprint fields (handle both array and object)
      const fields: { [key: string]: any } = {};
      const blueprintFields = p.custom_fields || {};
      
      // Label to field_id mapping
      const labelToFieldId: { [key: string]: string } = {
        'Strain Type': 'strain_type',
        'Genetics': 'genetics',
        'THC Content': 'thc_content',
        'CBD Content': 'cbd_content',
        'Dominant Terpenes': 'terpenes',
        'Effects': 'effects',
        'Flavors': 'flavors',
        'Lineage': 'lineage',
        'Nose': 'nose',
      };
      
      // If it's an array, convert it
      if (Array.isArray(blueprintFields)) {
        blueprintFields.forEach((field: any) => {
          if (field) {
            // New format with label/value from our strain update
            if (field.label && field.value !== undefined) {
              const fieldId = labelToFieldId[field.label] || field.label.toLowerCase().replace(/\s+/g, '_');
              fields[fieldId] = field.value;
            }
            // Old format: {field_name, field_value}
            else if (field.field_name && field.field_value !== undefined) {
              fields[field.field_name] = field.field_value;
            }
            // Another format: {field_id, value}
            else if (field.field_id && field.value !== undefined) {
              fields[field.field_id] = field.value;
            }
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
      
      // Get pricing tiers for this product (from vendor's config)
      // Apply vendor pricing to ALL vendor products (vendor configures which pricing they use)
      const pricingTiers = vendorPricingMap.get(p.vendor_id) || [];
      
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
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

