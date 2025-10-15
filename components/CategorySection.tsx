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
      <div className="border-t border-white/20 pt-12">
        {/* Title Section */}
        <div className="mb-8">
          <div className="inline-flex items-center mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20"></div>
            <Leaf className="w-5 h-5 mx-3 text-white/40" strokeWidth={1.5} />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20"></div>
          </div>
          <h2 className="text-lg uppercase tracking-[0.25em] font-semibold mb-2 text-white">
            Premium Flower
          </h2>
          <p className="text-xs text-white/60 font-light">
            Cultivated with care, delivered with precision
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-6">
          <div className="group">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Top Shelf Quality</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Hand-selected premium flower, harvested at peak potency. Lab tested for quality and purity.
                </p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="flex items-start gap-4">
              <Truck className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Fast Delivery</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Same-day delivery available. Your order arrives fresh, discreet, and on time—every time.
                </p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="flex items-start gap-4">
              <Award className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Always Fresh</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Climate-controlled storage and sealed at optimal humidity. Maximum aroma, peak freshness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CONCENTRATES CATEGORY
  if (categorySlug.includes('concentrate') || categorySlug.includes('extract') || categorySlug.includes('dab') || categorySlug.includes('wax') || categorySlug.includes('shatter')) {
    return (
      <div className="border-t border-white/20 pt-12">
        {/* Title Section */}
        <div className="mb-8">
          <div className="inline-flex items-center mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20"></div>
            <Flame className="w-5 h-5 mx-3 text-white/40" strokeWidth={1.5} />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20"></div>
          </div>
          <h2 className="text-lg uppercase tracking-[0.25em] font-semibold mb-2 text-white">
            Pure Concentrates
          </h2>
          <p className="text-xs text-white/60 font-light">
            Maximum potency, minimal impurities
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-6">
          <div className="group">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">99%+ Purity</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Solventless extraction ensures the cleanest concentrates. Third-party tested for purity and safety.
                </p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Full Spectrum</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Complete cannabinoid and terpene profile preserved. Experience the ultimate entourage effect.
                </p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Fresh Drops</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  New extracts weekly. Cold-cured and properly aged for optimal consistency and flavor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EDIBLES CATEGORY
  if (categorySlug.includes('edible') || categorySlug.includes('gummies') || categorySlug.includes('chocolate')) {
    return (
      <div className="border-t border-white/20 pt-12">
        {/* Title Section */}
        <div className="mb-8">
          <div className="inline-flex items-center mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20"></div>
            <Star className="w-5 h-5 mx-3 text-white/40" strokeWidth={1.5} />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20"></div>
          </div>
          <h2 className="text-lg uppercase tracking-[0.25em] font-semibold mb-2 text-white">
            Premium Edibles
          </h2>
          <p className="text-xs text-white/60 font-light">
            Precisely dosed, deliciously crafted
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-6">
          <div className="group">
            <div className="flex items-start gap-4">
              <Award className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Perfect Dosing</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Pharmaceutical-grade precision. Consistent, reliable dosing from 2.5mg to 100mg per serving.
                </p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Gourmet Quality</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Premium ingredients, no artificial flavors. Natural, delicious infusions crafted by experts.
                </p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-white">Extended Relief</h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  Long-lasting effects for sustained relief. Activated for optimal bioavailability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT CATEGORY (for any other categories)
  return (
    <div className="border-t border-white/20 pt-12">
      {/* Title Section */}
      <div className="mb-8">
        <div className="inline-flex items-center mb-4">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20"></div>
          <Award className="w-5 h-5 mx-3 text-white/40" strokeWidth={1.5} />
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20"></div>
        </div>
        <h2 className="text-lg uppercase tracking-[0.25em] font-semibold mb-2 text-white">
          Premium Quality
        </h2>
        <p className="text-xs text-white/60 font-light">
          Expertly curated, carefully tested
        </p>
      </div>

      {/* Feature List */}
      <div className="space-y-6">
        <div className="group">
          <div className="flex items-start gap-4">
            <Star className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-semibold mb-1 text-white">Top Quality</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Carefully selected and tested to ensure the highest quality standards. Excellence guaranteed.
              </p>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-start gap-4">
            <Truck className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-semibold mb-1 text-white">Fast Delivery</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Same-day delivery available. Your order arrives fresh, secure, and on time with tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 flex-shrink-0 mt-1" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-semibold mb-1 text-white">Tested & Verified</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Third-party lab tested for safety, potency, and purity. Full transparency on every batch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

