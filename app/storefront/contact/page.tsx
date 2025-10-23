import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import { Mail, MessageSquare } from 'lucide-react';

export default async function StorefrontContactPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-600 text-lg">
          Have a question? We'd love to hear from you.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="How can we help?"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message *
            </label>
            <textarea
              id="message"
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              placeholder="Tell us more..."
            />
          </div>

          <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
            <MessageSquare size={20} />
            Send Message
          </button>
        </form>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-2">or email us directly at</p>
        <a 
          href={`mailto:${vendor.id}@contact.com`}
          className="inline-flex items-center gap-2 text-lg font-semibold hover:opacity-70"
        >
          <Mail size={20} />
          Contact {vendor.store_name}
        </a>
      </div>
    </div>
  );
}

