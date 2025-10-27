import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WhaleTools POS',
  description: 'Point of Sale System',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WhaleTools POS',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServiceSupabase();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/vendor/login?redirect=/pos');
  }

  // Verify user has POS access
  const { data: userData, error } = await supabase
    .from('users')
    .select(`
      id,
      role,
      vendor_id,
      first_name,
      last_name,
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

  if (error || !userData) {
    redirect('/vendor/login?redirect=/pos');
  }

  // Check if user has POS permissions
  const allowedRoles = ['pos_staff', 'location_manager', 'vendor_manager', 'vendor_owner', 'admin'];
  if (!allowedRoles.includes(userData.role)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black uppercase mb-4">Access Denied</h1>
          <p className="text-white/60 mb-6">
            You don't have permission to access the POS system.
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

  // Check if user has at least one POS-enabled location
  const posLocations = userData.user_locations?.filter(
    (ul: any) => ul.can_sell && ul.locations?.pos_enabled
  );

  if (!posLocations || posLocations.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black uppercase mb-4">No POS Locations</h1>
          <p className="text-white/60 mb-6">
            You don't have access to any POS-enabled locations. Contact your manager.
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

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/pos-192.png" />
      </head>
      <body className="bg-black text-white antialiased overflow-x-hidden">
        {/* Minimal POS layout - no heavy animations */}
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

