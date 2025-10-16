import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = 'AIzaSyB29Ebv0A4fYIY-ZB08khDUQ227oTqevaE';

// Hardcoded Place IDs for each location
// These are extracted from Google Maps URLs
const PLACE_IDS: { [key: string]: string } = {
  'Salisbury': '', // Will search dynamically - Flora Distro 111 W Bank St, Salisbury, NC
  'Charlotte Monroe': '', // Will search dynamically
  'Charlotte Central': '', // Will search dynamically
  'Blowing Rock': '', // Will search dynamically
  'Elizabethton': '' // Will search dynamically
};

async function findPlaceId(query: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`
    );
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    }
    return null;
  } catch (error) {
    console.error('Error searching place:', error);
    return null;
  }
}

async function getPlaceDetails(placeId: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${GOOGLE_API_KEY}`;
    console.log('Fetching place details from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Place details response:', data);
    
    if (data.status === 'OK' && data.result) {
      return {
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        reviews: data.result.reviews?.slice(0, 3) || []
      };
    }
    
    console.error('Place details error:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationName = searchParams.get('location');
  const address = searchParams.get('address');

  if (!locationName || !address) {
    return NextResponse.json({ error: 'Missing location or address' }, { status: 400 });
  }

  try {
    // Check if we have a cached Place ID
    let placeId = PLACE_IDS[locationName];
    
    // If not, search for it
    if (!placeId) {
      // Try multiple search queries to find the right place
      const cleanAddress = address.replace(/\n/g, ' ');
      const searchQueries = [
        `Flora Distro ${cleanAddress}`,
        `Flora ${cleanAddress}`,
        cleanAddress
      ];
      
      console.log(`Searching for ${locationName} with queries:`, searchQueries);
      
      for (const query of searchQueries) {
        placeId = await findPlaceId(query);
        console.log(`Query "${query}" returned Place ID:`, placeId);
        if (placeId) break;
      }
      
      if (!placeId) {
        console.log(`Could not find Place ID for ${locationName}`);
        return NextResponse.json({ 
          error: 'Place not found', 
          location: locationName,
          searchQueries: searchQueries 
        }, { status: 404 });
      }
      
      // Cache it
      PLACE_IDS[locationName] = placeId;
      console.log(`Found Place ID for ${locationName}: ${placeId}`);
    }
    
    // Get place details
    const details = await getPlaceDetails(placeId);
    
    if (!details) {
      return NextResponse.json({ 
        error: 'Could not fetch details', 
        location: locationName,
        placeId: placeId 
      }, { status: 500 });
    }
    
    return NextResponse.json(details);
  } catch (error: any) {
    console.error('Error in Google Reviews API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

