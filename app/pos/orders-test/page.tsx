'use client';

import { POSPickupQueue } from '@/components/component-registry/pos/POSPickupQueue';

// Simple test page - no auth required
export default function POSOrdersTestPage() {
  // Charlotte Central location ID
  const charlotteCentralId = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                WhaleTools POS - TEST MODE
              </h1>
              <p className="text-white/40 text-sm mt-1">Pickup Order Queue (No Auth)</p>
            </div>

            <div className="flex gap-2">
              <a
                href="/vendor/dashboard"
                className="px-4 py-2 border border-white/20 text-white rounded-2xl hover:bg-white/5 text-sm font-bold uppercase"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <POSPickupQueue
          locationId={charlotteCentralId}
          locationName="Charlotte Central"
          autoRefresh={true}
          refreshInterval={30}
          enableSound={true}
        />
      </main>
    </div>
  );
}

