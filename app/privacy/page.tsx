import { Shield, Store } from 'lucide-react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Flora Distro",
  description: "Flora Distro privacy policy. Learn how we collect, use, and protect your personal information across our marketplace.",
};

export default function Privacy() {
  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Privacy Policy
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-sm text-white/40 uppercase tracking-wider">
            Last Updated: October 19, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Introduction</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              Flora Distro operates a marketplace connecting vendors with customers. We're committed to protecting your privacy across every transaction.
            </p>
            <p className="text-xs text-white/40 font-light">
              By using our site, you agree to this privacy policy. This applies to both customers and vendors on our platform.
            </p>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Information We Collect</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p><strong className="text-white/70">For Customers:</strong></p>
              <p>• Name, email, phone, billing and shipping addresses</p>
              <p>• Payment information (processed securely by payment providers)</p>
              <p>• Order history and preferences</p>
              <p>• Age verification data</p>
              <p>• IP address, browser info, device data</p>
              <p>• Website usage and analytics</p>
              
              <p className="pt-4"><strong className="text-white/70">For Vendors:</strong></p>
              <p>• Business information, licenses, and tax details</p>
              <p>• Product listings, inventory, and pricing data</p>
              <p>• Sales and payout information</p>
              <p>• Communication with customers and support</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">How We Use Your Data</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>• Process and fulfill orders across the marketplace</p>
              <p>• Facilitate transactions between customers and vendors</p>
              <p>• Communicate about orders, products, and services</p>
              <p>• Verify age, business licenses, and comply with laws</p>
              <p>• Improve our marketplace platform and user experience</p>
              <p>• Prevent fraud and ensure security</p>
              <p>• Support vendor operations and analytics</p>
              <p>• Send marketing (with your consent)</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-white/60" />
              <h2 className="text-lg uppercase tracking-[0.2em] text-white font-normal">Vendor Data Sharing</h2>
            </div>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>When you purchase from a vendor on our marketplace:</p>
              <p>• Vendors receive necessary order information (name, shipping address, product details) to fulfill your order</p>
              <p>• Your payment information is never shared with vendors—we handle all transactions</p>
              <p>• Vendors must comply with our privacy standards and cannot use your data for purposes outside of order fulfillment</p>
              <p>• We monitor vendor compliance with privacy requirements</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Data Security</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>• Industry-standard encryption for all sensitive data</p>
              <p>• Secure payment processing through certified providers</p>
              <p>• Regular security audits and vulnerability assessments</p>
              <p>• Vendor data is kept separate and secure</p>
              <p>• Limited access to personal information</p>
              <p>• Secure data transmission across our marketplace</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Your Rights</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>• Request access to your data</p>
              <p>• Request correction of inaccurate data</p>
              <p>• Request deletion of your data</p>
              <p>• Opt-out of marketing communications</p>
              <p>• Object to data processing</p>
              <p>• Export your data in a portable format</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Data Retention</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              We retain your information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              Vendor data is retained for the duration of their partnership and as required by law for tax and business records.
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Third-Party Services</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              We use trusted third-party services for payment processing, shipping, analytics, and communication. These providers are bound by their own privacy policies and our data protection agreements.
            </p>
            <p className="text-xs text-white/40 font-light">
              We never sell your personal information to third parties.
            </p>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Updates to This Policy</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              We may update this privacy policy periodically. Significant changes will be communicated via email or prominent notice on our site.
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8 text-center">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Questions?</h2>
            <p className="text-sm text-white/50 mb-6">Contact us about privacy:</p>
            <a href="mailto:privacy@floradistro.com" className="text-sm text-white underline hover:no-underline">
              privacy@floradistro.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
