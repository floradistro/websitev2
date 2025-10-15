"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

interface Location {
  id: number;
  name: string;
  city?: string;
  state?: string;
  is_active: string;
}

interface LocationDropdownProps {
  locations: Location[];
  selectedLocation: string | null;
  onLocationChange: (locationId: string | null) => void;
}

export default function LocationDropdown({
  locations,
  selectedLocation,
  onLocationChange,
}: LocationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLocations = locations.filter((loc) => loc.is_active === "1");
  const selectedLocationData = activeLocations.find(
    (loc) => loc.id.toString() === selectedLocation
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border-0 hover:bg-white transition-all duration-200 text-sm font-light shadow-sm hover:shadow-md group"
      >
        <MapPin size={16} className="text-black/60 group-hover:text-black transition-colors" />
        <span className="whitespace-nowrap">
          {selectedLocationData
            ? `${selectedLocationData.name}${selectedLocationData.city ? `, ${selectedLocationData.city}` : ""}`
            : "All Locations"}
        </span>
        <ChevronDown
          size={16}
          className={`text-black/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white shadow-elevated-lg border-0 z-50 animate-fadeIn">
          <div className="p-2">
            <button
              onClick={() => {
                onLocationChange(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-black/40 group-hover:text-black/60 transition-colors" />
                <span className="text-sm font-light">All Locations</span>
              </div>
              {!selectedLocation && (
                <Check size={16} className="text-black" />
              )}
            </button>

            <div className="h-[1px] bg-black/5 my-2"></div>

            {activeLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => {
                  onLocationChange(location.id.toString());
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors duration-200 text-left group"
              >
                <div className="flex items-center space-x-3">
                  <MapPin size={16} className="text-black/40 group-hover:text-black/60 transition-colors" />
                  <div>
                    <p className="text-sm font-light">{location.name}</p>
                    {(location.city || location.state) && (
                      <p className="text-xs text-black/50 font-light">
                        {location.city}
                        {location.city && location.state && ", "}
                        {location.state}
                      </p>
                    )}
                  </div>
                </div>
                {selectedLocation === location.id.toString() && (
                  <Check size={16} className="text-black" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

