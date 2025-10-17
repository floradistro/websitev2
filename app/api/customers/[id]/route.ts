import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://api.floradistro.com';
const consumerKey = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const consumerSecret = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await axios.get(
      `${baseUrl}/wp-json/wc/v3/customers/${id}`,
      {
        params: {
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Customer GET error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to fetch customer' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const response = await axios.put(
      `${baseUrl}/wp-json/wc/v3/customers/${id}`,
      body,
      {
        params: {
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Customer PUT error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to update customer' },
      { status: error.response?.status || 500 }
    );
  }
}

