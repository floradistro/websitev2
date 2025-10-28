'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppAuth } from '@/context/AppAuthContext';
import { POSPickupQueue } from '@/components/component-registry/pos/POSPickupQueue';
import { POSVendorDropdown } from '@/components/component-registry/pos/POSVendorDropdown';
import { POSRegisterSelector } from '@/components/component-registry/pos/POSRegisterSelector';

// Charlotte Central as default for now
const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

export default function POSOrdersPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated, vendor } = useAppAuth();
  const [mounted, setMounted] = useState(false);
  const [registerId, setRegisterId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check if register is assigned
    const savedRegisterId = localStorage.getItem('pos_register_id');
    if (savedRegisterId) {
      setRegisterId(savedRegisterId);
    }
  }, []);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60 text-xs uppercase tracking-[0.15em]">Loading...</div>
      </div>
    );
  }

  // Use Charlotte Central as default for now
  const currentLocationId = searchParams.get('location') || CHARLOTTE_CENTRAL_ID;
  const currentLocation = {
    id: currentLocationId,
    name: 'Charlotte Central'
  };

  // Show register selector if not assigned
  if (!registerId) {
    return (
      <POSRegisterSelector
        locationId={CHARLOTTE_CENTRAL_ID}
        locationName="Charlotte Central"
        onRegisterSelected={(id) => {
          setRegisterId(id);
        }}
      />
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top Bar with Vendor Dropdown */}
      <div className="border-b border-white/5 flex-shrink-0 p-4">
        <POSVendorDropdown
          locationId={currentLocation.id}
          locationName={currentLocation.name}
          userName="Staff Member"
          vendorId={vendor?.id}
          registerId={registerId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <POSPickupQueue
            locationId={currentLocation.id}
            locationName={currentLocation.name}
            autoRefresh={true}
            refreshInterval={30}
            enableSound={true}
          />
        </div>
      </div>
    </div>
  );
}

