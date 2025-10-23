import { headers } from 'next/headers';
import { getServiceSupabase } from '@/lib/supabase/client';

export interface VendorStorefront {
  id: string;
  store_name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  store_description: string | null;
  store_tagline: string | null;
  brand_colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  } | null;
  custom_font: string | null;
  custom_css: string | null;
  social_links: any;
  business_hours: any;
  return_policy: string | null;
  shipping_policy: string | null;
}

export interface StorefrontTheme {
  template: string | null;
  customizations: any;
  ai_specs: any;
}

export async function getVendorFromHeaders(): Promise<string | null> {
  const headersList = await headers();
  
  // Check for vendor ID in headers (from middleware)
  const vendorIdFromHeader = headersList.get('x-vendor-id');
  if (vendorIdFromHeader) {
    return vendorIdFromHeader;
  }
  
  // For preview/testing: check query params (only in development)
  if (process.env.NODE_ENV === 'development') {
    // This will be set by preview route
    return null;
  }
  
  return null;
}

export async function getVendorStorefront(vendorId: string): Promise<VendorStorefront | null> {
  try {
    const supabase = getServiceSupabase();
    
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select(`
        id,
        store_name,
        slug,
        logo_url,
        banner_url,
        store_description,
        store_tagline,
        brand_colors,
        custom_font,
        custom_css,
        social_links,
        business_hours,
        return_policy,
        shipping_policy
      `)
      .eq('id', vendorId)
      .eq('status', 'active')
      .single();

    if (error || !vendor) {
      console.error('Error fetching vendor:', error);
      return null;
    }

    return vendor;
  } catch (error) {
    console.error('Error in getVendorStorefront:', error);
    return null;
  }
}

export async function getStorefrontTheme(vendorId: string): Promise<StorefrontTheme> {
  try {
    const supabase = getServiceSupabase();
    
    const { data: storefront } = await supabase
      .from('vendor_storefronts')
      .select('template, customizations, ai_specs')
      .eq('vendor_id', vendorId)
      .eq('status', 'deployed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (storefront) {
      return {
        template: storefront.template,
        customizations: storefront.customizations || {},
        ai_specs: storefront.ai_specs || {}
      };
    }

    // Return default theme if no storefront configured
    return {
      template: 'default',
      customizations: {},
      ai_specs: {}
    };
  } catch (error) {
    console.error('Error in getStorefrontTheme:', error);
    return {
      template: 'default',
      customizations: {},
      ai_specs: {}
    };
  }
}

export async function getVendorLocations() {
  try {
    const supabase = getServiceSupabase();
    
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, city, state')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    // Mark all locations as active (for ProductCard compatibility)
    return (locations || []).map((loc: any) => ({
      ...loc,
      is_active: "1"
    }));
  } catch (error) {
    console.error('Error in getVendorLocations:', error);
    return [];
  }
}

export async function getVendorProducts(vendorId: string, limit?: number) {
  try {
    const supabase = getServiceSupabase();
    
    // Fetch products with inventory (same as main API)
    let productsQuery = supabase
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
        description,
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
      .eq('vendor_id', vendorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (limit) {
      productsQuery = productsQuery.limit(limit);
    }

    const [productsResult, vendorPricingConfigsResult] = await Promise.all([
      productsQuery,
      // Fetch pricing tiers for this vendor (same as main API)
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
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
    ]);

    if (productsResult.error) {
      console.error('Error fetching products:', productsResult.error);
      return [];
    }

    // Build pricing tiers from vendor config
    const pricingTiers: any[] = [];
    
    if (vendorPricingConfigsResult.data && vendorPricingConfigsResult.data.length > 0) {
      const config = vendorPricingConfigsResult.data[0];
      
      if (config.blueprint?.price_breaks) {
        const pricingValues = config.pricing_values || {};
        
        config.blueprint.price_breaks.forEach((priceBreak: any) => {
          const breakId = priceBreak.break_id;
          const vendorPrice = pricingValues[breakId];
          
          // Only add if tier is ENABLED and has a price
          if (vendorPrice && vendorPrice.enabled !== false && vendorPrice.price) {
            pricingTiers.push({
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
        pricingTiers.sort((a, b) => a.sort_order - b.sort_order);
      }
    }

    // Map products to format expected by ProductCard
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
      
      return {
        ...p,
        fields: fields,
        pricingTiers: pricingTiers, // Apply vendor pricing to all products
        total_stock: totalStock,
        stock_status: actualStockStatus,
        stock_quantity: totalStock,
        categories: p.product_categories?.map((pc: any) => pc.category) || [],
      };
    });

    return products;
  } catch (error) {
    console.error('Error in getVendorProducts:', error);
    return [];
  }
}

