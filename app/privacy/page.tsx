'use client';

import { useEffect, useRef } from 'react';
import { Shield, Eye, Lock, FileText } from 'lucide-react';

export default function Privacy() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#b5b5b2]">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-[#b5b5b2]/20"></div>
        <div className="relative z-10 text-center px-6">
          <Shield className="w-12 h-12 mx-auto mb-6 text-white/60 animate-fadeIn" />
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Privacy Policy
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            Last Updated: October 14, 2025
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="space-y-16">
          {/* Introduction */}
          <section ref={(el) => { sectionsRef.current[0] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Introduction</h2>
              <p className="text-base font-light leading-relaxed text-black/70 mb-4">
                Flora Distro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our website 
                and purchase our products.
              </p>
              <p className="text-base font-light leading-relaxed text-black/70">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
                please do not access the site or use our services.
              </p>
            </div>
          </section>

          {/* Key Points */}
          <section ref={(el) => { sectionsRef.current[1] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black text-white p-8 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <Eye className="w-8 h-8 mb-4 text-white/60" />
                <h3 className="text-lg uppercase tracking-wider mb-3 font-light">Transparency</h3>
                <p className="text-sm text-white/70 font-light">We're clear about what data we collect and how we use it</p>
              </div>
              <div className="bg-black text-white p-8 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <Lock className="w-8 h-8 mb-4 text-white/60" />
                <h3 className="text-lg uppercase tracking-wider mb-3 font-light">Security</h3>
                <p className="text-sm text-white/70 font-light">Your data is protected with industry-standard encryption</p>
              </div>
              <div className="bg-black text-white p-8 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <FileText className="w-8 h-8 mb-4 text-white/60" />
                <h3 className="text-lg uppercase tracking-wider mb-3 font-light">Your Rights</h3>
                <p className="text-sm text-white/70 font-light">You control your personal information</p>
              </div>
            </div>
          </section>

          {/* Information We Collect */}
          <section ref={(el) => { sectionsRef.current[2] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Information We Collect</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-light uppercase tracking-wider mb-4">Personal Information</h3>
                  <p className="text-sm font-light text-black/70 mb-4">We collect information that you provide directly to us, including:</p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm font-light">
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Name, email address, phone number</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Billing and shipping addresses</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Payment information</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Order history</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Age verification information</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Communications with us</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-light uppercase tracking-wider mb-4">Automatically Collected Information</h3>
                  <p className="text-sm font-light text-black/70 mb-4">When you visit our website, we automatically collect:</p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm font-light">
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>IP address and location data</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Browser type and version</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Device information</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Pages visited and time spent</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Referring website addresses</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                      <span>Cookies and tracking technologies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section ref={(el) => { sectionsRef.current[3] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">How We Use Your Information</h2>
              <p className="text-base font-light text-white/70 mb-6">We use the information we collect to:</p>
              <div className="grid md:grid-cols-2 gap-4 text-sm font-light text-white/70">
                {[
                  'Process and fulfill your orders',
                  'Communicate about orders and services',
                  'Verify age and comply with legal requirements',
                  'Improve our website and customer experience',
                  'Send marketing communications (with consent)',
                  'Prevent fraud and ensure security',
                  'Comply with legal obligations',
                  'Analyze website usage and trends'
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Your Privacy Rights */}
          <section ref={(el) => { sectionsRef.current[4] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Your Privacy Rights</h2>
              <p className="text-base font-light text-black/70 mb-6">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <div className="space-y-6">
                {[
                  { title: 'Access', desc: 'Request access to your personal information' },
                  { title: 'Correction', desc: 'Request correction of inaccurate information' },
                  { title: 'Deletion', desc: 'Request deletion of your personal information' },
                  { title: 'Portability', desc: 'Request transfer of your information' },
                  { title: 'Opt-Out', desc: 'Opt-out of marketing communications' },
                  { title: 'Object', desc: 'Object to processing of your information' }
                ].map((right, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="w-2 h-2 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <div>
                      <p className="font-light text-base mb-1">{right.title}</p>
                      <p className="text-sm text-black/60 font-light">{right.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm font-light text-black/60 mt-8">
                To exercise these rights, please contact us at <strong className="font-normal">privacy@floradistro.com</strong>
              </p>
            </div>
          </section>

          {/* California Privacy Rights */}
          <section ref={(el) => { sectionsRef.current[5] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">California Privacy Rights (CCPA)</h2>
              <p className="text-base font-light text-white/70 mb-6">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act
              </p>
              <div className="bg-white/10 border border-white/20 p-8">
                <p className="text-sm font-light text-white/90 mb-6">
                  <strong className="font-normal">Note:</strong> We do not sell your personal information to third parties.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section ref={(el) => { sectionsRef.current[6] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 text-center shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Contact Us</h2>
              <p className="text-base font-light text-black/70 mb-6">
                If you have questions or concerns about this privacy policy or our data practices
              </p>
              <a href="mailto:privacy@floradistro.com" className="inline-block bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-black/80 transition-all font-medium mb-2">
                privacy@floradistro.com
              </a>
              <p className="text-sm font-light text-black/60 mt-4">Monday-Friday, 9am-6pm EST</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
