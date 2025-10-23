import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">About {vendor.store_name}</h1>
        {vendor.store_tagline && (
          <p className="text-xl text-gray-600">{vendor.store_tagline}</p>
        )}
      </div>

      {/* Story */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Our Story</h2>
        <p className="text-gray-700 text-lg leading-relaxed">
          {vendor.store_description || `Welcome to ${vendor.store_name}. We are dedicated to providing the highest quality cannabis products to our customers.`}
        </p>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Business Hours */}
        {vendor.business_hours && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-gray-700" size={24} />
              <h3 className="text-xl font-bold">Business Hours</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(vendor.business_hours).map(([day, hours]) => (
                <div key={day} className="flex justify-between">
                  <span className="capitalize text-gray-600">{day}:</span>
                  <span className="font-medium">{String(hours)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="text-gray-700" size={24} />
            <h3 className="text-xl font-bold">Contact Us</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-600" />
              <a href={`mailto:${vendor.id}@contact.com`} className="text-gray-700 hover:text-gray-900">
                Contact Email
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Policies */}
      <div className="space-y-8">
        {vendor.shipping_policy && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Shipping Policy</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>{vendor.shipping_policy}</p>
            </div>
          </div>
        )}

        {vendor.return_policy && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Return Policy</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>{vendor.return_policy}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

