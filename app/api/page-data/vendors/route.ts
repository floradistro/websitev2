import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = getServiceSupabase();
    
    // Get vendors with pre-calculated stats in ONE query
    const vendorsResult = await supabase
      .from('vendors')
      .select(`
        id,
        store_name,
        slug,
        logo_url,
        banner_url,
        store_tagline,
        store_description,
        state,
        city,
        address,
        zip,
        phone,
        status,
        total_locations,
        social_links,
        brand_colors,
        created_at
      `)
      .eq('status', 'active')
      .order('store_name', { ascending: true });
    
    if (vendorsResult.error) throw vendorsResult.error;
    
    // Get product counts and category breakdowns
    const { data: productData } = await supabase
      .from('products')
      .select(`
        vendor_id,
        product_categories(
          category:categories(slug, name)
        )
      `)
      .eq('status', 'published');
    
    const vendorStats = (productData || []).reduce((acc: any, p: any) => {
      if (!acc[p.vendor_id]) {
        acc[p.vendor_id] = {
          count: 0,
          categories: new Set()
        };
      }
      acc[p.vendor_id].count++;
      p.product_categories?.forEach((pc: any) => {
        if (pc.category?.name) acc[p.vendor_id].categories.add(pc.category.name);
      });
      return acc;
    }, {});
    
    // Map to expected format
    const vendors = (vendorsResult.data || []).map((v: any) => {
      const stats = vendorStats[v.id] || { count: 0, categories: new Set() };
      const socialLinks = typeof v.social_links === 'string' ? JSON.parse(v.social_links) : v.social_links || {};
      const brandColors = typeof v.brand_colors === 'string' ? JSON.parse(v.brand_colors) : v.brand_colors || {};
      
      return {
        id: v.id,
        name: v.store_name,
        slug: v.slug,
        logo: v.logo_url || '/yacht-club-logo.png',
        banner: v.banner_url,
        tagline: v.store_tagline || '',
        description: v.store_description || '',
        location: v.city || v.state || 'CA',
        city: v.city,
        state: v.state,
        address: v.address,
        zip: v.zip,
        phone: v.phone,
        region: v.state || 'CA',
        totalLocations: v.total_locations || 1,
        totalProducts: stats.count,
        categories: Array.from(stats.categories),
        verified: v.status === 'active',
        featured: false,
        instagram: socialLinks.instagram,
        website: socialLinks.website,
        primaryColor: brandColors.primary || '#000000',
        accentColor: brandColors.accent || '#ffffff',
      };
    });
    
    // Get unique regions
    const regions = [...new Set(vendors.map(v => v.region))].sort();
    
    // Calculate aggregate stats
    const stats = {
      totalVendors: vendors.length,
      totalProducts: vendors.reduce((sum, v) => sum + v.totalProducts, 0),
      averageRating: vendors.length > 0 
        ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)
        : '0.0',
      featuredVendor: vendors.find(v => v.featured) || vendors[0] || null,
    };
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        vendors: vendors,
        regions: regions,
        stats: stats,
      },
      meta: {
        responseTime: `${responseTime}ms`,
        vendorCount: vendors.length,
        regionCount: regions.length,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'X-Response-Time': `${responseTime}ms`,
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error in /api/page-data/vendors:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch vendors data',
        data: {
          vendors: [],
          regions: [],
          stats: {
            totalVendors: 0,
            totalProducts: 0,
            averageRating: '0.0',
            featuredVendor: null,
          }
        }
      },
      { status: 500 }
    );
  }
}

