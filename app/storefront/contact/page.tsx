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
    <div className="bg-[#2a2a2a] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 uppercase tracking-wider">Contact Us</h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-purple-500/60 to-transparent mx-auto mb-6"></div>
          <p className="text-white/60 text-lg font-light">
            Have a question? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-[#1a1a1a]/60 backdrop-blur-sm border border-white/10 rounded-lg p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-light text-white/80 mb-2 uppercase tracking-wider">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded text-white focus:ring-1 focus:ring-white/20 focus:border-white/20 outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-light text-white/80 mb-2 uppercase tracking-wider">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded text-white focus:ring-1 focus:ring-white/20 focus:border-white/20 outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-light text-white/80 mb-2 uppercase tracking-wider">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded text-white focus:ring-1 focus:ring-white/20 focus:border-white/20 outline-none"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-light text-white/80 mb-2 uppercase tracking-wider">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={6}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded text-white focus:ring-1 focus:ring-white/20 focus:border-white/20 outline-none resize-none"
                placeholder="Tell us more..."
              />
            </div>

            <button type="submit" className="w-full bg-white text-black px-6 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/90 transition-all font-medium flex items-center justify-center gap-2">
              <MessageSquare size={18} />
              Send Message
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/40 mb-2 text-sm uppercase tracking-wider font-light">or email us directly at</p>
          <a 
            href={`mailto:contact@${vendor.store_name.toLowerCase().replace(' ', '')}.com`}
            className="inline-flex items-center gap-2 text-lg font-light text-white hover:text-white/80 transition-colors"
          >
            <Mail size={20} />
            Contact {vendor.store_name}
          </a>
        </div>
      </div>
    </div>
  );
}

