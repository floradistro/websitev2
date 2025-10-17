import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";

// Proxy WordPress API requests to avoid CORS issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  if (!path) {
    return NextResponse.json({ error: 'Path required' }, { status: 400 });
  }

  try {
    // Forward all query params
    const params = Object.fromEntries(searchParams.entries());
    delete params.path;

    const response = await axios.get(`${baseUrl}${path}`, {
      params,
      timeout: 15000
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  if (!path) {
    return NextResponse.json({ error: 'Path required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // Forward all query params
    const params = Object.fromEntries(searchParams.entries());
    delete params.path;

    const response = await axios.post(`${baseUrl}${path}`, body, {
      params,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy POST error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  if (!path) {
    return NextResponse.json({ error: 'Path required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // Forward all query params
    const params = Object.fromEntries(searchParams.entries());
    delete params.path;

    const response = await axios.put(`${baseUrl}${path}`, body, {
      params,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy PUT error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

