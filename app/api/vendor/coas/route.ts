import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Fetch COAs for vendor with comprehensive product details
    const { data: coas, error: coasError } = await supabase
      .from('vendor_coas')
      .select(`
        *,
        products:product_id (
          id,
          name,
          slug,
          sku,
          featured_image,
          regular_price,
          sale_price,
          price,
          type,
          status,
          stock_status,
          primary_category_id,
          categories:primary_category_id (
            id,
            name,
            slug
          )
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('upload_date', { ascending: false });

    if (coasError) {
      console.error('Error fetching COAs:', coasError);
      return NextResponse.json({ error: coasError.message }, { status: 500 });
    }

    // Transform data to match frontend interface with comprehensive details
    const transformedCoas = (coas || []).map(coa => {
      const product = Array.isArray(coa.products) ? coa.products[0] : coa.products;
      const category = product?.categories;
      const testResults = coa.test_results || {};
      
      // Calculate if COA is expired (90 days)
      const isExpired = coa.expiry_date 
        ? new Date(coa.expiry_date) < new Date()
        : coa.test_date && (new Date().getTime() - new Date(coa.test_date).getTime()) > (90 * 24 * 60 * 60 * 1000);
      
      return {
        id: coa.id,
        productId: product?.id || null,
        productName: product?.name || 'Unknown Product',
        productSku: product?.sku || null,
        productImage: product?.featured_image || null,
        productPrice: product?.price || product?.regular_price || null,
        productCategory: category?.name || null,
        productCategorySlug: category?.slug || null,
        productSlug: product?.slug || null,
        productStatus: product?.status || null,
        productStockStatus: product?.stock_status || null,
        coaNumber: coa.batch_number || `COA-${coa.id.slice(0, 8)}`,
        testDate: coa.test_date,
        uploadDate: coa.upload_date,
        expiryDate: coa.expiry_date,
        status: isExpired ? 'expired' : (coa.is_verified ? 'approved' : 'pending'),
        fileUrl: coa.file_url,
        fileName: coa.file_name,
        fileSize: coa.file_size,
        fileType: coa.file_type,
        testingLab: coa.lab_name || 'N/A',
        batchNumber: coa.batch_number || 'N/A',
        // Cannabinoids
        thc: testResults.thc ? `${testResults.thc}%` : 'N/A',
        cbd: testResults.cbd ? `${testResults.cbd}%` : 'N/A',
        thca: testResults.thca ? `${testResults.thca}%` : null,
        cbda: testResults.cbda ? `${testResults.cbda}%` : null,
        cbg: testResults.cbg ? `${testResults.cbg}%` : null,
        cbn: testResults.cbn ? `${testResults.cbn}%` : null,
        totalCannabinoids: testResults.total_cannabinoids ? `${testResults.total_cannabinoids}%` : null,
        // Terpenes
        terpenes: testResults.terpenes || null,
        totalTerpenes: testResults.total_terpenes ? `${testResults.total_terpenes}%` : null,
        // Safety tests
        pesticides: testResults.pesticides_passed !== undefined ? testResults.pesticides_passed : null,
        heavyMetals: testResults.heavy_metals_passed !== undefined ? testResults.heavy_metals_passed : null,
        microbials: testResults.microbials_passed !== undefined ? testResults.microbials_passed : null,
        mycotoxins: testResults.mycotoxins_passed !== undefined ? testResults.mycotoxins_passed : null,
        solvents: testResults.solvents_passed !== undefined ? testResults.solvents_passed : null,
        // Metadata
        metadata: coa.metadata || {},
        // Raw test results for detailed view
        rawTestResults: testResults
      };
    });

    // If no COAs found in vendor_coas table, check products meta_data for legacy coa_url
    if (transformedCoas.length === 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, meta_data, created_at')
        .eq('vendor_id', vendorId)
        .eq('status', 'published')
        .not('meta_data->coa_url', 'is', null);

      if (!productsError && products) {
        const legacyCoas = products
          .filter(p => p.meta_data?.coa_url)
          .map(p => ({
            id: `legacy-${p.id}`,
            productId: p.id,
            productName: p.name,
            coaNumber: `COA-${p.id.slice(0, 8)}`,
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


