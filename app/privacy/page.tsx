import { Shield } from 'lucide-react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Flora Distro",
  description: "Flora Distro privacy policy. Learn how we collect, use, and protect your personal information when you shop with us.",
};

export default function Privacy() {
  return (
    <div className="bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Privacy Policy
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-sm text-white/40 uppercase tracking-wider">
            Last Updated: October 14, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Introduction</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              Flora Distro is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
            </p>
            <p className="text-xs text-white/40 font-light">
              By using our site, you agree to this privacy policy.
            </p>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Information We Collect</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>• Name, email, phone, billing and shipping addresses</p>
              <p>• Payment information (processed securely by payment providers)</p>
              <p>• Order history and preferences</p>
              <p>• Age verification data</p>
              <p>• IP address, browser info, device data</p>
              <p>• Website usage and analytics</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">How We Use Your Data</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>• Process and fulfill orders</p>
              <p>• Communicate about orders and services</p>
              <p>• Verify age and comply with laws</p>
              <p>• Improve our website and products</p>
              <p>• Send marketing (with your consent)</p>
              <p>• Prevent fraud and ensure security</p>
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
            </div>
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
