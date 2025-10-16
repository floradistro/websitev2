"use client";

import { Leaf, Truck, Award, Sparkles, Flame, Clock, Shield, Star } from "lucide-react";

interface CategorySectionProps {
  categories: any[];
}

export default function CategorySection({ categories }: CategorySectionProps) {
  const categorySlug = categories?.[0]?.slug?.toLowerCase();
  
  if (!categorySlug) return null;

  // FLOWER CATEGORY
  if (categorySlug.includes('flower') || categorySlug.includes('bud')) {
    return (
      <div className="space-y-px pt-6 mt-6">
        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.1s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Top Shelf Quality
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Hand-selected premium flower, lab tested
              </p>
            </div>
          </div>
        </div>

        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.2s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Truck size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Fast Delivery
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Ships daily at 2PM EST, arrives fresh
              </p>
            </div>
          </div>
        </div>

        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.3s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Award size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Always Fresh
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Climate-controlled storage, peak terps
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CONCENTRATES CATEGORY
  if (categorySlug.includes('concentrate') || categorySlug.includes('extract') || categorySlug.includes('dab') || categorySlug.includes('wax') || categorySlug.includes('shatter')) {
    return (
      <div className="space-y-px pt-6 mt-6">
        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.1s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Shield size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                99%+ Purity
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Solventless extraction, third-party tested
              </p>
            </div>
          </div>
        </div>

        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.2s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Full Spectrum
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Complete terpene profile preserved
              </p>
            </div>
          </div>
        </div>

        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.3s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Clock size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Fresh Drops
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Weekly batches, cold-cured for consistency
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EDIBLES CATEGORY
  if (categorySlug.includes('edible') || categorySlug.includes('gummies') || categorySlug.includes('chocolate')) {
    return (
      <div className="space-y-px pt-6 mt-6">
        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.1s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Award size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Perfect Dosing
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Pharmaceutical precision, consistent dosing
              </p>
            </div>
          </div>
        </div>

        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.2s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Gourmet Quality
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Premium ingredients, natural infusions
              </p>
            </div>
          </div>
        </div>

        <div 
          className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
          style={{ animation: 'fadeIn 0.8s ease-out 0.3s both' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
               style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <Clock size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
                Extended Relief
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
                Long-lasting effects, optimal bioavailability
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT CATEGORY (for any other categories)
  return (
    <div className="space-y-px pt-6 mt-6">
      <div 
        className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
        style={{ animation: 'fadeIn 0.8s ease-out 0.1s both' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
             style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
        <div className="relative flex items-start gap-3">
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <Star size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
              Top Quality
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
              Premium selection, excellence guaranteed
            </p>
          </div>
        </div>
      </div>

      <div 
        className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
        style={{ animation: 'fadeIn 0.8s ease-out 0.2s both' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
             style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
        <div className="relative flex items-start gap-3">
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <Truck size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
              Fast Delivery
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
              Same-day shipping, secure tracking
            </p>
          </div>
        </div>
      </div>

      <div 
        className="relative group/feature border border-white/10 p-4 bg-[#1a1a1a] hover:border-white/20 hover:bg-[#202020] transition-all duration-500 overflow-hidden"
        style={{ animation: 'fadeIn 0.8s ease-out 0.3s both' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-700" 
             style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s ease-in-out infinite' }} />
        <div className="relative flex items-start gap-3">
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <Shield size={12} className="text-white/40 group-hover/feature:text-white transition-all duration-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium group-hover/feature:text-white transition-colors duration-300">
              Tested & Verified
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed group-hover/feature:text-white/60 transition-colors duration-300">
              Third-party lab tested for safety
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

