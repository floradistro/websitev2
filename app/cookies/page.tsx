'use client';

import { useEffect, useRef } from 'react';
import { Cookie, Settings, Eye, Lock } from 'lucide-react';

export default function Cookies() {
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
          <Cookie className="w-12 h-12 mx-auto mb-6 text-white/60 animate-fadeIn" />
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Cookie Policy
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            Last Updated: October 14, 2025
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="space-y-16">
          {/* What Are Cookies */}
          <section ref={(el) => (sectionsRef.current[0] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">What Are Cookies?</h2>
              <p className="text-base font-light leading-relaxed text-black/70 mb-4">
                Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) 
                when you visit a website. They are widely used to make websites work more efficiently and provide 
                information to website owners.
              </p>
              <p className="text-base font-light leading-relaxed text-black/70">
                Cookies help us understand how visitors use our website, remember your preferences, and improve 
                your overall experience.
              </p>
            </div>
          </section>

          {/* How We Use Cookies */}
          <section ref={(el) => (sectionsRef.current[1] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black text-white p-8 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <Eye className="w-8 h-8 mb-4 text-white/60" />
                <h3 className="text-lg uppercase tracking-wider mb-3 font-light">Understand Usage</h3>
                <p className="text-sm text-white/70 font-light">Track how visitors interact with our site</p>
              </div>
              <div className="bg-black text-white p-8 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <Settings className="w-8 h-8 mb-4 text-white/60" />
                <h3 className="text-lg uppercase tracking-wider mb-3 font-light">Remember Preferences</h3>
                <p className="text-sm text-white/70 font-light">Save your settings and choices</p>
              </div>
              <div className="bg-black text-white p-8 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <Lock className="w-8 h-8 mb-4 text-white/60" />
                <h3 className="text-lg uppercase tracking-wider mb-3 font-light">Ensure Security</h3>
                <p className="text-sm text-white/70 font-light">Protect your account and data</p>
              </div>
            </div>
          </section>

          {/* Types of Cookies */}
          <section ref={(el) => (sectionsRef.current[2] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Types of Cookies We Use</h2>
              <div className="space-y-8">
                {[
                  {
                    title: 'Essential Cookies',
                    description: 'These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.',
                    examples: 'Authentication cookies, shopping cart functionality, age verification',
                    canDisable: 'No - These are required for the website to work'
                  },
                  {
                    title: 'Performance Cookies',
                    description: 'These cookies collect information about how visitors use our website, such as which pages are visited most often and if users receive error messages.',
                    examples: 'Google Analytics, page load times, bounce rates',
                    canDisable: 'Yes - These can be opted out through browser settings'
                  },
                  {
                    title: 'Functionality Cookies',
                    description: 'These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, personalized features.',
                    examples: 'Language preferences, remember me functionality, video player settings',
                    canDisable: 'Yes - But may limit website functionality'
                  },
                  {
                    title: 'Targeting/Advertising Cookies',
                    description: 'These cookies are used to deliver advertisements that are relevant to you and your interests. They also limit the number of times you see an advertisement.',
                    examples: 'Facebook Pixel, Google Ads, retargeting campaigns',
                    canDisable: 'Yes - Through cookie consent tools or browser settings'
                  }
                ].map((cookie, index) => (
                  <div key={index} className="border-b border-black/10 last:border-0 pb-8 last:pb-0">
                    <h3 className="text-xl font-light uppercase tracking-wider mb-3">{index + 1}. {cookie.title}</h3>
                    <p className="text-sm font-light text-black/70 mb-3">{cookie.description}</p>
                    <p className="text-sm font-light text-black/60 mb-2">
                      <strong className="font-normal">Examples:</strong> {cookie.examples}
                    </p>
                    <p className="text-sm font-light text-black/60">
                      <strong className="font-normal">Can be disabled:</strong> {cookie.canDisable}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section ref={(el) => (sectionsRef.current[3] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Managing Your Cookie Preferences</h2>
              <p className="text-base font-light text-white/70 mb-6">
                You have the right to decide whether to accept or reject cookies. You can manage your cookie 
                preferences through several methods:
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-light uppercase tracking-wider mb-4">Browser Settings</h3>
                  <p className="text-sm font-light text-white/70 mb-4">
                    Most web browsers allow you to control cookies through their settings:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm font-light text-white/70">
                    {[
                      'Chrome: Settings → Privacy and Security → Cookies',
                      'Firefox: Settings → Privacy & Security → Cookies',
                      'Safari: Preferences → Privacy → Cookies',
                      'Edge: Settings → Cookies and site permissions'
                    ].map((browser, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                        <span>{browser}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-light uppercase tracking-wider mb-4">Mobile Devices</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm font-light text-white/70">
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                      <span>iOS: Settings → Privacy → Tracking</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                      <span>Android: Settings → Google → Ads</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Impact of Blocking */}
          <section ref={(el) => (sectionsRef.current[4] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Impact of Blocking Cookies</h2>
              <p className="text-base font-light text-black/70 mb-6">
                If you choose to block or delete cookies, please be aware that:
              </p>
              <div className="space-y-3 text-sm font-light">
                {[
                  'Some features of our website may not function properly',
                  'You may not be able to complete purchases',
                  'Your preferences and settings may not be saved',
                  'You may see less relevant advertisements',
                  'Your user experience may be diminished'
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0"></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section ref={(el) => (sectionsRef.current[5] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Third-Party Cookies</h2>
              <p className="text-base font-light text-black/70 mb-6">
                In addition to our own cookies, we may use third-party cookies from trusted partners:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Google Analytics', purpose: 'Website analytics and performance tracking' },
                  { name: 'Facebook/Meta', purpose: 'Social media integration and advertising' },
                  { name: 'Payment Processors', purpose: 'Secure payment processing' },
                  { name: 'Email Services', purpose: 'Marketing communications and newsletters' }
                ].map((service, index) => (
                  <div key={index} className="bg-black/5 border border-black/10 p-6">
                    <p className="font-light mb-2">{service.name}</p>
                    <p className="text-sm text-black/60 font-light">{service.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section ref={(el) => (sectionsRef.current[6] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14 text-center">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Questions About Cookies?</h2>
              <p className="text-base font-light text-white/70 mb-6">
                If you have questions about our use of cookies or this Cookie Policy
              </p>
              <a href="mailto:privacy@floradistro.com" className="inline-block bg-white text-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium mb-2">
                privacy@floradistro.com
              </a>
              <p className="text-sm font-light text-white/50 mt-4">Monday-Friday, 9am-6pm EST</p>
            </div>
          </section>

          {/* Quick Reference */}
          <section ref={(el) => (sectionsRef.current[7] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/20 backdrop-blur-sm border border-black/10 p-8 md:p-10">
              <h3 className="text-lg font-light uppercase tracking-wider mb-4">📋 Quick Reference</h3>
              <p className="text-sm font-light text-black/60 mb-4">
                For more information about how we handle your personal information, please see our:
              </p>
              <div className="space-y-2">
                <a href="/privacy" className="block text-sm font-light hover:opacity-60 transition-opacity">
                  → Privacy Policy
                </a>
                <a href="/terms" className="block text-sm font-light hover:opacity-60 transition-opacity">
                  → Terms of Service
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
