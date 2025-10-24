import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export default async function CookiesPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
      </div>

      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
          <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
            <Link href="/storefront" className="text-white/40 hover:text-white transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-medium">Cookie Policy</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 md:p-12">
          {/* Animated Logo Header */}
          {vendor.logo_url && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-20 h-20 animate-fadeIn">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.store_name}
                  className="relative w-full h-full object-contain drop-shadow-xl opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className="w-16 h-16 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center">
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-white uppercase tracking-[-0.03em]">Cookie Policy</h1>
              <p className="text-neutral-500 text-sm mt-2">Last updated: January 2025</p>
            </div>
          </div>

          <div className="space-y-8 text-neutral-300 font-light leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies?</h2>
              <p>Cookies are small text files stored on your device when you visit a website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Essential Cookies</h3>
                  <p className="text-sm mb-2">Required for the website to function properly.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Session management</li>
                    <li>Shopping cart functionality</li>
                    <li>Security and authentication</li>
                    <li>Load balancing</li>
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Performance Cookies</h3>
                  <p className="text-sm mb-2">Help us understand how visitors interact with our site.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Page visit analytics</li>
                    <li>User behavior tracking</li>
                    <li>Error reporting</li>
                    <li>Site performance metrics</li>
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Functional Cookies</h3>
                  <p className="text-sm mb-2">Remember your preferences and provide enhanced features.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Language preferences</li>
                    <li>Location settings</li>
                    <li>Recently viewed products</li>
                    <li>Saved preferences</li>
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Marketing Cookies</h3>
                  <p className="text-sm mb-2">Track your activity to deliver relevant advertisements.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Targeted advertising</li>
                    <li>Social media integration</li>
                    <li>Email campaign tracking</li>
                    <li>Conversion tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Cookies</h2>
              <p className="mb-4">We use services from trusted third parties that may set their own cookies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Analytics:</strong> Google Analytics (site usage and performance)</li>
                <li><strong>Payment Processing:</strong> Stripe (secure payment transactions)</li>
                <li><strong>Social Media:</strong> Facebook, Instagram (social sharing and advertising)</li>
                <li><strong>Customer Support:</strong> Live chat and support tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Managing Cookies</h2>
              <h3 className="text-lg font-semibold text-white mb-3">Browser Settings</h3>
              <p className="mb-4">You can control cookies through your browser settings:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Block all cookies</li>
                <li>Allow only first-party cookies</li>
                <li>Delete cookies when you close your browser</li>
                <li>View and delete specific cookies</li>
              </ul>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[20px] p-6 mt-6">
                <p className="text-sm"><strong className="text-white">Note:</strong> Blocking essential cookies may affect website functionality, including the ability to make purchases.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cookie Duration</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-white font-semibold mb-2">Session Cookies</h3>
                  <p className="text-sm">Temporary cookies deleted when you close your browser.</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Persistent Cookies</h3>
                  <p className="text-sm">Remain on your device for a set period or until you delete them. Typically expire after 30 days to 2 years.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Consent</h2>
              <p>By using our website, you consent to our use of cookies as described in this policy. You can withdraw consent at any time by adjusting your browser settings or contacting us.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Policy</h2>
              <p>We may update this Cookie Policy to reflect changes in technology or regulations. Please review this page periodically for updates.</p>
            </section>

            <section className="border-t border-white/10 pt-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Questions?</h2>
              <p>For questions about our use of cookies, contact us:</p>
              <div className="mt-4 bg-white/5 border border-white/10 rounded-[20px] p-6">
                <p><strong>{vendor.store_name}</strong></p>
                <p className="mt-2">Email: privacy@{vendor.slug}.com</p>
                <p className="mt-1"><Link href="/storefront/contact" className="text-white hover:underline">Contact Form</Link></p>
              </div>
              <p className="mt-4 text-sm">See also: <Link href="/storefront/privacy" className="text-white hover:underline">Privacy Policy</Link></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

