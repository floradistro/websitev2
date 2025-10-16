/**
 * Geolocation utilities for finding nearest Flora warehouse
 */

export interface UserLocation {
  ip: string;
  city: string;
  region: string;
  region_code: string;
  country_code: string;
  postal: string;
  latitude: number;
  longitude: number;
}

export interface FloraLocation {
  id: string;
  name: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Get user's location from IP address
 */
export async function getUserLocation(): Promise<UserLocation | null> {
  try {
    // Use ip-api.com for IP geolocation (free, higher limits, no key needed)
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,query', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn('IP geolocation failed, using fallback');
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 'success') {
      console.warn('IP geolocation unsuccessful:', data.message);
      return null;
    }
    
    return {
      ip: data.query,
      city: data.city,
      region: data.regionName,
      region_code: data.region,
      country_code: data.countryCode,
      postal: data.zip,
      latitude: data.lat,
      longitude: data.lon,
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get distance to a specific Flora location
 */
export function getDistanceToLocation(
  userLocation: UserLocation,
  locationId: string
): number | null {
  const coords = FLORA_COORDINATES[locationId];
  
  if (!coords || !userLocation) {
    return null;
  }
  
  return calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    coords.lat,
    coords.lon
  );
}

/**
 * Flora location coordinates (approximate)
 */
const FLORA_COORDINATES: { [key: string]: { lat: number; lon: number } } = {
  '21': { lat: 36.1347, lon: -81.6779 }, // Blowing Rock, NC
  '20': { lat: 35.1495, lon: -80.9378 }, // Charlotte Central, NC
  '19': { lat: 35.2014, lon: -80.7581 }, // Charlotte Monroe, NC
  '35': { lat: 36.3484, lon: -82.2107 }, // Elizabethton, TN
  '34': { lat: 35.6709, lon: -80.4742 }, // Salisbury, NC
};

/**
 * Find nearest Flora location to user
 */
export function findNearestLocation(
  userLocation: UserLocation,
  availableLocations: FloraLocation[]
): FloraLocation | null {
  if (!userLocation || availableLocations.length === 0) {
    return null;
  }

  const userLat = userLocation.latitude;
  const userLon = userLocation.longitude;

  let nearestLocation = availableLocations[0];
  let shortestDistance = Infinity;

  for (const location of availableLocations) {
    const coords = FLORA_COORDINATES[location.id];
    
    if (!coords) {
      console.warn(`No coordinates for location ${location.id}`);
      continue;
    }

    const distance = calculateDistance(userLat, userLon, coords.lat, coords.lon);
    
    console.log(`Distance to ${location.name}: ${Math.round(distance)} miles`);

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestLocation = location;
    }
  }

  console.log(`✓ Nearest location: ${nearestLocation.name} (${Math.round(shortestDistance)} miles away)`);

  return nearestLocation;
}

/**
 * Get user's ZIP code from IP (quick method)
 */
export async function getUserZipCode(): Promise<string | null> {
  try {
    const userLocation = await getUserLocation();
    return userLocation?.postal || null;
  } catch (error) {
    return null;
  }
}

