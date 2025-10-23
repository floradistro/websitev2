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

export async function getVendorProducts(vendorId: string, limit?: number) {
  try {
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories (
          category:categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Error in getVendorProducts:', error);
    return [];
  }
}

