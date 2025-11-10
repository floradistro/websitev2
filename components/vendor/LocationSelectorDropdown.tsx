"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface LocationSelectorDropdownProps {
  vendorId: string;
  selectedLocationIds: string[];
  onChange: (locationIds: string[]) => void;
}

export function LocationSelectorDropdown({
  vendorId,
  selectedLocationIds,
  onChange,
}: LocationSelectorDropdownProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch(`/api/locations?vendor_id=${vendorId}`);
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || data || []);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load locations:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, [vendorId]);

  const selectedLocations = locations.filter((l) =>
    selectedLocationIds.includes(l.id),
  );

  const toggleLocation = (locationId: string) => {
    if (selectedLocationIds.includes(locationId)) {
      onChange(selectedLocationIds.filter((id) => id !== locationId));
    } else {
      onChange([...selectedLocationIds, locationId]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Locations */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLocations.map((location) => (
            <div
              key={location.id}
              className="flex items-center gap-1 bg-purple-600 text-white text-xs px-2 py-1 rounded"
            >
              <span>{location.name}</span>
              <button
                onClick={() => toggleLocation(location.id)}
                className="hover:bg-purple-700 rounded"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Location List */}
      <div className="max-h-48 overflow-y-auto border border-neutral-800 rounded bg-neutral-950">
        {loading ? (
          <div className="p-4 text-center text-neutral-500 text-xs">
            Loading...
          </div>
        ) : locations.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 text-xs">
            No locations found
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {locations.map((location) => (
              <label
                key={location.id}
                className="flex items-center gap-2 p-2 hover:bg-neutral-900 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedLocationIds.includes(location.id)}
                  onChange={() => toggleLocation(location.id)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {location.name}
                  </div>
                  {location.city && location.state && (
                    <div className="text-xs text-neutral-500">
                      {location.city}, {location.state}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        {selectedLocations.length === 0
          ? "Select locations or leave empty to show all"
          : `${selectedLocations.length} location(s) selected`}
      </p>
    </div>
  );
}
