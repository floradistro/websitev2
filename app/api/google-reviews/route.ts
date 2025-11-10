import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Enable ISR caching - reviews don't change frequently
export const revalidate = 3600; // 1 hour cache
export const runtime = "nodejs";

// SECURITY: Load API key from environment variable
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// In-memory cache for reviews (persists during server lifetime)
const reviewsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Hardcoded Place IDs for each location
// These are extracted from Google Maps URLs
const PLACE_IDS: { [key: string]: string } = {
  Salisbury: "ChIJh0SShyEhVIgRvsoR2i8KtpA", // Pre-cached Place ID
  "Charlotte Monroe": "ChIJM3DSD1AbVIgR6mRjzTDD1ds",
  "Charlotte Central": "ChIJBRxqkgR_WogR_RbnqYXPpHI",
  "Blowing Rock": "ChIJu1ahOwD7UIgRFPpD5T3zWrE",
  Elizabethton: "", // Will search dynamically if needed
};

async function findPlaceId(query: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`,
    );
    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    }
    return null;
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error searching place:", err);
    }
    return null;
  }
}

async function getPlaceDetails(placeId: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      return {
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        reviews: data.result.reviews?.slice(0, 3) || [],
      };
    }

    if (process.env.NODE_ENV === "development") {
      logger.error("Place details error:", data.status, data.error_message);
    }
    return null;
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching place details:", err);
    }
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationName = searchParams.get("location");
  const address = searchParams.get("address");

  // SECURITY: Check API key is configured
  if (!GOOGLE_API_KEY) {
    logger.error("GOOGLE_MAPS_API_KEY not configured");
    return NextResponse.json(
      { error: "Google Reviews service not configured" },
      { status: 503 },
    );
  }

  if (!locationName || !address) {
    return NextResponse.json({ error: "Missing location or address" }, { status: 400 });
  }

  // Check in-memory cache first
  const cacheKey = `${locationName}-${address}`;
  const cached = reviewsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  try {
    // Check if we have a cached Place ID
    let placeId: string | null = PLACE_IDS[locationName];

    // If not, search for it
    if (!placeId) {
      // Try multiple search queries to find the right place
      const cleanAddress = address.replace(/\n/g, " ");
      const searchQueries = [`Yacht Club ${cleanAddress}`, cleanAddress];

      for (const query of searchQueries) {
        const foundId = await findPlaceId(query);
        if (foundId) {
          placeId = foundId;
          break;
        }
      }

      if (!placeId) {
        return NextResponse.json(
          {
            error: "Place not found",
            location: locationName,
            searchQueries: searchQueries,
          },
          { status: 404 },
        );
      }

      // Cache it
      PLACE_IDS[locationName] = placeId;
    }

    // Get place details
    const details = await getPlaceDetails(placeId);

    if (!details) {
      return NextResponse.json(
        {
          error: "Could not fetch details",
          location: locationName,
          placeId: placeId,
        },
        { status: 500 },
      );
    }

    // Cache the result
    reviewsCache.set(cacheKey, {
      data: details,
      timestamp: Date.now(),
    });

    return NextResponse.json(details);
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in Google Reviews API:", err);
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        message: err.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
