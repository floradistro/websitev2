/**
 * Smart Component: SmartLocationMap
 * Auto-fetches and displays vendor locations - REWRITTEN FOR ZERO GLITCHING
 */

"use client";

import React, { useState, useEffect } from "react";

export interface SmartLocationMapProps {
  vendorId: string;
  selectedLocationIds?: string[];
  headline?: string;
  subheadline?: string;
  showMap?: boolean;
  showDirections?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function SmartLocationMap({
  vendorId,
  selectedLocationIds = [],
  headline,
  subheadline,
  showMap = false,
  showDirections = true,
  columns = 3,
  className = "",
}: SmartLocationMapProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Hydration fix - only render on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch locations after mount - Use JSON.stringify to prevent infinite loops
  useEffect(() => {
    if (!isClient) return;

    async function loadLocations() {
      try {
        let url = `/api/locations?vendor_id=${vendorId}`;
        if (selectedLocationIds.length > 0) {
          url += `&location_ids=${selectedLocationIds.join(",")}`;
        }

        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || []);
        }
      } catch (err) {
        // Silent fail
      }
    }

    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, vendorId, JSON.stringify(selectedLocationIds)]);

  // SSR: render nothing to avoid hydration mismatch
  if (!isClient) {
    return <div className={className} style={{ minHeight: "400px" }} />;
  }

  // No locations: show nothing
  if (locations.length === 0) {
    return <div className={className} />;
  }

  const colClass =
    columns === 2 ? "md:grid-cols-2" : columns === 4 ? "md:grid-cols-4" : "md:grid-cols-3";

  return (
    <div className={className}>
      {(headline || subheadline) && (
        <div className="text-center mb-12">
          {headline && <h2 className="text-3xl font-bold text-white mb-2">{headline}</h2>}
          {subheadline && <p className="text-lg text-neutral-400">{subheadline}</p>}
        </div>
      )}

      <div className={`grid grid-cols-1 ${colClass} gap-6`}>
        {locations.map((loc) => (
          <div key={loc.id} className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{loc.name}</h3>
                <p className="text-sm text-neutral-400">{loc.address_line1 || loc.address || ""}</p>
                {loc.city && loc.state && (
                  <p className="text-sm text-neutral-400">
                    {loc.city}, {loc.state} {loc.zip || loc.zip_code || ""}
                  </p>
                )}
              </div>
            </div>

            {loc.phone && (
              <div className="flex items-center gap-2 text-sm text-neutral-400 mt-3">
                <span>📞</span>
                <span>{loc.phone}</span>
              </div>
            )}

            {showDirections && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent((loc.address_line1 || loc.address || "") + ", " + (loc.city || "") + ", " + (loc.state || ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-black transition-all"
              >
                <span className="mr-2">🗺️</span>
                Get Directions
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
