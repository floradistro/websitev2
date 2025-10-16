'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const FAQItem = ({ id, question, answer }: { id: string; question: string; answer: string }) => (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => toggleItem(id)}
        className="w-full py-6 flex items-start justify-between text-left group"
      >
        <h3 className="font-light text-sm md:text-base pr-8 text-white group-hover:text-white/80 transition-colors uppercase tracking-[0.15em]">{question}</h3>
        <div className="mt-1 flex-shrink-0 text-white/60">
          {openItems[id] ? <Minus size={16} /> : <Plus size={16} />}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          openItems[id] ? 'max-h-[1000px] opacity-100 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-xs md:text-sm text-white/50 font-light leading-relaxed">{answer}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            FAQ
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed">
            Questions answered.
          </p>
        </div>
      </section>

      {/* Product Info */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-8 font-normal">Product</h2>
          <div className="bg-[#3a3a3a] border border-white/10 p-6">
            <FAQItem
              id="thca-what"
              question="What is THCa?"
              answer="THCa is the raw form of THC found in hemp. When heated, it converts to THC. All our products are hemp-derived and federally legal under the 2018 Farm Bill."
            />
            <FAQItem
              id="lab-tested"
              question="Are products lab tested?"
              answer="Yes. Every batch is third-party tested for potency and purity. Lab results available on request."
            />
            <FAQItem
              id="drug-test"
              question="Will I fail a drug test?"
              answer="Yes. Our products contain THCa which converts to THC. If you're drug tested, don't use our products."
            />
          </div>
        </div>
      </section>

      {/* Ordering */}
      <section className="bg-[#3a3a3a] py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-8 font-normal">Ordering</h2>
          <div className="bg-[#2a2a2a] border border-white/10 p-6">
            <FAQItem
              id="payment"
              question="What payment methods?"
              answer="Credit/debit cards and alternative payment methods. All transactions are secure."
            />
            <FAQItem
              id="wholesale"
              question="Wholesale pricing?"
              answer="Yes. Email wholesale@floradistro.com for bulk pricing and qualified retailer accounts."
            />
            <FAQItem
              id="modify-order"
              question="Can I change my order?"
              answer="You have 1 hour after placing your order to modify or cancel. After that, it's processing. Email support@floradistro.com immediately if you need changes."
            />
          </div>
        </div>
      </section>

      {/* Shipping */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg uppercase tracking-[0.2em] text-white mb-8 font-normal">Shipping</h2>
          <div className="bg-[#3a3a3a] border border-white/10 p-6">
            <FAQItem
              id="ship-time"
              question="How long does shipping take?"
              answer="We ship daily at 2PM EST. Regional orders (NC, East TN) arrive next day. Other states 2-4 days."
            />
            <FAQItem
              id="tracking"
              question="Do I get tracking?"
              answer="Yes. Every order is tracked and insured. You'll receive tracking info via email once shipped."
            />
            <FAQItem
              id="discreet"
              question="Is packaging discreet?"
              answer="100%. Plain boxes, no branding, no indication of contents. Just our business name as sender."
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-8 leading-tight">
            Still have questions?
          </h2>
          <p className="text-base text-white/50 mb-8">
            Email us: <a href="mailto:support@floradistro.com" className="text-white underline hover:no-underline">support@floradistro.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
