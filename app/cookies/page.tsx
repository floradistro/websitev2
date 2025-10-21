import { Cookie, Eye, Settings, Lock } from 'lucide-react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Yacht Club",
  description: "Learn about how Yacht Club uses cookies and similar technologies to improve your browsing experience and site functionality.",
};

export default function Cookies() {
  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Cookie Policy
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-sm text-white/40 uppercase tracking-wider">
            Last Updated: October 19, 2025
          </p>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#3a3a3a] border border-white/10 p-8 mb-12">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">What Are Cookies?</h2>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-4">
              Cookies are small text files placed on your device when you visit a website. They help websites work efficiently and provide information to site owners.
            </p>
            <p className="text-xs text-white/40 font-light">
              On our marketplace, cookies help us provide a seamless shopping experience across multiple vendors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px mb-12">
            <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5">
              <Eye className="w-8 h-8 mb-4 text-white/60" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Understand Usage</h3>
              <p className="text-xs text-white/50 font-light">Track how visitors use our site</p>
            </div>
            <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5">
              <Settings className="w-8 h-8 mb-4 text-white/60" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Save Preferences</h3>
              <p className="text-xs text-white/50 font-light">Remember your settings</p>
            </div>
            <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5">
              <Lock className="w-8 h-8 mb-4 text-white/60" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Ensure Security</h3>
              <p className="text-xs text-white/50 font-light">Protect your account</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8 mb-12">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Types of Cookies</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-white mb-2 uppercase tracking-wider">Essential</h3>
                <p className="text-xs text-white/50 font-light">Required for the marketplace to function. Includes shopping cart, checkout, and vendor session management. Cannot be disabled.</p>
              </div>
              <div>
                <h3 className="text-sm text-white mb-2 uppercase tracking-wider">Performance</h3>
                <p className="text-xs text-white/50 font-light">Analytics and site improvement. Helps us understand marketplace usage patterns. Can be opted out.</p>
              </div>
              <div>
                <h3 className="text-sm text-white mb-2 uppercase tracking-wider">Functionality</h3>
                <p className="text-xs text-white/50 font-light">Remember your preferences, recently viewed products, and vendor filters. Can be disabled but limits features.</p>
              </div>
              <div>
                <h3 className="text-sm text-white mb-2 uppercase tracking-wider">Advertising</h3>
                <p className="text-xs text-white/50 font-light">Show relevant products and ads from our marketplace vendors. Can be opted out.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 p-8 text-center">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Manage Cookies</h2>
            <p className="text-sm text-white/50 mb-6">Control cookies through your browser settings:</p>
            <div className="space-y-2 text-xs text-white/40 font-light">
              <p>Chrome: Settings → Privacy → Cookies</p>
              <p>Firefox: Settings → Privacy → Cookies</p>
              <p>Safari: Preferences → Privacy → Cookies</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] border border-white/10 p-8 text-center">
            <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-4 font-normal">Questions?</h2>
            <a href="mailto:privacy@floradistro.com" className="text-sm text-white underline hover:no-underline">
              privacy@floradistro.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
