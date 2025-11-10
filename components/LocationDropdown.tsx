"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

interface Location {
  id: string | number; // Support both UUID and number
  name: string;
  city?: string;
  state?: string;
  is_active: string | boolean | number; // Support multiple formats
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

  // Filter active locations (handle both "1" string and true boolean)
  const activeLocations = locations.filter(
    (loc) =>
      loc.is_active === "1" || loc.is_active === 1 || loc.is_active === true,
  );

  const selectedLocationData = activeLocations.find(
    (loc) => loc.id?.toString() === selectedLocation,
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
    <div className="relative z-[200]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-[200] inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 bg-transparent border border-white/20 hover:border-white/40 transition-all duration-300 text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.1em] group text-white rounded"
      >
        <MapPin
          size={12}
          strokeWidth={2}
          className="text-white/60 group-hover:text-white transition-colors sm:w-3.5 sm:h-3.5"
        />
        <span className="whitespace-nowrap max-w-[90px] sm:max-w-none truncate">
          {selectedLocationData
            ? `${selectedLocationData.name}`
            : "All Locations"}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`text-white/60 transition-transform duration-300 sm:w-3.5 sm:h-3.5 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#3a3a3a] shadow-2xl border border-white/20 z-[999] animate-fadeIn">
          <div className="p-1">
            <button
              onClick={() => {
                onLocationChange(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <MapPin
                  size={14}
                  strokeWidth={2}
                  className="text-white/40 group-hover:text-white/70 transition-colors"
                />
                <span className="text-[11px] font-normal uppercase tracking-[0.12em] text-white">
                  All Locations
                </span>
              </div>
              {!selectedLocation && (
                <Check size={14} strokeWidth={2} className="text-white" />
              )}
            </button>

            <div className="h-px bg-white/10 my-1"></div>

            {activeLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => {
                  onLocationChange(location.id.toString());
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors duration-200 text-left group"
              >
                <div className="flex items-center space-x-3">
                  <MapPin
                    size={14}
                    strokeWidth={2}
                    className="text-white/40 group-hover:text-white/70 transition-colors"
                  />
                  <div>
                    <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-white">
                      {location.name}
                    </p>
                    {(location.city || location.state) && (
                      <p className="text-[10px] text-white/50 font-normal tracking-wide mt-0.5">
                        {location.city}
                        {location.city && location.state && ", "}
                        {location.state}
                      </p>
                    )}
                  </div>
                </div>
                {selectedLocation === location.id.toString() && (
                  <Check size={14} strokeWidth={2} className="text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
