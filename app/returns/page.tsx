import { RotateCcw, Check, X } from 'lucide-react';

export default function Returns() {
  return (
    <div className="bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Returns
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed">
            30-day return policy.
          </p>
        </div>
      </section>

      {/* Return Conditions */}
      <section className="bg-[#2a2a2a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Return Policy
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <Check className="w-6 h-6 text-white/60" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white font-normal">Eligible Returns</h3>
            </div>
            <div className="space-y-3 text-xs text-white/50 font-light">
              <p>• Unopened and unused products</p>
              <p>• Original packaging intact</p>
              <p>• Defective or damaged items</p>
              <p>• Within 30 days of delivery</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <X className="w-6 h-6 text-white/60" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white font-normal">Not Eligible</h3>
            </div>
            <div className="space-y-3 text-xs text-white/50 font-light">
              <p>• Opened or used products</p>
              <p>• Missing original packaging</p>
              <p>• Products damaged by misuse</p>
              <p>• Items marked as final sale</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Return */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-16 leading-tight text-center">
            How to return an item
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/20 text-white flex items-center justify-center text-lg font-light mb-4 mx-auto">
                1
              </div>
              <h3 className="text-xs uppercase tracking-[0.2em] mb-2 text-white">Email Us</h3>
              <p className="text-xs text-white/40 font-light">support@floradistro.com</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/20 text-white flex items-center justify-center text-lg font-light mb-4 mx-auto">
                2
              </div>
              <h3 className="text-xs uppercase tracking-[0.2em] mb-2 text-white">Get RMA</h3>
              <p className="text-xs text-white/40 font-light">1-2 business days</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/20 text-white flex items-center justify-center text-lg font-light mb-4 mx-auto">
                3
              </div>
              <h3 className="text-xs uppercase tracking-[0.2em] mb-2 text-white">Pack Item</h3>
              <p className="text-xs text-white/40 font-light">Include RMA number</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/20 text-white flex items-center justify-center text-lg font-light mb-4 mx-auto">
                4
              </div>
              <h3 className="text-xs uppercase tracking-[0.2em] mb-2 text-white">Ship Back</h3>
              <p className="text-xs text-white/40 font-light">To return address</p>
            </div>
          </div>
        </div>
      </section>

      {/* Refunds */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-8 uppercase tracking-wider">
            Refund Processing
          </h2>
          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <p className="text-sm text-white/50 font-light leading-relaxed mb-6">
              Refunds process within 5-7 business days after we receive your return. Refunds go to your original payment method.
            </p>
            <p className="text-xs text-white/40 font-light">
              Original shipping charges are non-refundable.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-8 leading-tight">
            Questions?
          </h2>
          <p className="text-base text-white/50 mb-8">
            Email: <a href="mailto:support@floradistro.com" className="text-white underline hover:no-underline">support@floradistro.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
