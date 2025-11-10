import { NextRequest, NextResponse } from "next/server";
import { geolocation } from "@vercel/edge";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    // Use Vercel's built-in geolocation from Edge headers (powered by Cloudflare)
    const geo = geolocation(request);

    // If Vercel geo is available, use it (more reliable)
    if (geo && geo.country) {
      return NextResponse.json({
        ip:
          request.headers.get("x-real-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0] ||
          "unknown",
        city: geo.city || "Charlotte",
        region: geo.region || "North Carolina",
        region_code: geo.region || "NC",
        country_code: geo.country || "US",
        postal: geo.city === "Charlotte" ? "28202" : "",
        latitude: geo.latitude ? parseFloat(geo.latitude) : 35.2271,
        longitude: geo.longitude ? parseFloat(geo.longitude) : -80.8431,
      });
    }

    // Default to Charlotte, NC (local business default)
    return NextResponse.json({
      ip:
        request.headers.get("x-real-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "unknown",
      city: "Charlotte",
      region: "North Carolina",
      region_code: "NC",
      country_code: "US",
      postal: "28202",
      latitude: 35.2271,
      longitude: -80.8431,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Geolocation error:", error);
    }
    // Return Charlotte default on any error
    return NextResponse.json({
      ip: "unknown",
      city: "Charlotte",
      region: "North Carolina",
      region_code: "NC",
      country_code: "US",
      postal: "28202",
      latitude: 35.2271,
      longitude: -80.8431,
    });
  }
}
