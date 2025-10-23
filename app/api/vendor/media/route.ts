import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// GET - List all vendor images
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getServiceSupabase();
    
    // List all files in vendor's folder
    const { data, error } = await supabase.storage
      .from('vendor-product-images')
      .list(vendorId, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('❌ Error listing files:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get public URLs for all files
    const files = data.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('vendor-product-images')
        .getPublicUrl(`${vendorId}/${file.name}`);
      
      return {
        id: file.id,
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
        metadata: file.metadata
      };
    });
    
    return NextResponse.json({
      success: true,
      files,
      count: files.length
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Upload new image
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      }, { status: 400 });
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Preserve exact filename - sanitize only special characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${vendorId}/${sanitizedName}`;
    
    // Check if file already exists
    const { data: existingFiles } = await supabase.storage
      .from('vendor-product-images')
      .list(vendorId, {
        search: sanitizedName
      });
    
    // If file exists, add number suffix to avoid overwrite
    let finalFileName = sanitizedName;
    let finalFilePath = filePath;
    
    if (existingFiles && existingFiles.length > 0) {
      const fileNameWithoutExt = sanitizedName.replace(/\.[^/.]+$/, '');
      const fileExt = sanitizedName.split('.').pop();
      let counter = 1;
      
      // Find available filename with (1), (2), etc.
      while (existingFiles.some(f => f.name === finalFileName)) {
        finalFileName = `${fileNameWithoutExt}(${counter}).${fileExt}`;
        finalFilePath = `${vendorId}/${finalFileName}`;
        counter++;
        
        // Re-check if this numbered version exists
        const { data: checkFiles } = await supabase.storage
          .from('vendor-product-images')
          .list(vendorId, {
            search: finalFileName
          });
        
        if (!checkFiles || checkFiles.length === 0) break;
      }
    }
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor-product-images')
      .upload(finalFilePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(finalFilePath);
    
    return NextResponse.json({
      success: true,
      file: {
        name: finalFileName,
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

// DELETE - Delete image
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    
    if (!fileName) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    const filePath = `${vendorId}/${fileName}`;
    
    // Delete from storage
    const { error } = await supabase.storage
      .from('vendor-product-images')
      .remove([filePath]);
    
    if (error) {
      console.error('❌ Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

