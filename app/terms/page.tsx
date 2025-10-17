import { Scale, AlertTriangle } from 'lucide-react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Flora Distro",
  description: "Flora Distro terms of service, eligibility requirements, health disclaimers, and legal information for purchasing cannabis products.",
};

export default function Terms() {
  return (
    <div className="bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Terms of Service
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
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Agreement</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              By accessing and using Flora Distro, you agree to these Terms of Service. If you don't agree, don't use our site or buy our products.
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8">
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
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Orders & Pricing</h2>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <p>All orders subject to acceptance. We reserve the right to refuse or cancel any order.</p>
              <p>Prices in USD and subject to change. We reserve the right to correct pricing errors.</p>
              <p>Payment due at time of order.</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Limitation of Liability</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              To the maximum extent permitted by law, Flora Distro shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount you paid for the products in question.
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
