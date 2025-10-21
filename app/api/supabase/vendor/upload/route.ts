import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string; // 'logo', 'banner', 'product', 'coa'
    const productId = formData.get('product_id') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!uploadType) {
      return NextResponse.json({ error: 'Upload type required' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Determine bucket and path based on type
    let bucket = 'vendor-product-images';
    let folder = '';
    
    switch (uploadType) {
      case 'logo':
        bucket = 'vendor-logos';
        folder = `${vendorId}`;
        break;
      case 'banner':
        bucket = 'vendor-logos';
        folder = `${vendorId}/banners`;
        break;
      case 'product':
        bucket = 'vendor-product-images';
        folder = `${vendorId}`;
        break;
      case 'coa':
        bucket = 'vendor-coas';
        folder = `${vendorId}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }
    
    console.log('🔵 Uploading to bucket:', bucket, 'folder:', folder, 'file:', file.name);
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${folder}/${fileName}`;
    
    // Convert File to Buffer for Supabase
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    console.log('✅ File uploaded:', filePath);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('✅ Public URL:', publicUrl);
    
    // Update vendor record if logo or banner
    if (uploadType === 'logo') {
      await supabase
        .from('vendors')
        .update({ logo_url: publicUrl })
        .eq('id', vendorId);
    } else if (uploadType === 'banner') {
      await supabase
        .from('vendors')
        .update({ banner_url: publicUrl })
        .eq('id', vendorId);
    }
    
    // If COA, create COA record
    if (uploadType === 'coa' && productId) {
      await supabase
        .from('vendor_coas')
        .insert({
          vendor_id: vendorId,
          product_id: productId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          upload_date: new Date().toISOString()
        });
    }
    
    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        url: publicUrl,
        size: file.size,
        type: file.type
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

