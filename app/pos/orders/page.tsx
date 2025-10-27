import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/client';
import { POSPickupQueue } from '@/components/component-registry/pos/POSPickupQueue';

interface POSOrdersPageProps {
  searchParams: Promise<{
    location?: string;
  }>;
}

export default async function POSOrdersPage({ searchParams }: POSOrdersPageProps) {
  const params = await searchParams;
  const supabase = getServiceSupabase();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/vendor/login?redirect=/pos/orders');
  }

  // Get user's accessible locations
  const { data: userData } = await supabase
    .from('users')
    .select(`
      id,
      role,
      user_locations (
        location_id,
        can_sell,
        locations (
          id,
          name,
          slug,
          pos_enabled
        )
      )
    `)
    .eq('auth_user_id', user.id)
    .single();

  if (!userData || !userData.user_locations) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black uppercase mb-4">No Access</h1>
          <p className="text-white/60">You don't have access to any locations.</p>
        </div>
      </div>
    );
  }

  // Filter POS-enabled locations where user can sell
  const posLocations = userData.user_locations
    .filter((ul: any) => ul.can_sell && ul.locations?.pos_enabled)
    .map((ul: any) => ul.locations);

  if (posLocations.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black uppercase mb-4">No POS Locations</h1>
          <p className="text-white/60 mb-6">
            You don't have access to any POS-enabled locations.
          </p>
          <a
            href="/vendor/dashboard"
            className="inline-block px-6 py-3 bg-white text-black font-black uppercase rounded-2xl hover:bg-white/90"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Use specified location or default to first available
  const currentLocationId = params.location || posLocations[0].id;
  const currentLocation = posLocations.find((loc: any) => loc.id === currentLocationId) || posLocations[0];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                WhaleTools POS
              </h1>
              <p className="text-white/40 text-sm mt-1">Pickup Order Queue</p>
            </div>

            {/* Location Selector */}
            {posLocations.length > 1 && (
              <select
                className="bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-2 font-bold focus:outline-none focus:border-white/20"
                value={currentLocationId}
                onChange={(e) => {
                  window.location.href = `/pos/orders?location=${e.target.value}`;
                }}
              >
                {posLocations.map((loc: any) => (
                  <option key={loc.id} value={loc.id} className="bg-black">
                    {loc.name}
                  </option>
                ))}
              </select>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
              <a
                href="/pos/register"
                className="px-4 py-2 border border-white/20 text-white rounded-2xl hover:bg-white/5 text-sm font-bold uppercase"
              >
                Register
              </a>
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
          locationId={currentLocation.id}
          locationName={currentLocation.name}
          autoRefresh={true}
          refreshInterval={30}
          enableSound={true}
        />
      </main>
    </div>
  );
}

