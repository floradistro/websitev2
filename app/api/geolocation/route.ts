import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/edge';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Use Vercel's built-in geolocation from Edge headers (powered by Cloudflare)
    const geo = geolocation(request);
    
    // If Vercel geo is available, use it (more reliable)
    if (geo && geo.country) {
      return NextResponse.json({
        ip: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        city: geo.city || '',
        region: geo.region || '',
        region_code: geo.region || '',
        country_code: geo.country || 'US',
        postal: '', // Vercel doesn't provide postal code
        latitude: geo.latitude ? parseFloat(geo.latitude) : 0,
        longitude: geo.longitude ? parseFloat(geo.longitude) : 0,
      });
    }
    
    // Fallback to ip-api.com using HTTP (free tier)
    const response = await fetch(
      'http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,query',
      {
        headers: {
          'User-Agent': 'FloraDistro/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('ip-api error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Geolocation service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();

    if (data.status !== 'success') {
      return NextResponse.json(
        { error: data.message || 'Geolocation failed' },
        { status: 400 }
      );
    }

    // Return formatted response
    return NextResponse.json({
      ip: data.query,
      city: data.city,
      region: data.regionName,
      region_code: data.region,
      country_code: data.countryCode,
      postal: data.zip,
      latitude: data.lat,
      longitude: data.lon,
    });
  } catch (error) {
    console.error('Geolocation error:', error);
    return NextResponse.json(
      { error: 'Failed to determine location' },
      { status: 500 }
    );
  }
}

