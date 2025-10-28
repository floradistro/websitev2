/**
 * Vendor Selector Component
 * Dropdown for selecting vendor and viewing vendor information
 */

import { ChevronDown } from 'lucide-react';
import { Vendor } from '@/lib/storefront-builder/types';

interface VendorSelectorProps {
  vendors: Vendor[];
  selectedVendor: string;
  onVendorChange: (vendorId: string) => void;
}

export function VendorSelector({ vendors, selectedVendor, onVendorChange }: VendorSelectorProps) {
  const currentVendor = vendors.find(v => v.id === selectedVendor);

  return (
    <div className="relative">
      <select
        value={selectedVendor}
        onChange={(e) => onVendorChange(e.target.value)}
        className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-black uppercase tracking-tight appearance-none pr-8 cursor-pointer hover:border-white/20 transition-colors"
        style={{ fontWeight: 900 }}
      >
        {vendors.map(vendor => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.store_name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
        strokeWidth={2}
      />
      {currentVendor?.logo_url && (
        <div className="absolute left-0 top-full mt-2 bg-[#0a0a0a] border border-white/5 rounded-lg p-2 z-10 pointer-events-none">
          <img
            src={currentVendor.logo_url}
            alt={currentVendor.store_name}
            className="h-8 w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
