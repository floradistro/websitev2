import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import Footer from '@/components/storefront/templates/default/Footer';

export default async function TermsPage() {
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
            <span className="text-white/60 font-medium">Terms of Service</span>
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
                  alt={vendor.store_name}
                  className="relative w-full h-full object-contain drop-shadow-xl opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className="w-16 h-16 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-white uppercase tracking-[-0.03em]">Terms of Service</h1>
              <p className="text-neutral-500 text-sm mt-2">Last updated: January 2025</p>
            </div>
          </div>

          <div className="space-y-8 text-neutral-300 font-light leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Agreement to Terms</h2>
              <p>By accessing and using Our Store, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Age Requirement</h2>
              <p>You must be at least 21 years of age to purchase products from Our Store. By making a purchase, you confirm that you are of legal age.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Product Information</h2>
              <p>We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Product descriptions are accurate, complete, or error-free</li>
                <li>Images precisely represent product color or appearance</li>
                <li>Products will always be available in stock</li>
                <li>Prices are free from errors</li>
              </ul>
              <p className="mt-4">We reserve the right to correct any errors and update information at any time.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Orders and Payment</h2>
              <h3 className="text-lg font-semibold text-white mb-3">Order Acceptance</h3>
              <p className="mb-4">All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Product unavailability</li>
                <li>Pricing or product information errors</li>
                <li>Suspected fraud or unauthorized transactions</li>
                <li>Shipping restrictions</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3 mt-6">Payment</h3>
              <p>Payment must be received before order fulfillment. We accept major credit cards and approved payment methods. You agree to provide current and accurate payment information.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Shipping and Delivery</h2>
              <p>Shipping times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or circumstances beyond our control.</p>
              <p className="mt-3">See our <Link href="/storefront/shipping" className="text-white hover:underline">Shipping Policy</Link> for detailed information.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Returns and Refunds</h2>
              <p>Unopened products may be returned within 30 days of delivery. Opened products cannot be returned due to health and safety regulations.</p>
              <p className="mt-3">See our <Link href="/storefront/returns" className="text-white hover:underline">Return Policy</Link> for complete details.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Prohibited Uses</h2>
              <p className="mb-4">You may not use our site:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>For any unlawful purpose or to violate any laws</li>
                <li>To transmit harmful or malicious code</li>
                <li>To impersonate others or provide false information</li>
                <li>To interfere with security features</li>
                <li>To collect user information without consent</li>
                <li>To resell products for commercial purposes without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
              <p>All content on this site, including text, graphics, logos, images, and software, is the property of Our Store or its licensors and is protected by copyright and trademark laws.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
              <p>To the fullest extent permitted by law, Our Store shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our products or services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Indemnification</h2>
              <p>You agree to indemnify and hold harmless Our Store from any claims, damages, or expenses arising from your violation of these Terms or misuse of our products.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of our services constitutes acceptance of the updated Terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Governing Law</h2>
              <p>These Terms are governed by the laws of the United States and the state where Our Store operates, without regard to conflict of law principles.</p>
            </section>

            <section className="border-t border-white/10 pt-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p>Questions about these Terms? Contact us:</p>
              <div className="mt-4 bg-white/5 border border-white/10 rounded-[20px] p-6">
                <p><strong>Our Store</strong></p>
                <p className="mt-2">Email: legalsupport@example.com</p>
                <p className="mt-1"><Link href="/storefront/contact" className="text-white hover:underline">Contact Form</Link></p>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer vendor={vendor} />
    </div>
  );
}

