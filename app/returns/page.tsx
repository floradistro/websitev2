'use client';

import { useEffect, useRef } from 'react';
import { RotateCcw, Check, X, Clock } from 'lucide-react';

export default function Returns() {
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
        <div className="relative z-10 text-center px-4 md:px-6">
          <RotateCcw className="w-12 h-12 mx-auto mb-6 text-white/60 animate-fadeIn" />
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Returns & Refunds
          </h1>
          <p className="text-base md:text-lg font-light text-white/60 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            Your satisfaction is our priority
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-24 max-w-6xl">
        <div className="space-y-16">
          {/* 30-Day Return Window */}
          <section ref={(el) => (sectionsRef.current[0] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg text-center">
              <Clock className="w-16 h-16 mx-auto mb-6 text-black/60" />
              <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">30-Day Return Window</h2>
              <p className="text-lg md:text-xl font-light leading-relaxed text-black/70 max-w-3xl mx-auto">
                We accept returns of eligible products within 30 days of the delivery date. Items must meet our 
                return conditions to ensure safety and compliance.
              </p>
            </div>
          </section>

          {/* Return Conditions */}
          <section ref={(el) => (sectionsRef.current[1] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8 text-center">Return Conditions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black/5 backdrop-blur-sm border border-black/10 p-8 md:p-10">
                <div className="flex items-center space-x-3 mb-6">
                  <Check className="w-6 h-6 text-black flex-shrink-0" />
                  <h3 className="text-xl font-light uppercase tracking-wider">Eligible for Return</h3>
                </div>
                <ul className="space-y-4 text-sm font-light text-black/70">
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0"></div>
                    <span>Products that are unopened and unused</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0"></div>
                    <span>Products in original packaging with all seals intact</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0"></div>
                    <span>Defective or damaged products (opened or unopened)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0"></div>
                    <span>Products that were shipped in error</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0"></div>
                    <span>Products with packaging damage from shipping</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black text-white p-8 md:p-10">
                <div className="flex items-center space-x-3 mb-6">
                  <X className="w-6 h-6 text-white/60 flex-shrink-0" />
                  <h3 className="text-xl font-light uppercase tracking-wider">Not Eligible</h3>
                </div>
                <ul className="space-y-4 text-sm font-light text-white/70">
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                    <span>Opened or used products (unless defective)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                    <span>Products without original packaging</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                    <span>Products purchased more than 30 days ago</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                    <span>Products damaged due to misuse</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                    <span>Sale or clearance items marked as final sale</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How to Return */}
          <section ref={(el) => (sectionsRef.current[2] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">How to Initiate a Return</h2>
              <div className="grid md:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-light mb-4 mx-auto group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <h3 className="text-sm uppercase tracking-wider mb-2 font-light">Contact Us</h3>
                  <p className="text-xs text-black/60 font-light">Email support@floradistro.com with order details</p>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-light mb-4 mx-auto group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <h3 className="text-sm uppercase tracking-wider mb-2 font-light">Get RMA Number</h3>
                  <p className="text-xs text-black/60 font-light">Receive authorization within 1-2 business days</p>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-light mb-4 mx-auto group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <h3 className="text-sm uppercase tracking-wider mb-2 font-light">Package Item</h3>
                  <p className="text-xs text-black/60 font-light">Securely pack with RMA number marked</p>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-light mb-4 mx-auto group-hover:scale-110 transition-transform">
                    4
                  </div>
                  <h3 className="text-sm uppercase tracking-wider mb-2 font-light">Ship Back</h3>
                  <p className="text-xs text-black/60 font-light">Send to provided return address</p>
                </div>
              </div>
              <p className="text-xs text-center text-black/50 mt-8 font-light">
                * Returns without RMA number may be refused or delayed
              </p>
            </div>
          </section>

          {/* Refund Processing */}
          <section ref={(el) => (sectionsRef.current[3] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Refund Processing</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <p className="text-base font-light text-white/70 leading-relaxed mb-6">
                    Once we receive your return, we will inspect the item(s) and process your refund within 5-7 business days.
                  </p>
                  <ul className="space-y-3 text-sm font-light text-white/70">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                      <span>Refunds issued to original payment method</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                      <span>Original shipping charges are non-refundable</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                      <span>Allow 5-10 business days for refund to appear</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                      <span>Email confirmation sent once processed</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/10 border border-white/20 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl md:text-6xl font-light mb-2">5-7</p>
                    <p className="text-sm uppercase tracking-wider text-white/60">Business Days</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Defective Products */}
          <section ref={(el) => (sectionsRef.current[4] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Defective or Damaged Products</h2>
              <p className="text-base font-light text-black/70 leading-relaxed mb-6">
                If you receive a defective or damaged product, we will gladly provide a full refund or replacement 
                at no additional cost. Please contact us within 7 days of delivery with:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-black/60 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-light">Your order number</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-black/60 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-light">Photos of the damaged/defective product</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-black/60 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-light">Photos of the packaging (if applicable)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-black/60 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-light">A description of the issue</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section ref={(el) => (sectionsRef.current[5] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14 text-center">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Questions About Returns?</h2>
              <p className="text-base font-light text-white/70 mb-6">
                Our customer service team is here to help
              </p>
              <a href="mailto:support@floradistro.com" className="inline-block bg-white text-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium">
                support@floradistro.com
              </a>
              <p className="text-sm font-light text-white/50 mt-6">Monday-Friday, 9am-6pm EST</p>
            </div>
          </section>

          {/* Health & Safety Notice */}
          <section ref={(el) => (sectionsRef.current[6] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/20 backdrop-blur-sm border border-black/10 p-8 md:p-10">
              <h3 className="text-lg font-light uppercase tracking-wider mb-4">⚠️ Health & Safety Notice</h3>
              <p className="text-sm font-light text-black/60 leading-relaxed">
                Due to the nature of hemp-derived THCA products and health and safety regulations, we cannot 
                accept returns of opened or used products unless they are defective. This policy protects the 
                integrity and safety of our products for all customers. We appreciate your understanding.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
