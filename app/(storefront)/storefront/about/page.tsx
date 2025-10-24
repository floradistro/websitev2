import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import { Clock } from 'lucide-react';

export default async function StorefrontAboutPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="bg-[#2a2a2a] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-light text-white mb-4 uppercase tracking-wider">
            About {vendor.store_name}
          </h1>
          {vendor.store_tagline && (
            <p className="text-xl text-white/60 font-light">{vendor.store_tagline}</p>
          )}
        </div>

        {/* Story */}
        <div className="mb-16 bg-[#1a1a1a]/60 backdrop-blur-sm border border-white/10 p-12 rounded-lg">
          <h2 className="text-3xl font-light text-white mb-6 uppercase tracking-wider">Our Story</h2>
          <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent mb-8"></div>
          <p className="text-white/70 text-lg font-light leading-relaxed">
            {vendor.store_description || `Welcome to ${vendor.store_name}. We are dedicated to providing the highest quality cannabis products to our customers.`}
          </p>
        </div>

        {/* Business Hours */}
        {vendor.business_hours && (
          <div className="bg-[#1a1a1a]/60 backdrop-blur-sm border border-white/10 p-8 rounded-lg mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-purple-400" size={24} />
              <h3 className="text-xl font-light text-white uppercase tracking-wider">Business Hours</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(vendor.business_hours).map(([day, hours]) => (
                <div key={day} className="flex justify-between text-white/60 font-light">
                  <span className="capitalize">{day}:</span>
                  <span>{String(hours)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Policies */}
        <div className="space-y-8">
          {vendor.shipping_policy && (
            <div className="bg-[#1a1a1a]/60 backdrop-blur-sm border border-white/10 p-8 rounded-lg">
              <h2 className="text-2xl font-light text-white mb-4 uppercase tracking-wider">Shipping Policy</h2>
              <div className="h-[1px] w-12 bg-gradient-to-r from-purple-500/60 to-transparent mb-6"></div>
              <p className="text-white/70 font-light">{vendor.shipping_policy}</p>
            </div>
          )}

          {vendor.return_policy && (
            <div className="bg-[#1a1a1a]/60 backdrop-blur-sm border border-white/10 p-8 rounded-lg">
              <h2 className="text-2xl font-light text-white mb-4 uppercase tracking-wider">Return Policy</h2>
              <div className="h-[1px] w-12 bg-gradient-to-r from-purple-500/60 to-transparent mb-6"></div>
              <p className="text-white/70 font-light">{vendor.return_policy}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

