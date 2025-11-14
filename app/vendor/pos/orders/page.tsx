"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/context/AppAuthContext";
import { usePOSSession } from "@/context/POSSessionContext";
import { POSPickupQueue } from "@/components/component-registry/pos/POSPickupQueue";
import { POSVendorDropdown } from "@/components/component-registry/pos/POSVendorDropdown";

export default function POSOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, vendor } = useAppAuth();
  const { session, registerId, location } = usePOSSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60 text-xs uppercase tracking-[0.15em]">Loading...</div>
      </div>
    );
  }

  // Show register selector if no session - stay in POS, don't redirect
  if (!session || !registerId || !location) {
    return (
      <div className="fixed inset-0 left-[60px] bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-light text-white mb-4">No Active Session</h2>
            <p className="text-white/60 text-sm mb-8">
              Start a session on the Register to access Orders.
            </p>
            <button
              onClick={() => router.push("/vendor/pos/register")}
              className="px-8 py-4 bg-white text-black rounded-xl hover:bg-white/90 transition-all text-sm font-black uppercase tracking-[0.15em]"
              style={{ fontWeight: 900 }}
            >
              Go to Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 left-[60px] bg-black text-white flex flex-col overflow-hidden">
      {/* Top Bar with Vendor Dropdown */}
      <div className="border-b border-white/5 flex-shrink-0 p-4">
        <POSVendorDropdown
          locationId={location.id}
          locationName={location.name}
          userName="Staff Member"
          vendorId={vendor?.id}
          registerId={registerId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <POSPickupQueue
            locationId={location.id}
            locationName={location.name}
            autoRefresh={true}
            refreshInterval={30}
            enableSound={true}
          />
        </div>
      </div>
    </div>
  );
}
