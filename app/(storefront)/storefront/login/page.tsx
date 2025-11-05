import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StorefrontLoginClient from '@/components/storefront/StorefrontLoginClient';

export const dynamic = 'force-dynamic';

export default async function StorefrontLoginPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-16">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 md:p-10">
          {/* Logo */}
          {vendor.logo_url && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-24 h-24 animate-fadeIn">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.store_name}
                  className="relative w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">
            Welcome back
          </h1>
          <p className="text-neutral-400 text-center mb-8">
            Sign in to your {vendor.store_name} account
          </p>

          <StorefrontLoginClient vendor={vendor} />
        </div>
      </div>
    </div>
  );
}

