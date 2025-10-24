import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default async function PrivacyPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
          <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
            <Link href="/storefront" className="text-white/40 hover:text-white transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-medium">Privacy Policy</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-black rounded-[32px] border border-white/10 p-8 md:p-12">
          {/* Animated Logo Header */}
          {vendor.logo_url && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-20 h-20 animate-fadeIn">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                <img 
                  src={vendor.logo_url} 
                  alt=Our Store
                  className="relative w-full h-full object-contain drop-shadow-xl opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className="w-16 h-16 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-white uppercase tracking-[-0.03em]">Privacy Policy</h1>
              <p className="text-neutral-500 text-sm mt-2">Last updated: January 2025</p>
            </div>
          </div>

          <div className="space-y-8 text-neutral-300 font-light leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Privacy Matters</h2>
              <p>We take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
              <p className="mb-4">When you place an order, we collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name and contact information (email, phone, address)</li>
                <li>Payment information (processed securely through our payment provider)</li>
                <li>Order history and preferences</li>
                <li>Account credentials (if you create an account)</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3 mt-6">Automatic Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Browser type and device information</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Provide customer support</li>
                <li>Improve our website and services</li>
                <li>Send promotional emails (with your consent)</li>
                <li>Prevent fraud and enhance security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Payment processors, shipping carriers, and analytics providers</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p>We implement industry-standard security measures to protect your information, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>SSL encryption for all transactions</li>
                <li>Secure servers and firewalls</li>
                <li>Regular security audits</li>
                <li>Strict access controls</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Restrict processing of your information</li>
              </ul>
              <p className="mt-4">To exercise these rights, contact us at privacysupport@example.com</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
              <p>We use cookies to enhance your experience, analyze site traffic, and personalize content. You can control cookies through your browser settings. See our <Link href="/storefront/cookies" className="text-white hover:underline">Cookie Policy</Link> for more details.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p>Our services are not intended for individuals under 21 years of age. We do not knowingly collect information from minors.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. Changes will be posted on this page with an updated revision date.</p>
            </section>

            <section className="border-t border-white/10 pt-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p>If you have questions about this Privacy Policy, contact us at:</p>
              <div className="mt-4 bg-white/5 border border-white/10 rounded-[20px] p-6">
                <p><strong>Our Store</strong></p>
                <p className="mt-2">Email: privacysupport@example.com</p>
                <p className="mt-1"><Link href="/storefront/contact" className="text-white hover:underline">Contact Form</Link></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

