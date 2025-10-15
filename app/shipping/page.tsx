'use client';

import { useEffect, useRef } from 'react';
import { Package, Clock, MapPin, Shield } from 'lucide-react';

export default function Shipping() {
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
          <Package className="w-12 h-12 mx-auto mb-6 text-white/60 animate-fadeIn" />
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Shipping
          </h1>
          <p className="text-base md:text-lg font-light text-white/60 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            Fast, secure, and discrete delivery to your door
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 max-w-6xl">
        <div className="space-y-16">
          {/* Shipping Rates */}
          <section ref={(el) => { sectionsRef.current[0] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8 text-center">Shipping Rates & Delivery Times</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 shadow-elevated-lg hover:shadow-elevated-lg hover:scale-105 transition-all duration-300">
                <Clock className="w-8 h-8 mb-4 text-black/60" />
                <h3 className="text-lg font-light uppercase tracking-wider mb-3">Standard</h3>
                <p className="text-2xl font-light mb-2">$6.95</p>
                <p className="text-sm text-black/60 mb-4">3-7 Business Days</p>
                <div className="text-xs text-black/50 font-light">
                  FREE on orders $100+
                </div>
              </div>

              <div className="bg-black text-white p-8 shadow-elevated-lg hover:scale-105 transition-all duration-300">
                <Clock className="w-8 h-8 mb-4 text-white/60" />
                <h3 className="text-lg font-light uppercase tracking-wider mb-3">Express</h3>
                <p className="text-2xl font-light mb-2">$14.95</p>
                <p className="text-sm text-white/60 mb-4">2-3 Business Days</p>
                <div className="text-xs text-white/50 font-light">
                  All orders
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 shadow-elevated-lg hover:shadow-elevated-lg hover:scale-105 transition-all duration-300">
                <Clock className="w-8 h-8 mb-4 text-black/60" />
                <h3 className="text-lg font-light uppercase tracking-wider mb-3">Overnight</h3>
                <p className="text-2xl font-light mb-2">$29.95</p>
                <p className="text-sm text-black/60 mb-4">1 Business Day</p>
                <div className="text-xs text-black/50 font-light">
                  Order before 12pm EST
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-black/50 mt-6 font-light">
              * Delivery times are estimates and not guaranteed
            </p>
          </section>

          {/* Features */}
          <section ref={(el) => { sectionsRef.current[1] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <Shield className="w-8 h-8 text-black/60" />
                </div>
                <h3 className="text-lg font-light uppercase tracking-wider mb-2">Discrete Packaging</h3>
                <p className="text-sm text-black/60 font-light">Plain, unmarked boxes with no product indication</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <Package className="w-8 h-8 text-black/60" />
                </div>
                <h3 className="text-lg font-light uppercase tracking-wider mb-2">Secure Delivery</h3>
                <p className="text-sm text-black/60 font-light">Tracking provided for all shipments</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <Clock className="w-8 h-8 text-black/60" />
                </div>
                <h3 className="text-lg font-light uppercase tracking-wider mb-2">Fast Processing</h3>
                <p className="text-sm text-black/60 font-light">Orders ship within 1-2 business days</p>
              </div>
            </div>
          </section>

          {/* Restricted States */}
          <section ref={(el) => { sectionsRef.current[2] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14">
              <MapPin className="w-10 h-10 mb-6 text-white/60" />
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Shipping Restrictions</h2>
              <p className="text-base font-light text-white/70 mb-6">
                We currently ship to most states where hemp-derived THCA products are legal. We cannot ship to the following states:
              </p>
              <div className="bg-white/10 border border-white/20 p-6 rounded">
                <p className="text-sm font-light text-white/90 leading-relaxed">
                  Alaska, Arkansas, Colorado, Delaware, Idaho, Iowa, Mississippi, Montana, Nevada, 
                  New York, North Dakota, Oregon, Rhode Island, Utah, Vermont, Washington
                </p>
              </div>
              <p className="text-xs text-white/50 mt-6 font-light">
                * This list is subject to change. You are responsible for ensuring products are legal in your state.
              </p>
            </div>
          </section>

          {/* Policy Details */}
          <section ref={(el) => { sectionsRef.current[3] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Order Processing</h2>
              <div className="space-y-6 text-sm md:text-base font-light leading-relaxed text-black/70">
                <p>
                  Orders are processed Monday through Friday, excluding major holidays. Orders placed after 2pm EST 
                  will be processed the next business day.
                </p>
                <p>
                  Once your order has been shipped, you will receive a confirmation email with tracking information. 
                  Please allow 24 hours after receiving your shipping confirmation for tracking information to update.
                </p>
              </div>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[4] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8">
                <h3 className="text-xl font-light uppercase tracking-wider mb-4">Order Tracking</h3>
                <p className="text-sm font-light leading-relaxed text-black/70 mb-4">
                  Track your order in real-time using the tracking number provided in your shipping confirmation email.
                </p>
                <a href="/track" className="text-sm uppercase tracking-wider hover:opacity-60 transition-opacity underline">
                  Track Your Order →
                </a>
              </div>

              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8">
                <h3 className="text-xl font-light uppercase tracking-wider mb-4">Address Verification</h3>
                <p className="text-sm font-light leading-relaxed text-black/70">
                  Please ensure your shipping address is complete and correct. We are not responsible for orders 
                  shipped to incorrect addresses provided by the customer.
                </p>
              </div>

              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8">
                <h3 className="text-xl font-light uppercase tracking-wider mb-4">Lost or Stolen Packages</h3>
                <p className="text-sm font-light leading-relaxed text-black/70">
                  Flora Distro is not responsible for lost or stolen packages confirmed delivered to the provided 
                  address. We recommend choosing a secure delivery location.
                </p>
              </div>

              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8">
                <h3 className="text-xl font-light uppercase tracking-wider mb-4">Damaged Shipments</h3>
                <p className="text-sm font-light leading-relaxed text-black/70">
                  If your order arrives damaged, contact us within 7 days with photos. We'll provide a replacement 
                  or refund.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section ref={(el) => { sectionsRef.current[5] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14 text-center">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Need Help?</h2>
              <p className="text-base font-light text-white/70 mb-6">
                For questions about shipping or to check on your order status
              </p>
              <a href="mailto:support@floradistro.com" className="inline-block bg-white text-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium">
                support@floradistro.com
              </a>
              <p className="text-sm font-light text-white/50 mt-6">Monday-Friday, 9am-6pm EST</p>
            </div>
          </section>

          {/* Important Notice */}
          <section ref={(el) => { sectionsRef.current[6] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/20 backdrop-blur-sm border border-black/10 p-8 md:p-10">
              <h3 className="text-lg font-light uppercase tracking-wider mb-4">⚠️ Important Notice</h3>
              <p className="text-sm font-light text-black/60 leading-relaxed">
                By placing an order, you confirm that you are at least 21 years of age and that hemp-derived THCA 
                products are legal in your state. Flora Distro reserves the right to refuse shipment to any state 
                where these products are prohibited. You are responsible for knowing and complying with all local 
                laws and regulations regarding hemp-derived products.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
