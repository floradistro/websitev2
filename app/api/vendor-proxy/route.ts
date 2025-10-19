import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint parameter required' }, { status: 400 });
    }

    // Decode endpoint (it comes URL-encoded from the client)
    const decodedEndpoint = decodeURIComponent(endpoint);

    // Get auth header
    const authHeader = request.headers.get('authorization');
    
    // Build headers
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Get body for POST/PUT
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          body = await request.json();
        } catch (e) {
          // No body or invalid JSON
        }
      } else if (contentType?.includes('multipart/form-data')) {
        body = await request.formData();
      }
    }

    // Make request to WordPress
    const url = `${baseUrl}/wp-json/${decodedEndpoint}`;
    
    console.log('Proxying to:', url);
    
    const response = await axios({
      method: method.toLowerCase(),
      url,
      headers,
      data: body,
      timeout: 15000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Vendor proxy error:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.message || error.message || 'Request failed',
        details: error.response?.data 
      },
      { status: error.response?.status || 500 }
    );
  }
}
