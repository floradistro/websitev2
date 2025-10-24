"use client";

import { useState, useEffect } from 'react';
import { MapPin, Check } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address_line1?: string;
  city?: string;
  state?: string;
  type?: string;
}

interface LocationPickerFieldProps {
  value: string[]; // Array of location IDs
  onChange: (value: string[]) => void;
  vendorId: string;
  filterType?: 'retail' | 'warehouse' | 'all';
  multiSelect?: boolean;
  label?: string;
}

export function LocationPickerField({
  value = [],
  onChange,
  vendorId,
  filterType = 'all',
  multiSelect = true,
  label = 'Select Locations'
}: LocationPickerFieldProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, [vendorId, filterType]);

  async function loadLocations() {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/locations?vendor_id=${vendorId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch locations:', response.status);
        setLoading(false);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Locations API returned non-JSON response');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success || Array.isArray(data)) {
        let locs = data.locations || data;
        
        // Filter by type
        if (filterType !== 'all') {
          locs = locs.filter((l: Location) => l.type === filterType);
        }
        
        setLocations(locs);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleLocation = (locationId: string) => {
    if (multiSelect) {
      if (value.includes(locationId)) {
        onChange(value.filter(id => id !== locationId));
      } else {
        onChange([...value, locationId]);
      }
    } else {
      onChange([locationId]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-white/80 text-sm mb-2">{label}</label>
      
      {loading ? (
        <div className="text-white/40 text-xs py-4 text-center">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="text-white/40 text-xs py-4 text-center">No locations found</div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto bg-black/50 border border-white/20 rounded p-2">
          {locations.map(location => {
            const isSelected = value.includes(location.id);
            return (
              <div
                key={location.id}
                onClick={() => toggleLocation(location.id)}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-purple-500/20 border border-purple-500/40'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                }`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
                
                <MapPin size={14} className="text-white/40 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm">{location.name}</div>
                  {location.city && location.state && (
                    <div className="text-white/40 text-xs">
                      {location.city}, {location.state}
                    </div>
                  )}
                </div>
                
                {location.type && (
                  <span className="text-white/40 text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                    {location.type}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {value.length > 0 && (
        <div className="text-white/40 text-xs mt-2">
          {value.length} location{value.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}

