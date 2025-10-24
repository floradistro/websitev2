"use client";

import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface PricingTier {
  weight: string;
  price: number;
  label: string;
  min_quantity?: number;
}

interface PricingDisplayFieldProps {
  value: {
    show_retail?: boolean;
    show_wholesale?: boolean;
    format?: 'table' | 'dropdown' | 'badges';
  };
  onChange: (value: any) => void;
  vendorId: string;
  label?: string;
}

export function PricingDisplayField({
  value = { show_retail: true, show_wholesale: false, format: 'table' },
  onChange,
  vendorId,
  label = 'Pricing Display Options'
}: PricingDisplayFieldProps) {
  const [pricingData, setPricingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricingData();
  }, [vendorId]);

  async function loadPricingData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/pricing?vendor_id=${vendorId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch pricing:', response.status);
        setLoading(false);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setPricingData(data);
        }
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <label className="block text-white/80 text-sm mb-2">{label}</label>
      
      <div className="bg-black/50 border border-white/20 rounded p-3 space-y-3">
        {/* Display Format */}
        <div>
          <label className="block text-white/60 text-xs mb-1">Display Format</label>
          <select
            value={value.format || 'table'}
            onChange={(e) => onChange({ ...value, format: e.target.value })}
            className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="table">Table</option>
            <option value="dropdown">Dropdown</option>
            <option value="badges">Badges</option>
          </select>
        </div>

        {/* Show Options */}
        <div className="space-y-2">
          <label className="block text-white/60 text-xs mb-1">Show Pricing For:</label>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.show_retail !== false}
              onChange={(e) => onChange({ ...value, show_retail: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-white text-xs">Retail Prices</span>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.show_wholesale || false}
              onChange={(e) => onChange({ ...value, show_wholesale: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-white text-xs">Wholesale Prices</span>
          </div>
        </div>

        {/* Preview */}
        {!loading && pricingData && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-white/40 text-[10px] mb-2">Preview:</div>
            <div className="bg-black/50 rounded p-2">
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <DollarSign size={12} />
                <span>
                  {pricingData.tiers?.length || 0} pricing tiers available
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

