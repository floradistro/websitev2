import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Store, BarChart3, Palette, DollarSign, Users, CheckCircle } from "lucide-react";

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={32} 
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-light tracking-tight">WhaleTools</span>
            </Link>
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
            Partner Program
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <p className="text-xl text-white/50 font-light leading-relaxed max-w-2xl mx-auto">
            Build your brand with enterprise infrastructure. Launch unlimited storefronts with complete control.
          </p>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light mb-12 text-center tracking-tight">What Partners Get</h2>
          <div className="grid md:grid-cols-3 gap-px bg-white/5">
            <div className="bg-black p-10 border border-white/10">
              <Store className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Unlimited Storefronts</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Create and manage unlimited branded storefronts. Each with custom domains, themes, and complete independence.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <Palette className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Visual Builder</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Drag-and-drop interface with pre-built components. No coding required, but full code access if you want it.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <BarChart3 className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Advanced Analytics</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Real-time performance metrics, conversion tracking, and comprehensive insights for every storefront.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <DollarSign className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Revenue Tracking</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Detailed profit margins, commission calculations, and automated financial reporting.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <Users className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">White Label Ready</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Complete brand control. Your logo, your colors, your identity. We're invisible to your customers.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <CheckCircle className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Priority Support</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Direct access to our engineering team. 24/7 support, dedicated account manager, and priority bug fixes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light mb-12 text-center tracking-tight">Partner Pricing</h2>
          <div className="border border-white/10 p-12">
            <div className="space-y-8">
              <div className="text-center">
                <div className="text-5xl font-light mb-4">$99<span className="text-2xl text-white/40">/month</span></div>
                <p className="text-white/50">Platform access + unlimited storefronts</p>
              </div>
              <div className="h-[1px] bg-white/10"></div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-white/40 mt-1" size={20} />
                  <div>
                    <h4 className="text-white/90 font-light mb-1">Unlimited Storefronts</h4>
                    <p className="text-white/40 text-sm">No limits on the number of stores you can create</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-white/40 mt-1" size={20} />
                  <div>
                    <h4 className="text-white/90 font-light mb-1">Custom Domains</h4>
                    <p className="text-white/40 text-sm">Connect unlimited custom domains with auto SSL</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-white/40 mt-1" size={20} />
                  <div>
                    <h4 className="text-white/90 font-light mb-1">Full API Access</h4>
                    <p className="text-white/40 text-sm">Complete REST API with webhook support</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-white/40 mt-1" size={20} />
                  <div>
                    <h4 className="text-white/90 font-light mb-1">99.9% Uptime SLA</h4>
                    <p className="text-white/40 text-sm">Enterprise-grade reliability guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-8 tracking-tight">Ready to Partner?</h2>
          <p className="text-white/50 mb-12 text-lg">Join hundreds of partners building successful commerce businesses on WhaleTools.</p>
          <Link
            href="/vendor/login"
            className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all"
          >
            Start Free Trial
          </Link>
          <p className="text-white/40 text-sm mt-6">14-day free trial · No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={24} 
                height={24}
                className="object-contain opacity-60"
              />
              <span className="text-sm text-white/40">© 2025 WhaleTools. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/about" className="text-sm text-white/40 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/partners" className="text-sm text-white/40 hover:text-white transition-colors">
                Partners
              </Link>
              <Link href="/api-status" className="text-sm text-white/40 hover:text-white transition-colors">
                API
              </Link>
              <Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

