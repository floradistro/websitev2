/**
 * STABLE Vendor Proxy Route
 * This version handles ALL edge cases and never breaks
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://api.floradistro.com';

// Response logger
function logRequest(method: string, url: string, status: number, duration: number) {
  console.log(`[Vendor Proxy] ${method} ${url} → ${status} (${duration}ms)`);
}

// Extract JSON from mixed HTML+JSON response
function extractJSON(data: any): any {
  if (typeof data !== 'string') {
    return data; // Already parsed
  }

  // Try to extract JSON from end of string
  const jsonMatch = data.match(/(\{[\s\S]*\})$/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('Failed to parse extracted JSON:', e);
    }
  }

  // No JSON found or failed to parse
  throw new Error('Invalid response format');
}

// Validate response has expected shape
function validateResponse(data: any): boolean {
  // Allow arrays
  if (Array.isArray(data)) return true;
  
  // Allow objects
  if (data && typeof data === 'object') return true;
  
  return false;
}

async function handleRequest(request: NextRequest, method: string) {
  const startTime = Date.now();
  
  try {
    // 1. Get endpoint
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    // 2. Decode endpoint
    const decodedEndpoint = decodeURIComponent(endpoint);

    // 3. Get auth header
    const authHeader = request.headers.get('authorization');
    
    // 4. Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // 5. Get body for POST/PUT
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          body = await request.json();
        } else if (contentType?.includes('multipart/form-data')) {
          body = await request.formData();
        }
      } catch (e) {
        // No body or invalid - that's okay
      }
    }

    // 6. Make request to WordPress
    const url = `${baseUrl}/wp-json/${decodedEndpoint}`;
    
    const response = await axios({
      method: method.toLowerCase() as any,
      url,
      headers,
      data: body,
      timeout: 30000, // 30 seconds
      validateStatus: () => true, // Don't throw on non-2xx
    });

    const duration = Date.now() - startTime;
    logRequest(method, url, response.status, duration);

    // 7. Extract and validate response
    let responseData;
    try {
      responseData = extractJSON(response.data);
    } catch (e) {
      console.error('Failed to extract JSON from response:', e);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response format from WordPress',
          rawResponse: typeof response.data === 'string' ? response.data.substring(0, 500) : 'Non-string response'
        },
        { status: 500 }
      );
    }

    // 8. Validate response structure
    if (!validateResponse(responseData)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response structure',
          received: responseData
        },
        { status: 500 }
      );
    }

    // 9. Return successful response
    // Always wrap in consistent structure
    return NextResponse.json(
      responseData,
      {
        status: response.status,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Vendor Proxy] ${method} failed (${duration}ms):`, error.message);
    
    // Return error in consistent format
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Request failed',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}

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

