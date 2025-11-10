import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";

export default function PricingPage() {
  const tiers = [
    {
      name: "Starter",
      price: 299,
      yearlyPrice: 2988,
      description: "Perfect for single-location hemp shops",
      features: [
        "1 Warehouse + 1 Retail Location",
        "500 Products",
        "Advanced POS System",
        "eCommerce Storefront",
        "TV Menu Displays",
        "Inventory Management",
        "Basic Analytics",
        "5,000 AI Tokens/month",
        "Email Support",
      ],
      notIncluded: ["Multi-location sync", "Wholesale portal", "Custom apps", "API access"],
      cta: "Start Free Trial",
      highlighted: false,
    },
    {
      name: "Pro",
      price: 599,
      yearlyPrice: 5988,
      description: "For growing multi-location businesses",
      features: [
        "1 Warehouse + 4 Retail Locations",
        "Unlimited Products",
        "Advanced POS + Integrations",
        "Custom White-Label Storefront",
        "TV Menu Displays (All Locations)",
        "Real-Time Multi-Location Sync",
        "Advanced Analytics & Reporting",
        "50,000 AI Tokens/month",
        "Wholesale B2B Portal",
        "Loyalty Program",
        "Marketing Tools",
        "API Access",
        "Phone + Email Support",
      ],
      notIncluded: [],
      cta: "Start Free Trial",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      price: 1499,
      yearlyPrice: 14988,
      description: "For regional chains & distributors",
      features: [
        "Unlimited Locations",
        "Unlimited Products",
        "Enterprise POS Features",
        "Full White-Label Platform",
        "TV Menu Displays (Unlimited)",
        "Custom Analytics & BI",
        "Unlimited AI Tokens",
        "Multi-Vendor Marketplace",
        "Custom Integrations",
        "Dedicated Account Manager",
        "24/7 Priority Support",
        "Custom Development",
        "Onboarding Assistance",
      ],
      notIncluded: [],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/whale.png"
              alt="WhaleTools"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-sm uppercase tracking-[0.15em] font-black">WhaleTools</span>
          </Link>
          <Link
            href="/vendor/login"
            className="text-xs uppercase tracking-[0.12em] text-white/60 hover:text-white transition-colors font-black"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight uppercase"
            style={{ fontWeight: 900 }}
          >
            Simple Pricing.
            <br />
            <span className="text-white/40">Huge Savings.</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-8 max-w-2xl mx-auto">
            Stop paying $3,600/month for multiple tools.
            <br />
            One platform. One price. Everything included.
          </p>
          <p className="text-sm text-white/40 uppercase tracking-wider">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-[#0a0a0a] border rounded-3xl p-8 transition-all duration-300 ${
                  tier.highlighted
                    ? "border-white/30 bg-gradient-to-b from-white/[0.03] to-transparent scale-105 shadow-2xl shadow-white/10"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white text-black text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                      {tier.badge}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className="text-2xl font-black mb-2 uppercase tracking-tight"
                    style={{ fontWeight: 900 }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-sm text-white/60">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black">${tier.price}</span>
                    <span className="text-white/40">/month</span>
                  </div>
                  <p className="text-xs text-white/40">or ${tier.yearlyPrice}/year (save 17%)</p>
                </div>

                <Link
                  href={tier.cta === "Contact Sales" ? "/contact" : "/vendor/login"}
                  className={`block w-full text-center py-4 rounded-xl text-sm uppercase tracking-[0.1em] font-black transition-all mb-8 ${
                    tier.highlighted
                      ? "bg-white text-black hover:scale-[1.02] hover:shadow-lg"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  {tier.cta}
                </Link>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-white/40 font-black mb-4">
                    Everything in {tier.name}:
                  </p>
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                  {tier.notIncluded.length > 0 && (
                    <>
                      <div className="border-t border-white/5 my-4 pt-4">
                        <p className="text-xs uppercase tracking-wider text-white/30 font-black mb-3">
                          Not included:
                        </p>
                      </div>
                      {tier.notIncluded.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <X size={16} className="text-white/20 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-white/40">{feature}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight"
              style={{ fontWeight: 900 }}
            >
              The Math Is Simple
            </h2>
            <p className="text-lg text-white/60">
              See how much you'll save by switching to WhaleTools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Stack */}
            <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-black mb-2 text-red-400 uppercase">
                  Your Current Stack
                </h3>
                <p className="text-sm text-white/60">Typical multi-location setup</p>
              </div>
              <div className="space-y-4 mb-6">
                {[
                  { name: "Cova POS", cost: 1200 },
                  { name: "Alpine IQ", cost: 1800 },
                  { name: "Shopify", cost: 600 },
                  { name: "Dutchie", cost: 500 },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center py-2 border-b border-white/5"
                  >
                    <span className="text-sm text-white/80">{item.name}</span>
                    <span className="text-sm font-bold text-white/60">${item.cost}/mo</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-red-500/20 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm uppercase tracking-wider text-white/40 font-black">
                    Total Monthly
                  </span>
                  <span className="text-3xl font-black text-red-400">$4,100</span>
                </div>
                <p className="text-xs text-white/30 text-right mt-1">$49,200/year</p>
              </div>
            </div>

            {/* WhaleTools */}
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent border-2 border-green-500/30 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-black mb-2 text-green-400 uppercase">WhaleTools Pro</h3>
                <p className="text-sm text-white/60">Everything you need</p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "Point of Sale",
                  "Marketing & Loyalty",
                  "eCommerce Store",
                  "Menu & Ordering",
                  "Inventory Management",
                  "Analytics & Reporting",
                  "TV Displays",
                  "AI Features",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check size={14} className="text-green-400" />
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-green-500/20 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm uppercase tracking-wider text-white/40 font-black">
                    Total Monthly
                  </span>
                  <span className="text-3xl font-black text-green-400">$599</span>
                </div>
                <p className="text-xs text-white/30 text-right mt-1">$7,188/year</p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider text-green-400 font-black mb-1">
                    You Save
                  </p>
                  <p className="text-4xl font-black text-green-400">$3,501/mo</p>
                  <p className="text-lg text-green-400/80 font-bold mt-1">$42,012/year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-black mb-12 text-center uppercase tracking-tight"
            style={{ fontWeight: 900 }}
          >
            Questions?
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Do you offer a free trial?",
                a: "Yes! 14 days free, no credit card required. Full access to Pro features.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. No contracts, no cancellation fees. Cancel with one click.",
              },
              {
                q: "What payment methods do you accept?",
                a: "All major credit cards via Stripe. Annual plans can be invoiced.",
              },
              {
                q: "Do you charge per transaction?",
                a: "No. Flat monthly fee. No surprises. No commission on your sales.",
              },
              {
                q: "Can I upgrade or downgrade?",
                a: "Yes, anytime. Changes take effect immediately. Pro-rated billing.",
              },
              {
                q: "Is there a setup fee?",
                a: "No setup fees. No hidden costs. Just your monthly subscription.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all"
              >
                <h3
                  className="text-lg font-black mb-2 text-white uppercase tracking-tight"
                  style={{ fontWeight: 900 }}
                >
                  {faq.q}
                </h3>
                <p className="text-white/60">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-black mb-8 uppercase tracking-tight"
            style={{ fontWeight: 900 }}
          >
            Ready to Save
            <br />
            <span className="text-green-400">$42,000/Year?</span>
          </h2>
          <Link
            href="/vendor/login"
            className="inline-flex items-center justify-center gap-3 bg-white text-black px-12 py-6 rounded-2xl text-base uppercase tracking-[0.1em] font-black transition-all hover:scale-[1.02] hover:shadow-[0_0_80px_rgba(255,255,255,0.3)]"
            style={{ fontWeight: 900 }}
          >
            Start Free Trial
            <ArrowRight size={20} />
          </Link>
          <p className="text-sm text-white/40 mt-6">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/whale.png"
              alt="WhaleTools"
              width={24}
              height={24}
              className="object-contain opacity-40"
            />
            <span className="text-xs uppercase tracking-[0.12em] text-white/30 font-black">
              © 2025 WhaleTools
            </span>
          </div>
          <div className="flex gap-6">
            {["Home", "Features", "API", "Privacy", "Terms"].map((link) => (
              <Link
                key={link}
                href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                className="text-xs uppercase tracking-[0.12em] text-white/40 hover:text-white transition-colors font-black"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
