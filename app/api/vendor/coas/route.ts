import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Fetch COAs for vendor
    const { data: coas, error: coasError } = await supabase
      .from('vendor_coas')
      .select(`
        id,
        vendor_id,
        product_id,
        file_name,
        file_url,
        file_size,
        file_type,
        lab_name,
        test_date,
        expiry_date,
        batch_number,
        test_results,
        is_active,
        is_verified,
        upload_date,
        products:product_id (
          id,
          name,
          wordpress_id
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('upload_date', { ascending: false });

    if (coasError) {
      console.error('Error fetching COAs:', coasError);
      return NextResponse.json({ error: coasError.message }, { status: 500 });
    }

    // Transform data to match frontend interface
    const transformedCoas = (coas || []).map(coa => {
      const product = Array.isArray(coa.products) ? coa.products[0] : coa.products;
      return {
        id: coa.id,
        productId: product?.wordpress_id || null,
        productName: product?.name || 'Unknown Product',
        coaNumber: coa.batch_number || `COA-${coa.id.slice(0, 8)}`,
        testDate: coa.test_date,
        uploadDate: coa.upload_date,
        status: coa.is_verified ? 'approved' : 'pending',
        fileUrl: coa.file_url,
        thc: coa.test_results?.thc ? `${coa.test_results.thc}%` : 'N/A',
        cbd: coa.test_results?.cbd ? `${coa.test_results.cbd}%` : 'N/A',
        testingLab: coa.lab_name || 'N/A',
        batchNumber: coa.batch_number || 'N/A',
        expiryDate: coa.expiry_date,
        fileName: coa.file_name,
        fileSize: coa.file_size
      };
    }));

    // If no COAs found in vendor_coas table, check products meta_data for legacy coa_url
    if (transformedCoas.length === 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, wordpress_id, name, meta_data, created_at')
        .eq('vendor_id', vendorId)
        .eq('status', 'published')
        .not('meta_data->coa_url', 'is', null);

      if (!productsError && products) {
        const legacyCoas = products
          .filter(p => p.meta_data?.coa_url)
          .map(p => ({
            id: `legacy-${p.id}`,
            productId: p.wordpress_id,
            productName: p.name,
            coaNumber: `COA-${p.wordpress_id}`,
            testDate: p.created_at,
            uploadDate: p.created_at,
            status: 'approved' as const,
            fileUrl: p.meta_data.coa_url,
            thc: p.meta_data.thc_percentage || 'N/A',
            cbd: p.meta_data.cbd_percentage || 'N/A',
            testingLab: p.meta_data.lab_name || 'N/A',
            batchNumber: p.meta_data.batch_number || 'N/A',
            fileName: 'Certificate of Analysis',
            fileSize: null
          }));

        return NextResponse.json({
          success: true,
          coas: legacyCoas,
          total: legacyCoas.length
        });
      }
    }

    return NextResponse.json({
      success: true,
      coas: transformedCoas,
      total: transformedCoas.length
    });

  } catch (error: any) {
    console.error('Vendor COAs API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch COAs' },
      { status: 500 }
    );
  }
}

