"use client";

import { MapPin, Check, Store, Home, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Location {
  id: string;
  name: string;
  address?: string;
  is_primary: boolean;
}

interface POSLocationSelectorProps {
  locations: Location[];
  onLocationSelected: (locationId: string, locationName: string) => void;
}

export function POSLocationSelector({ locations, onLocationSelected }: POSLocationSelectorProps) {
  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white/40 text-sm uppercase tracking-[0.15em] mb-4">
            No locations available
          </p>
          <p className="text-white/60 text-xs">Contact your administrator to get location access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/vendor/apps"
              className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]"
            >
              <Home size={16} />
              <span>Dashboard</span>
            </Link>
            <ChevronRight size={16} className="text-white/20" />
            <span className="text-white/60 uppercase tracking-[0.15em]">POS</span>
            <ChevronRight size={16} className="text-white/20" />
            <span className="text-white uppercase tracking-[0.15em]">Select Location</span>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Select Location
          </h1>
          <p className="text-white/60 text-sm uppercase tracking-[0.15em] font-medium">
            Choose which location to access
          </p>
        </div>

        {/* Location Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => onLocationSelected(location.id, location.name)}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-left relative group"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-all">
                <Store size={24} className="text-white/60" />
              </div>

              {/* Info */}
              <div className="mb-4">
                <div className="text-white font-semibold text-lg tracking-tight mb-1 flex items-center gap-2">
                  {location.name}
                  {location.is_primary && (
                    <span className="text-[9px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md uppercase tracking-wider font-medium">
                      Primary
                    </span>
                  )}
                </div>
                {location.address && (
                  <div className="text-white/60 text-xs mt-2 flex items-start gap-1.5">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{location.address}</span>
                  </div>
                )}
              </div>

              {/* Select Indicator */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Check size={16} strokeWidth={3} />
              </div>
            </button>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-white/40 text-xs uppercase tracking-[0.15em]">
          <p>Select a location to view registers</p>
        </div>
      </div>
    </div>
  );
}
