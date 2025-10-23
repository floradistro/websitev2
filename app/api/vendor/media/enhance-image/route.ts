import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

// Single image enhancement
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { imageUrl, fileName, enhanceMode = 'auto' } = body;
    
    if (!imageUrl || !fileName) {
      return NextResponse.json({ 
        error: 'Image URL and filename required' 
      }, { status: 400 });
    }
    
    console.log(`🔵 Enhancing ${fileName} with Cloudinary (mode: ${enhanceMode})...`);
    
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder: `vendors/${vendorId}`,
      public_id: fileName.replace(/\.[^/.]+$/, ''),
      overwrite: true,
      invalidate: true
    });
    
    console.log(`✅ Uploaded to Cloudinary: ${uploadResult.public_id}`);

    // Build TRANSFORMED URL with aggressive enhancements
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      transformation: [
        { effect: 'improve:outdoor:50' },
        { effect: 'auto_color:80' },
        { effect: 'auto_brightness:80' },
        { effect: 'auto_contrast:80' },
        { effect: 'vibrance:30' },
        { effect: 'sharpen:100' },
        { quality: 'auto:best' },
        { fetch_format: 'png' }
      ],
      secure: true
    });
    
    console.log(`🎨 Enhanced URL: ${transformedUrl}`);
    
    // Download ENHANCED image
    const enhancedImageResponse = await axios.get(transformedUrl, {
      responseType: 'arraybuffer',
    });
    
    console.log(`📥 Downloaded enhanced (${(enhancedImageResponse.data.length / 1024 / 1024).toFixed(2)}MB)`);
    
    const supabase = getServiceSupabase();
    
    // Delete original
    const originalFilePath = `${vendorId}/${fileName}`;
    await supabase.storage
      .from('vendor-product-images')
      .remove([originalFilePath]);
    
    console.log(`🗑️ Deleted original: ${fileName}`);
    
    // Upload enhanced version with same name
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${fileNameWithoutExt}.png`;
    const filePath = `${vendorId}/${newFileName}`;
    
    await supabase.storage
      .from('vendor-product-images')
      .upload(filePath, Buffer.from(enhancedImageResponse.data), {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
    
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(filePath);
    
    console.log(`✅ Replaced with enhanced version: ${newFileName}`);
    
    // Clean up from Cloudinary (optional - keep if you want backup)
    // await cloudinary.uploader.destroy(uploadResult.public_id);
    
    return NextResponse.json({
      success: true,
      file: {
        name: newFileName,
        url: publicUrl,
        originalFileName: fileName,
        enhancements: ['auto_color', 'auto_brightness', 'auto_contrast']
      }
    });
    
  } catch (error: any) {
    console.error('❌ Enhancement error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to enhance image'
    }, { status: 500 });
  }
}

