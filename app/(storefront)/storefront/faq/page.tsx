import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { UniversalPageRenderer } from '@/components/storefront/UniversalPageRenderer';

export default async function FAQPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  const faqs = [
    {
      category: "Orders & Shipping",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Standard shipping takes 3-5 business days. Express shipping takes 2-3 business days. Orders placed before 2PM ship same day."
        },
        {
          q: "Do you offer free shipping?",
          a: "Yes! We offer free standard shipping on all orders over $45."
        },
        {
          q: "Can I track my order?",
          a: "Absolutely. You'll receive a tracking number via email once your order ships. You can track your package in real-time."
        },
        {
          q: "What if my order is damaged?",
          a: "Contact us immediately with photos. We'll send a replacement or issue a full refund within 24 hours."
        }
      ]
    },
    {
      category: "Products",
      questions: [
        {
          q: "Are your products lab tested?",
          a: "Yes. Every product is third-party lab tested for purity, potency, and safety. Lab results are available upon request."
        },
        {
          q: "What's the difference between your pricing tiers?",
          a: "Our products come in multiple sizes/quantities. The more you buy, the better the value. Select your preferred quantity at checkout."
        },
        {
          q: "Are your products legal?",
          a: "All products contain less than 0.3% Delta-9 THC and comply with the 2018 Farm Bill. They are legal federally, but some states have restrictions."
        },
        {
          q: "How should I store my products?",
          a: "Store in a cool, dry place away from direct sunlight. Keep products sealed when not in use to maintain freshness."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "What's your return policy?",
          a: "Unopened products can be returned within 30 days for a full refund. Opened products cannot be returned due to health regulations."
        },
        {
          q: "How long do refunds take?",
          a: "Refunds are processed within 5-7 business days after we receive your return. You'll receive an email confirmation."
        },
        {
          q: "Who pays for return shipping?",
          a: "We provide prepaid return labels for damaged or incorrect items. For standard returns, return shipping is the customer's responsibility."
        }
      ]
    },
    {
      category: "Account & Payment",
      questions: [
        {
          q: "Do I need an account to order?",
          a: "No, you can checkout as a guest. However, creating an account lets you track orders and save your information for faster checkout."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, debit cards, and digital payment methods including Apple Pay and Google Pay."
        },
        {
          q: "Is my payment information secure?",
          a: "Yes. We use industry-standard encryption and never store your full payment details on our servers."
        }
      ]
    }
  ];

  // Check if in preview mode (live editor)
  const params = await searchParams;
  if (params.preview === 'true') {
    return (
      <>
        <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
            <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
              <Link href="/storefront" className="text-white/40 hover:text-white transition-colors">Home</Link>
              <span className="text-white/20">/</span>
              <span className="text-white/60 font-medium">FAQ</span>
            </nav>
          </div>
        </div>
        <UniversalPageRenderer vendor={vendor} pageType="faq" />
      </>
    );
  }

  // Normal mode - show full page
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
      </div>

      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
          <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
            <Link href="/storefront" className="text-white/40 hover:text-white transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-medium">FAQ</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 md:p-12">
          {/* Animated Logo Header */}
          {vendor.logo_url && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-20 h-20 animate-fadeIn">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.store_name}
                  className="relative w-full h-full object-contain drop-shadow-xl opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500"
                />
              </div>
            </div>
          )}
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 uppercase tracking-[-0.03em] text-center">
            FAQ
          </h1>
          <p className="text-neutral-400 text-lg mb-12 font-light text-center">
            Frequently asked questions
          </p>

          <div className="space-y-12">
            {faqs.map((section, idx) => (
              <section key={idx}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">{section.category}</h2>
                </div>
                <div className="space-y-4">
                  {section.questions.map((faq, qIdx) => (
                    <div key={qIdx} className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                      <h3 className="text-white font-semibold mb-3">{faq.q}</h3>
                      <p className="text-neutral-300 text-sm font-light leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Still Have Questions */}
            <section className="border-t border-white/10 pt-8">
              <div className="bg-white/5 border border-white/10 rounded-[20px] p-8 text-center">
                <h3 className="text-white text-xl font-semibold mb-3">Still have questions?</h3>
                <p className="text-neutral-400 mb-6">We're here to help</p>
                <Link 
                  href="/storefront/contact"
                  className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

