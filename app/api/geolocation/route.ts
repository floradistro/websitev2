import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    // Fetch from ip-api.com server-side (bypasses CORS and 403 issues)
    const response = await fetch(
      'https://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,query',
      {
        headers: {
          'User-Agent': 'FloraDistro/1.0',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
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

