// @ts-nocheck
import { Truck, Package } from 'lucide-react';

interface ShippingBadgesSectionProps {
  content: {
    badges?: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
}

export function ShippingBadgesSection({ content }: ShippingBadgesSectionProps) {
  const defaultBadges = [
    {
      icon: 'truck',
      title: 'Same-Day Shipping',
      description: 'Order before 2PM for same-day dispatch'
    },
    {
      icon: 'package',
      title: 'Secure Packaging',
      description: 'Discreet and protected delivery'
    }
  ];

  const badges = content.badges && content.badges.length > 0 ? content.badges : defaultBadges;

  return (
    <section className="py-8 sm:py-16 bg-[#0a0a0a] border-t border-white/10 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-3xl mx-auto">
          {badges.map((badge: any, index: number) => (
            <div key={index} className="flex items-center gap-3 sm:gap-4 bg-white/5 border border-white/10 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                {badge.icon === 'truck' ? (
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-white font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">{typeof badge.title === 'string' ? badge.title : 'Feature'}</h3>
                <p className="text-white/50 text-xs sm:text-sm">{typeof badge.description === 'string' ? badge.description : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

