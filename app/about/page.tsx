import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Code, Globe, Zap, Shield } from "lucide-react";

export default function AboutPage() {
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
            About WhaleTools
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <p className="text-xl text-white/50 font-light leading-relaxed max-w-2xl mx-auto">
            Enterprise-grade multi-tenant commerce platform built for scale, speed, and reliability.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="border border-white/10 p-12">
            <h2 className="text-3xl font-light mb-6 tracking-tight">Our Mission</h2>
            <p className="text-white/60 text-lg leading-relaxed mb-6">
              WhaleTools exists to democratize enterprise commerce infrastructure. We believe that powerful, scalable e-commerce tools shouldn't be exclusive to Fortune 500 companies.
            </p>
            <p className="text-white/60 text-lg leading-relaxed">
              Our platform empowers partners to build, deploy, and scale unlimited storefronts with the same infrastructure powering the world's largest online retailers.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light mb-12 text-center tracking-tight">Core Values</h2>
          <div className="grid md:grid-cols-2 gap-px bg-white/5">
            <div className="bg-black p-10 border border-white/10">
              <Code className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Developer First</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Built with modern technologies and best practices. Clean APIs, comprehensive documentation, and developer-friendly tools.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <Zap className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Performance Obsessed</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Every millisecond matters. Edge caching, optimized queries, and smart code splitting ensure lightning-fast experiences.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <Shield className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Security by Default</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Bank-level encryption, complete tenant isolation, and rigorous security audits. Your data is sacred.
              </p>
            </div>
            <div className="bg-black p-10 border border-white/10">
              <Globe className="text-white/40 mb-4" size={32} strokeWidth={1} />
              <h3 className="text-xl font-light mb-3">Built to Scale</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                From one storefront to ten thousand. Our infrastructure scales seamlessly with your business growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light mb-12 text-center tracking-tight">Technology Stack</h2>
          <div className="border border-white/10 p-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-white/40 uppercase tracking-wider mb-2">Frontend</h3>
                <p className="text-white/70">Next.js 14, React 18, TypeScript, Tailwind CSS</p>
              </div>
              <div className="h-[1px] bg-white/5"></div>
              <div>
                <h3 className="text-sm text-white/40 uppercase tracking-wider mb-2">Backend</h3>
                <p className="text-white/70">Node.js, Supabase (PostgreSQL), Edge Functions</p>
              </div>
              <div className="h-[1px] bg-white/5"></div>
              <div>
                <h3 className="text-sm text-white/40 uppercase tracking-wider mb-2">Infrastructure</h3>
                <p className="text-white/70">Vercel Edge Network, Cloudflare CDN, Redis Caching</p>
              </div>
              <div className="h-[1px] bg-white/5"></div>
              <div>
                <h3 className="text-sm text-white/40 uppercase tracking-wider mb-2">Security</h3>
                <p className="text-white/70">SSL/TLS Encryption, Row Level Security, OAuth 2.0</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-8 tracking-tight">Ready to Get Started?</h2>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/vendor/login"
              className="bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all"
            >
              Become a Partner
            </Link>
            <Link
              href="/api-status"
              className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/10 font-medium transition-all"
            >
              View API Status
            </Link>
          </div>
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
