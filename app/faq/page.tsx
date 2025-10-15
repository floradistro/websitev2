'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

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

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const FAQItem = ({ id, question, answer }: { id: string; question: string; answer: string | ReactNode }) => (
    <div className="border-b border-black/10 last:border-0">
      <button
        onClick={() => toggleItem(id)}
        className="w-full py-6 flex items-start justify-between text-left group"
      >
        <h3 className="font-light text-base md:text-lg pr-8 group-hover:opacity-60 transition-opacity">{question}</h3>
        <div className="mt-1 flex-shrink-0">
          {openItems[id] ? (
            <Minus size={20} className="transition-transform" />
          ) : (
            <Plus size={20} className="transition-transform" />
          )}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          openItems[id] ? 'max-h-[1000px] opacity-100 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="text-sm md:text-base text-black/60 font-light leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#b5b5b2]">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-[#b5b5b2]/20"></div>
        <div className="relative z-10 text-center px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4 animate-fadeIn">Support</p>
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            FAQ
          </h1>
          <p className="text-base md:text-lg font-light text-white/60 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            Everything you need to know about our products and services
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="space-y-16">
          {/* Product Information */}
          <section ref={(el) => { sectionsRef.current[0] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 md:p-12 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Product Information</h2>
              <div className="space-y-0">
                <FAQItem
                  id="thca-what"
                  question="What is THCA?"
                  answer="THCA (tetrahydrocannabinolic acid) is the acidic precursor to THC found in raw cannabis and hemp plants. In its natural state, THCA is non-intoxicating. When exposed to heat through smoking, vaping, or cooking (a process called decarboxylation), THCA converts to THC."
                />
                <FAQItem
                  id="thca-vs-thc"
                  question="How does THCA differ from THC?"
                  answer="THCA is the raw, non-psychoactive form found in live or dried cannabis plants. THC is what THCA becomes after heat activation. THCA will not produce intoxicating effects unless it undergoes decarboxylation."
                />
                <FAQItem
                  id="lab-tested"
                  question="Are your products third-party lab tested?"
                  answer="Yes, all our products undergo rigorous third-party laboratory testing to verify potency, purity, and safety. Lab results are available upon request or with product packaging."
                />
                <FAQItem
                  id="hemp-vs-cannabis"
                  question="What's the difference between hemp-derived and cannabis-derived THCA?"
                  answer="Chemically, they are identical. The difference is the source plant. Hemp-derived THCA comes from hemp plants (cannabis with <0.3% delta-9 THC by dry weight) and is federally legal under the 2018 Farm Bill. Cannabis-derived THCA comes from marijuana plants and has different legal restrictions."
                />
              </div>
            </div>
          </section>

          {/* Legal & Compliance */}
          <section ref={(el) => { sectionsRef.current[1] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Legal & Compliance</h2>
              <div className="space-y-0">
                <FAQItem
                  id="legal"
                  question="Is THCA legal?"
                  answer="Hemp-derived THCA is federally legal under the 2018 Farm Bill, which legalized hemp and its derivatives containing less than 0.3% delta-9 THC by dry weight. However, state laws vary. It is your responsibility to understand and comply with your local laws before purchasing."
                />
                <FAQItem
                  id="shipping-states"
                  question="Do you ship to all states?"
                  answer="We ship to most states where hemp-derived THCA products are legal. We cannot ship to states with specific prohibitions. Please check our shipping policy for the current list of restricted states."
                />
                <FAQItem
                  id="drug-test"
                  question="Will THCA show up on a drug test?"
                  answer="Yes. If consumed, THCA can convert to THC in your system and may cause you to fail a drug test. We do not recommend using these products if you are subject to drug testing."
                />
                <FAQItem
                  id="age-requirement"
                  question="What is the minimum age to purchase?"
                  answer="You must be 21 years of age or older to purchase our products. Age verification is required at checkout."
                />
              </div>
            </div>
          </section>

          {/* Ordering & Payment */}
          <section ref={(el) => { sectionsRef.current[2] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 md:p-12 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Ordering & Payment</h2>
              <div className="space-y-0">
                <FAQItem
                  id="payment-methods"
                  question="What payment methods do you accept?"
                  answer="We accept major credit cards, debit cards, and alternative payment methods. All transactions are processed securely."
                />
                <FAQItem
                  id="modify-order"
                  question="Can I modify or cancel my order after placing it?"
                  answer="Orders can be modified or cancelled within 1 hour of placement. Please contact us immediately at support@floradistro.com. Once your order has been processed for shipment, we cannot make changes."
                />
                <FAQItem
                  id="wholesale"
                  question="Do you offer wholesale or bulk pricing?"
                  answer="Yes, we offer wholesale pricing for qualified retailers and bulk discounts for large orders. Please contact wholesale@floradistro.com for more information."
                />
              </div>
            </div>
          </section>

          {/* Shipping & Delivery */}
          <section ref={(el) => { sectionsRef.current[3] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 md:p-12 shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Shipping & Delivery</h2>
              <div className="space-y-0">
                <FAQItem
                  id="shipping-time"
                  question="How long does shipping take?"
                  answer="Standard shipping takes 3-7 business days. Express shipping (2-3 business days) is available at checkout. Orders are typically processed within 1-2 business days."
                />
                <FAQItem
                  id="free-shipping"
                  question="Do you offer free shipping?"
                  answer="Yes, we offer free standard shipping on orders over $100. Expedited shipping rates apply to express delivery options."
                />
                <FAQItem
                  id="tracking"
                  question="How can I track my order?"
                  answer="Once your order ships, you'll receive a tracking number via email. You can also track your order on our website by visiting the Track Order page."
                />
                <FAQItem
                  id="discreet"
                  question="Is my package discreet?"
                  answer="Yes, all orders are shipped in plain, unmarked packaging with no indication of contents. The return address shows our business name only."
                />
              </div>
            </div>
          </section>

          {/* Usage & Safety */}
          <section ref={(el) => { sectionsRef.current[4] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-8">Usage & Safety</h2>
              <div className="space-y-0">
                <FAQItem
                  id="how-to-use"
                  question="How should I consume THCA products?"
                  answer="THCA can be consumed in various ways: smoking, vaping, dabbing, or incorporating into edibles. Start with a low dose and increase gradually. Always follow product-specific instructions."
                />
                <FAQItem
                  id="storage"
                  question="How should I store my products?"
                  answer="Store products in a cool, dry place away from direct sunlight. Keep in original packaging and out of reach of children and pets. Proper storage helps maintain potency and freshness."
                />
                <FAQItem
                  id="side-effects"
                  question="Are there any side effects?"
                  answer="When THCA is converted to THC through heat, possible side effects may include dry mouth, red eyes, increased appetite, impaired memory, and altered perception. Do not drive or operate machinery after use."
                />
                <FAQItem
                  id="travel"
                  question="Can I travel with THCA products?"
                  answer="While hemp-derived THCA is federally legal, we do not recommend traveling with these products, especially across state lines or internationally. Laws vary by jurisdiction and penalties can be severe. Always check local laws before traveling."
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section ref={(el) => { sectionsRef.current[5] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 md:p-12 text-center shadow-elevated-lg">
              <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider mb-6">Still Have Questions?</h2>
              <p className="text-base font-light text-black/70 mb-6">
                We're here to help! Contact our customer support team:
              </p>
              <a href="mailto:support@floradistro.com" className="inline-block bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-black/80 transition-all font-medium">
                support@floradistro.com
              </a>
              <p className="text-sm font-light text-black/60 mt-6">Monday-Friday, 9am-6pm EST</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
