"use client";

import {
  Store,
  MapPin,
  Truck,
  Package,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

interface FulfillmentInfoProps {
  product: any;
  inventory: any[];
  locations: any[];
  onLocationSelect?: (locationId: number) => void;
  compact?: boolean;
}

export default function FulfillmentInfo({
  product,
  inventory = [],
  locations = [],
  onLocationSelect,
  compact = false,
}: FulfillmentInfoProps) {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  const fulfillmentType = product.fulfillment_type || "retail";
  const vendor = product.vendor;

  // Get retail locations with stock
  const retailLocationsWithStock = inventory
    .filter((inv) => {
      const qty = parseFloat(inv.stock || inv.quantity || 0);
      const loc = locations.find((l) => l.id === inv.location_id);
      return qty > 0 && loc && (loc.type === "retail" || !loc.vendor_id);
    })
    .map((inv) => {
      const loc = locations.find((l) => l.id === inv.location_id);
      return {
        ...loc,
        stock: parseFloat(inv.stock || inv.quantity || 0),
      };
    });

  // Get vendor locations with stock
  const vendorLocationsWithStock = inventory
    .filter((inv) => {
      const qty = parseFloat(inv.stock || inv.quantity || 0);
      const loc = locations.find((l) => l.id === inv.location_id);
      return qty > 0 && loc && (loc.type === "vendor" || loc.vendor_id);
    })
    .map((inv) => {
      const loc = locations.find((l) => l.id === inv.location_id);
      return {
        ...loc,
        stock: parseFloat(inv.stock || inv.quantity || 0),
      };
    });

  const handleLocationChange = (locationId: number) => {
    setSelectedLocation(locationId);
    if (onLocationSelect) {
      onLocationSelect(locationId);
    }
  };

  // === SCENARIO 1: Vendor-Only Fulfillment ===
  if (fulfillmentType === "vendor" && vendor) {
    return (
      <div className="bg-white/5 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <Store size={18} className="text-white/60 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-white/80 text-sm font-medium mb-1">
              Sold by {vendor.name}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{vendor.region}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Truck size={12} />
                <span>Ships in 1-3 business days</span>
              </div>
            </div>
            {product.total_stock > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-500">
                <CheckCircle size={12} />
                <span>{product.total_stock.toFixed(1)}g available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === SCENARIO 2: Retail-Only (Your Stores) ===
  if (fulfillmentType === "retail" && retailLocationsWithStock.length > 0) {
    if (compact) {
      return (
        <div className="text-xs text-white/60">
          Available at {retailLocationsWithStock.length}{" "}
          {retailLocationsWithStock.length === 1 ? "location" : "locations"}
        </div>
      );
    }

    return (
      <div className="bg-white/5 border border-white/10 p-4">
        <div className="text-white/80 text-sm font-medium mb-3">
          📍 Select Pickup Location
        </div>
        <select
          value={selectedLocation || ""}
          onChange={(e) => handleLocationChange(parseInt(e.target.value))}
          className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-white/20"
        >
          <option value="">Choose location...</option>
          {retailLocationsWithStock.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} - {loc.stock.toFixed(1)}g in stock
            </option>
          ))}
        </select>
        <div className="mt-2 text-xs text-white/60">
          Free same-day pickup • Ships next-day
        </div>
      </div>
    );
  }

  // === SCENARIO 3: Hybrid (Vendor Product + Stocked at Retail) ===
  if (fulfillmentType === "hybrid" && vendor) {
    return (
      <div className="space-y-3">
        {/* Retail Options */}
        {retailLocationsWithStock.length > 0 && (
          <div className="bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-green-500" />
              <div className="text-white/80 text-sm font-medium">
                Available at Our Locations
              </div>
              <span className="ml-auto text-xs text-green-500 font-medium">
                FASTEST
              </span>
            </div>
            <select
              value={selectedLocation || ""}
              onChange={(e) => handleLocationChange(parseInt(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-white/20"
            >
              <option value="">Select location...</option>
              {retailLocationsWithStock.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} - {loc.stock.toFixed(1)}g
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-white/60">
              ✓ Free same-day pickup • Ships next-day
            </div>
          </div>
        )}

        {/* Vendor Option */}
        {vendorLocationsWithStock.length > 0 && (
          <div className="bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Store size={16} className="text-blue-500" />
              <div className="text-white/80 text-sm font-medium">
                Or ships from {vendor.name}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <MapPin size={12} />
              <span>{vendor.region}</span>
              <span>•</span>
              <Clock size={12} />
              <span>Ships in 2-3 days</span>
              <span>•</span>
              <span>
                {vendorLocationsWithStock[0].stock.toFixed(1)}g available
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === FALLBACK: No stock anywhere ===
  return (
    <div className="bg-red-500/10 border border-red-500/20 p-4">
      <div className="text-red-500 text-sm font-medium mb-1">Out of Stock</div>
      <div className="text-red-500/80 text-xs">
        Check back soon for availability
      </div>
    </div>
  );
}
