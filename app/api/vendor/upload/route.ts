import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logo';
    
    // Get auth header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }
    
    // Get the form data from the request
    const formData = await request.formData();
    
    // Determine endpoint based on upload type
    let uploadEndpoint = 'flora-vendors/v1/vendors/me/upload/logo';
    let fileFieldName = 'logo';
    
    if (type === 'images') {
      uploadEndpoint = 'flora-vendors/v1/vendors/me/upload/images';
    } else if (type === 'coa') {
      uploadEndpoint = 'flora-vendors/v1/vendors/me/upload/coa';
      fileFieldName = 'coa';
    }
    
    // Create new FormData for WordPress upload
    const uploadFormData = new FormData();
    
    // Handle single or multiple files
    if (type === 'images') {
      // Multiple images
      let index = 0;
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('image_') && value instanceof File) {
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);
          uploadFormData.append(`image_${index}`, new Blob([buffer], { type: value.type }), value.name);
          index++;
        }
      }
    } else {
      // Single file (logo or COA)
      const file = formData.get(fileFieldName) || formData.get('logo') || formData.get('file');
      
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      uploadFormData.append(fileFieldName, new Blob([buffer], { type: file.type }), file.name);
      
      // Add metadata for COA uploads
      if (type === 'coa') {
        for (const [key, value] of formData.entries()) {
          if (key !== 'coa' && typeof value === 'string') {
            uploadFormData.append(key, value);
          }
        }
      }
    }
    
    // Upload to WordPress
    const response = await axios.post(
      `${baseUrl}/wp-json/${uploadEndpoint}`,
      uploadFormData,
      {
        headers: {
          'Authorization': authHeader,
        },
        timeout: 30000,
        maxContentLength: 10 * 1024 * 1024, // 10MB
        maxBodyLength: 10 * 1024 * 1024,
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Upload proxy error:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.message || error.message || 'Upload failed',
        details: error.response?.data 
      },
      { status: error.response?.status || 500 }
    );
  }
}
