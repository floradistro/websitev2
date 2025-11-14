import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { HomeNavigation } from "@/components/HomeNavigation";
import { HeroContent } from "@/components/HomePage/HeroContent";
import {
  AnimatedSection,
  AnimatedGrid,
  AnimatedGridItem,
} from "@/components/HomePage/AnimatedSection";

export default function HomePage() {
  return (
    <div className="bg-black text-white overflow-y-auto overflow-x-hidden h-dvh">
      {/* Navigation */}
      <HomeNavigation />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative">
        <HeroContent />
      </section>

      {/* The Problem - Jobs style: Show the pain */}
      <AnimatedSection
        id="features"
        className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent"
      >
        <div className="max-w-5xl mx-auto text-center mb-16 sm:mb-20">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight uppercase"
            style={{ fontWeight: 900 }}
          >
            <span className="text-white/40">Your current stack</span>
            <br />
            <span className="text-white">is costing you a fortune</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            Most hemp businesses juggle 5-8 different tools.
            <br />
            Different logins. Different bills. Different headaches.
          </p>
        </div>

        {/* Competitor Stack Visualization */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 sm:p-12 hover:border-white/10 transition-all duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {[
                { name: "Cova POS", cost: "$1,200/mo", for: "Point of Sale" },
                { name: "Shopify", cost: "$600/mo", for: "Online Store" },
                { name: "Dutchie", cost: "$500/mo", for: "Menus & Ordering" },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between py-4 px-6 bg-black/40 border border-white/5 rounded-xl"
                >
                  <div>
                    <div className="text-sm font-black text-white/90 mb-1">{tool.name}</div>
                    <div className="text-xs text-white/40">{tool.for}</div>
                  </div>
                  <div className="text-lg font-black text-white/60">{tool.cost}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-6 flex items-center justify-between">
              <div className="text-sm uppercase tracking-wider text-white/40 font-black">
                Total Monthly Cost
              </div>
              <div className="text-3xl font-black text-red-400">$4,100/mo</div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs uppercase tracking-wider text-white/30">
                That's $49,200 per year
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* The Solution - Jobs style: Show the magic */}
      <AnimatedSection className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center mb-16 sm:mb-20">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight uppercase"
            style={{ fontWeight: 900 }}
          >
            <span className="text-white">One Platform</span>
            <br />
            <span className="text-white/40">Replaces Everything</span>
          </h2>
        </div>

        {/* WhaleTools Stack - Beautifully Simple */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-white/[0.03] to-transparent border-2 border-white/20 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-12">
                <Image
                  src="/whale.png"
                  alt="WhaleTools"
                  width={60}
                  height={60}
                  className="object-contain"
                />
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">WhaleTools</div>
                  <div className="text-sm text-white/50">All-In-One Platform</div>
                </div>
              </div>

              <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {[
                  "Point of Sale System",
                  "eCommerce Storefront",
                  "Inventory Management",
                  "Multi-Location Sync",
                  "TV Menu Displays",
                  "Analytics & Reporting",
                  "Customer Loyalty",
                  "Product Catalog",
                  "Order Management",
                  "Wholesale B2B Portal",
                  "Lab Results (COAs)",
                  "AI Product Descriptions",
                ].map((feature) => (
                  <AnimatedGridItem
                    key={feature}
                    className="flex items-center gap-3 py-3 px-4 bg-black/20 border border-white/10 rounded-xl hover:border-white/20 transition-all"
                  >
                    <Check size={16} className="text-green-400 flex-shrink-0" />
                    <span className="text-sm text-white/90">{feature}</span>
                  </AnimatedGridItem>
                ))}
              </AnimatedGrid>

              <div className="border-t border-white/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <div className="text-sm uppercase tracking-wider text-white/60 font-black mb-2">
                    Starting at
                  </div>
                  <div className="text-5xl sm:text-6xl font-black text-white">
                    $299<span className="text-2xl text-white/40">/mo</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm uppercase tracking-wider text-green-400 font-black mb-2">
                    You Save
                  </div>
                  <div className="text-3xl font-black text-green-400">$3,801/mo</div>
                  <div className="text-xs text-white/40 mt-1">$45,612 per year</div>
                </div>
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/vendor/login"
                  className="inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl text-sm uppercase tracking-[0.1em] font-black transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
                  style={{ fontWeight: 900 }}
                >
                  Start Free Trial
                  <ArrowRight size={18} />
                </Link>
                <p className="text-xs text-white/40 mt-4 uppercase tracking-wider">
                  14-day free trial • No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Core Features - Simple, Powerful */}
      <AnimatedSection className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase"
              style={{ fontWeight: 900 }}
            >
              Everything You Need
            </h2>
            <p className="text-lg sm:text-xl text-white/60">
              Built for hemp businesses. Not hacked together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Point of Sale",
                desc: "Lightning-fast POS. Accept payments. Print receipts. Sync inventory in real-time across all locations.",
                icon: "💳",
              },
              {
                title: "eCommerce",
                desc: "Beautiful online store. Mobile-optimized. Cart. Checkout. Order tracking. Everything your customers expect.",
                icon: "🛒",
              },
              {
                title: "Inventory Management",
                desc: "Track stock across multiple locations. Automated reorder alerts. Never run out. Never overstock.",
                icon: "📦",
              },
              {
                title: "Analytics",
                desc: "Real-time sales data. Revenue trends. Best sellers. Profit margins. Make decisions with confidence.",
                icon: "📊",
              },
              {
                title: "TV Menus",
                desc: "Digital signage for your store. Auto-updating prices. Beautiful displays. Impress every customer.",
                icon: "📺",
              },
              {
                title: "AI Features",
                desc: "Generate product descriptions in seconds. Optimize pricing. Save 10+ hours per week.",
                icon: "✨",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/10 hover:bg-white/[0.01] transition-all duration-300 group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3
                  className="text-xl font-black text-white mb-3 uppercase tracking-tight"
                  style={{ fontWeight: 900 }}
                >
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Built for Cannabis - Jobs style pride */}
      <AnimatedSection className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-12 sm:p-16 lg:p-20 hover:border-white/10 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-8">
                <Image
                  src="/yacht-club-logo.png"
                  alt="Yacht Club"
                  width={80}
                  height={80}
                  className="object-contain mx-auto opacity-60"
                />
              </div>
              <h3
                className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 uppercase tracking-tight"
                style={{ fontWeight: 900 }}
              >
                Built for Hemp
              </h3>
              <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                Not a generic eCommerce platform with plugins.
                <br />
                <br />
                Every feature designed specifically for hemp businesses.
                <br />
                Compliance. Lab results. Strain data. Age verification.
                <br />
                <br />
                <span className="text-white">We speak your language.</span>
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Final CTA - Simple, Direct */}
      <AnimatedSection className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 uppercase tracking-tight leading-tight"
            style={{ fontWeight: 900 }}
          >
            Stop Overpaying.
            <br />
            <span className="text-white/40">Start Today.</span>
          </h2>

          <p className="text-xl sm:text-2xl text-white/60 mb-12 max-w-2xl mx-auto">
            14-day free trial. No credit card required.
            <br />
            <span className="text-white/40">See why businesses are switching to WhaleTools.</span>
          </p>

          <Link
            href="/vendor/login"
            className="inline-flex items-center justify-center gap-3 bg-white text-black px-12 py-6 rounded-2xl text-base uppercase tracking-[0.1em] font-black transition-all hover:scale-[1.02] hover:shadow-[0_0_80px_rgba(255,255,255,0.3)]"
            style={{ fontWeight: 900 }}
          >
            Start Free Trial
            <ArrowRight size={20} />
          </Link>

          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-white/40">
            <span>✓ No setup fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Free support</span>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer - Minimal */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <Image
                src="/whale.png"
                alt="WhaleTools"
                width={24}
                height={24}
                className="object-contain opacity-40"
              />
              <span
                className="text-xs uppercase tracking-[0.12em] text-white/30 font-black"
                style={{ fontWeight: 900 }}
              >
                © 2025 WhaleTools
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { name: "Pricing", href: "/pricing" },
                { name: "Features", href: "/#features" },
                { name: "API", href: "/api" },
                { name: "Privacy", href: "/privacy" },
                { name: "Terms", href: "/terms" },
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs uppercase tracking-[0.12em] text-white/40 hover:text-white transition-colors font-black"
                  style={{ fontWeight: 900 }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
