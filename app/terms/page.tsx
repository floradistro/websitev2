import { Scale, AlertTriangle, Store } from 'lucide-react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Flora Distro",
  description: "Flora Distro marketplace terms of service. Eligibility requirements, vendor responsibilities, health disclaimers, and legal information.",
};

export default function Terms() {
  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full pt-20"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Terms of Service
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
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Agreement</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              By accessing and using Flora Distro's marketplace, you agree to these Terms of Service. These terms govern your use as a customer and, if applicable, as a vendor on our platform.
            </p>
            <p className="text-xs text-white/40 font-light">
              If you don't agree, don't use our site or purchase products.
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Store className="w-6 h-6 text-white/60" />
              <h2 className="text-lg uppercase tracking-[0.2em] text-white font-normal">Marketplace Platform</h2>
            </div>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>Flora Distro operates as a marketplace connecting customers with vendors:</p>
              <p>• We facilitate transactions between buyers and sellers</p>
              <p>• Some products are sold directly by Flora Distro, others by vendor partners</p>
              <p>• We coordinate fulfillment and customer service across the marketplace</p>
              <p>• All vendors must meet our quality and compliance standards</p>
              <p>• We reserve the right to remove any vendor or product from the platform</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-white/60" />
              <h2 className="text-lg uppercase tracking-[0.2em] text-white font-normal">Health & Legal Disclaimers</h2>
            </div>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>• Products not FDA approved. Not intended to treat, cure, or prevent any disease.</p>
              <p>• THCa converts to THC when heated. May cause intoxication.</p>
              <p>• Don't drive or operate machinery after use.</p>
              <p>• May cause you to fail a drug test.</p>
              <p>• 21+ only. Keep away from children and pets.</p>
              <p>• These disclaimers apply to all products on our marketplace, regardless of vendor.</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Eligibility</h2>
            <div className="space-y-3 text-sm text-white/50 font-light">
              <p>• Must be 21+ years old</p>
              <p>• Must have legal capacity to enter contracts</p>
              <p>• Must comply with all federal, state, and local laws</p>
              <p>• THCa products must be legal in your state</p>
              <p>• All information you provide must be accurate</p>
              <p>• You're responsible for ensuring product legality in your jurisdiction</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Orders & Pricing</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>All orders subject to acceptance. We reserve the right to refuse or cancel any order.</p>
              <p>Prices in USD and subject to change. Vendors set their own pricing. We reserve the right to correct pricing errors.</p>
              <p>Payment due at time of order. All transactions processed through Flora Distro.</p>
              <p>When ordering from multiple vendors, you agree that shipments may arrive separately.</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Vendor Responsibilities</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>Vendors on our marketplace agree to:</p>
              <p>• Provide accurate product descriptions and comply with all regulations</p>
              <p>• Maintain required licenses and lab testing</p>
              <p>• Fulfill orders promptly and professionally</p>
              <p>• Follow our quality, safety, and sustainability standards</p>
              <p>• Handle customer data responsibly per our privacy policy</p>
              <p>• Coordinate with Flora Distro on returns and customer service</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Platform Use</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>You agree not to:</p>
              <p>• Use the platform for any illegal purpose</p>
              <p>• Attempt to circumvent marketplace transactions</p>
              <p>• Interfere with platform operations or security</p>
              <p>• Harvest or misuse data from the platform</p>
              <p>• Impersonate Flora Distro, vendors, or other users</p>
              <p>• Post false, misleading, or defamatory content</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Intellectual Property</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              Flora Distro's platform, branding, and content are protected by intellectual property laws. Vendors retain rights to their product content but grant us license to display and market products on the platform.
            </p>
            <p className="text-xs text-white/40 font-light">
              Unauthorized use of platform content, vendor content, or trademarks is prohibited.
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Limitation of Liability</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              To the maximum extent permitted by law, Flora Distro shall not be liable for any indirect, incidental, special, or consequential damages arising from use of our marketplace or products sold on the platform.
            </p>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              Our total liability shall not exceed the amount you paid for the products in question.
            </p>
            <p className="text-xs text-white/40 font-light">
              While we vet vendors carefully, we're not liable for vendor actions beyond our reasonable control.
            </p>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Dispute Resolution</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              Any disputes will be resolved through binding arbitration in accordance with commercial arbitration rules. You waive the right to participate in class actions.
            </p>
            <p className="text-xs text-white/40 font-light">
              Disputes involving vendor products will be handled through Flora Distro as the platform operator.
            </p>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Changes to Terms</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              We may update these terms periodically. Continued use of the platform after changes constitutes acceptance. We'll notify users of significant changes.
            </p>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8 text-center">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Questions?</h2>
            <a href="mailto:legal@floradistro.com" className="text-sm text-white underline hover:no-underline">
              legal@floradistro.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
