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
    const file = formData.get('logo') || formData.get('file') || formData.get('image');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Convert File to Buffer for axios
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create new FormData for WordPress upload
    const uploadFormData = new FormData();
    uploadFormData.append('logo', new Blob([buffer], { type: file.type }), file.name);
    
    // Upload to WordPress
    const response = await axios.post(
      `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/upload/logo`,
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
