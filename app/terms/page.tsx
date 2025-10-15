'use client';

import { useEffect, useRef } from 'react';
import { FileText, AlertTriangle, Scale, Shield } from 'lucide-react';

export default function Terms() {
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
          <Scale className="w-12 h-12 mx-auto mb-6 text-white/60 animate-fadeIn" />
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Terms of Service
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            Last Updated: October 14, 2025
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="space-y-16">
          {/* Agreement */}
          <section ref={(el) => (sectionsRef.current[0] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Agreement to Terms</h2>
              <p className="text-base font-light leading-relaxed text-black/70 mb-4">
                Welcome to Flora Distro. These Terms of Service ("Terms") govern your access to and use of our 
                website, products, and services. By accessing or using our website, you agree to be bound by these 
                Terms and our Privacy Policy.
              </p>
              <p className="text-base font-light leading-relaxed text-black/70">
                If you do not agree to these Terms, you may not access or use our website or purchase our products.
              </p>
            </div>
          </section>

          {/* Important Disclaimers */}
          <section ref={(el) => (sectionsRef.current[1] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14">
              <div className="flex items-center space-x-4 mb-6">
                <AlertTriangle className="w-10 h-10 text-white/60" />
                <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider">Important Health & Legal Disclaimers</h2>
              </div>
              <div className="space-y-4 text-sm font-light text-white/70">
                <div className="bg-white/10 border border-white/20 p-6">
                  <p className="mb-3"><strong className="text-white font-normal">Not FDA Approved:</strong> Our products have not been evaluated by the Food and Drug 
                  Administration. These products are not intended to diagnose, treat, cure, or prevent any disease.</p>
                </div>
                <div className="bg-white/10 border border-white/20 p-6">
                  <p className="mb-3"><strong className="text-white font-normal">Intoxicating Effects:</strong> THCA converts to THC when heated. Products may cause 
                  intoxication. Do not drive or operate machinery after use.</p>
                </div>
                <div className="bg-white/10 border border-white/20 p-6">
                  <p className="mb-3"><strong className="text-white font-normal">Drug Testing:</strong> Use of our products may cause you to fail a drug test.</p>
                </div>
                <div className="bg-white/10 border border-white/20 p-6">
                  <p className="mb-3"><strong className="text-white font-normal">Age Restriction:</strong> Products are for adult use only (21+). Keep away from children and pets.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Eligibility */}
          <section ref={(el) => (sectionsRef.current[2] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Eligibility</h2>
              <p className="text-base font-light text-black/70 mb-4">
                You must be at least 21 years of age to access our website and purchase our products. By using our website, you represent and warrant that:
              </p>
              <div className="space-y-3 text-sm font-light">
                {[
                  'You are at least 21 years old',
                  'You have the legal capacity to enter into binding contracts',
                  'You will comply with all applicable federal, state, and local laws',
                  'Hemp-derived THCA products are legal in your state/jurisdiction',
                  'All information you provide is accurate and truthful'
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0"></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Orders and Payments */}
          <section ref={(el) => (sectionsRef.current[3] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Orders and Payments</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-light uppercase tracking-wider mb-4">Order Acceptance</h3>
                  <p className="text-sm font-light text-black/70 mb-4">
                    All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm font-light">
                    {[
                      'Product unavailability',
                      'Errors in pricing or product information',
                      'Suspected fraud or unauthorized transactions',
                      'Orders that violate these Terms',
                      'Shipping to restricted jurisdictions'
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1 h-1 rounded-full bg-black mt-2"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-light uppercase tracking-wider mb-4">Pricing</h3>
                  <p className="text-sm font-light text-black/70">
                    All prices are in U.S. dollars and are subject to change without notice. We reserve the right to 
                    correct pricing errors. If we discover a pricing error after you've placed an order, we'll contact 
                    you for instructions or cancel the order.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-light uppercase tracking-wider mb-4">Payment</h3>
                  <p className="text-sm font-light text-black/70">
                    Payment is due at the time of order. We accept major credit cards and other payment methods as 
                    indicated on our website. By providing payment information, you represent that you are authorized 
                    to use the payment method.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section ref={(el) => (sectionsRef.current[4] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Limitation of Liability</h2>
              <p className="text-base font-light text-white/70 mb-6">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLORA DISTRO SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
                WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE 
                LOSSES.
              </p>
              <div className="bg-white/10 border border-white/20 p-6">
                <p className="text-sm font-light text-white/90">
                  Our total liability for any claims arising out of or relating to these Terms or your use of our 
                  products shall not exceed the amount you paid for the products in question.
                </p>
              </div>
            </div>
          </section>

          {/* Compliance */}
          <section ref={(el) => (sectionsRef.current[5] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <div className="flex items-center space-x-4 mb-6">
                <Shield className="w-8 h-8 text-black/60" />
                <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider">Compliance with Laws</h2>
              </div>
              <p className="text-base font-light text-black/70 mb-4">
                You are solely responsible for compliance with all applicable federal, state, and local laws 
                regarding the purchase, possession, and use of hemp-derived THCA products in your jurisdiction.
              </p>
              <p className="text-base font-light text-black/70">
                We make no representation that products available on our website are appropriate or legal for use 
                in all locations. Those who access our website do so on their own initiative and are responsible 
                for compliance with local laws.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section ref={(el) => (sectionsRef.current[6] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-10 md:p-14 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Governing Law and Dispute Resolution</h2>
              <p className="text-base font-light text-black/70 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of 
                California, without regard to its conflict of law provisions.
              </p>
              <p className="text-base font-light text-black/70 mb-4">
                Any disputes arising out of or relating to these Terms shall be resolved through binding 
                arbitration in accordance with the American Arbitration Association's rules, except that either 
                party may seek injunctive relief in court.
              </p>
              <p className="text-sm font-light text-black/60">
                You waive any right to participate in a class action or class-wide arbitration.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section ref={(el) => (sectionsRef.current[7] = el)} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-10 md:p-14 text-center">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Contact Information</h2>
              <p className="text-base font-light text-white/70 mb-6">
                If you have questions about these Terms, please contact us
              </p>
              <a href="mailto:legal@floradistro.com" className="inline-block bg-white text-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium mb-2">
                legal@floradistro.com
              </a>
              <p className="text-sm font-light text-white/50 mt-4">Monday-Friday, 9am-6pm EST</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
