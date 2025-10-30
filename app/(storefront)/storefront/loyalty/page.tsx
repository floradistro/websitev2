import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import StorefrontLoyaltyClient from '@/components/storefront/StorefrontLoyaltyClient';

export const dynamic = 'force-dynamic';

export default async function StorefrontLoyaltyPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen relative overflow-hidden py-16">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          {vendor.logo_url && (
            <div className="mb-6 flex justify-center">
              <div className="relative w-20 h-20 animate-fadeIn">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                <img
                  src={vendor.logo_url}
                  alt={vendor.store_name}
                  className="relative w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          )}

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Loyalty Rewards
          </h1>
          <p className="text-neutral-400 text-lg">
            Earn points with every purchase at {vendor.store_name}
          </p>
        </div>

        {/* Client Component */}
        <StorefrontLoyaltyClient vendor={vendor} />
      </div>
    </div>
  );
}
