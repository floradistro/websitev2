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
        className="inline-flex items-center space-x-2 px-3 py-2 bg-transparent border border-white/20 hover:border-white/40 transition-all duration-300 text-[11px] font-normal uppercase tracking-[0.12em] group text-white"
      >
        <MapPin size={14} strokeWidth={2} className="text-white/60 group-hover:text-white transition-colors" />
        <span className="whitespace-nowrap">
          {selectedLocationData
            ? `${selectedLocationData.name}`
            : "All Locations"}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-white/60 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#3a3a3a] shadow-lg border border-white/20 z-50 animate-fadeIn">
          <div className="p-1">
            <button
              onClick={() => {
                onLocationChange(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <MapPin size={14} strokeWidth={2} className="text-white/40 group-hover:text-white/70 transition-colors" />
                <span className="text-[11px] font-normal uppercase tracking-[0.12em] text-white">All Locations</span>
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
                  <MapPin size={14} strokeWidth={2} className="text-white/40 group-hover:text-white/70 transition-colors" />
                  <div>
                    <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-white">{location.name}</p>
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

