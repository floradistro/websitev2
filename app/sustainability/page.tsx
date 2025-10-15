'use client';

import { useEffect, useRef } from 'react';

export default function Sustainability() {
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
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4 animate-fadeIn">Our Commitment</p>
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Sustainability
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto animate-scaleIn" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="space-y-20 text-black leading-relaxed">
          <section ref={(el) => { sectionsRef.current[0] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 md:p-12 shadow-elevated-lg">
              <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">Our Commitment</h2>
              <p className="text-lg md:text-xl font-light leading-relaxed text-black/80">
                At Flora Distro, we are dedicated to sustainable practices that honor both our planet and our community. 
                We believe in transparency, responsibility, and creating a positive impact through every step of our operation.
              </p>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[1] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">Sustainable Sourcing</h2>
                <p className="text-base md:text-lg font-light leading-relaxed text-black/70 mb-6">
                  We partner exclusively with licensed cultivators who practice organic farming methods and sustainable 
                  growing techniques. Our THCA products are derived from hemp plants grown without harmful pesticides 
                  or synthetic fertilizers.
                </p>
              </div>
              <div className="bg-black/5 backdrop-blur-sm border border-black/10 p-8 space-y-4">
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">100% natural farming practices</p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">Water conservation systems</p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">Renewable energy-powered facilities</p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">Soil health preservation methods</p>
                </div>
              </div>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[2] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-black/5 backdrop-blur-sm border border-black/10 p-8 space-y-4 md:order-first order-last">
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">Recyclable glass and paper packaging</p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">Biodegradable packing materials</p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">Minimal plastic usage</p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 group-hover:scale-150 transition-transform"></div>
                  <p className="text-sm md:text-base font-light">Child-resistant, eco-conscious containers</p>
                </div>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">Packaging</h2>
                <p className="text-base md:text-lg font-light leading-relaxed text-black/70">
                  Our packaging is designed with the environment in mind. We use recyclable materials and minimize 
                  excess packaging wherever possible.
                </p>
              </div>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[3] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a1a] to-black opacity-90"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">Community Impact</h2>
                <p className="text-base md:text-lg font-light leading-relaxed text-white/70 max-w-3xl">
                  We support local communities through fair labor practices and partnerships with small-scale farmers. 
                  A portion of our proceeds goes to environmental conservation efforts and cannabis industry education programs.
                </p>
              </div>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[4] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">Continuous Improvement</h2>
              <p className="text-base md:text-lg font-light leading-relaxed text-black/70">
                Sustainability is an ongoing journey. We regularly assess our environmental impact and implement 
                improvements to reduce our carbon footprint. We welcome feedback from our community as we strive 
                to be better stewards of our planet.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

