import { MapPin, Phone, Store, Truck, ArrowRight } from 'lucide-react';

interface LocationsSectionProps {
  content: {
    headline?: string;
    subheadline?: string;
  };
  locations?: any[];
  vendor?: any;
}

export function LocationsSection({ content, locations = [], vendor }: LocationsSectionProps) {
  const retailLocations = locations.filter((loc: any) => loc.type === 'retail');

  console.log('🏪 LocationsSection - locations count:', locations.length);
  console.log('🏪 LocationsSection - first location:', retailLocations[0]);

  if (retailLocations.length === 0) return null;
  
  // Ensure content is valid
  const headline = typeof content?.headline === 'string' ? content.headline : 'Visit us in person';
  const subheadline = typeof content?.subheadline === 'string' ? content.subheadline : `${retailLocations.length} locations`;

  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-[-0.02em]">
            {headline}
          </h2>
          <p className="text-xl text-neutral-400 font-light">
            {subheadline}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {retailLocations.map((location: any) => {
            const fullAddress = `${location.address_line1}, ${location.city}, ${location.state} ${location.zip}`;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
            
            return (
              <div
                key={location.id}
                className="group bg-black/80 backdrop-blur-xl hover:bg-black/90 rounded-[32px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-1"
              >
                {/* Logo Header */}
                <div className="aspect-[4/3] bg-black/20 flex items-center justify-center p-8 border-b border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                  {vendor?.logo_url ? (
                    <img 
                      src={vendor.logo_url} 
                      alt={vendor.store_name}
                      className="w-full h-full object-contain opacity-40 group-hover:opacity-60 transition-all duration-700 relative z-10"
                    />
                  ) : (
                    <div className="text-4xl font-light text-white/20">{vendor?.store_name?.[0] || 'S'}</div>
                  )}
                </div>
                
                {/* Location Info */}
                <div className="p-8">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1.5 tracking-tight">
                        {typeof location.name === 'string' ? location.name : String(location.name || 'Location')}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-neutral-400 mb-6 font-light">
                    <div>{String(location.address_line1 || '')}</div>
                    <div>{String(location.city || '')}, {String(location.state || '')} {String(location.zip || '')}</div>
                  </div>

                  {location.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
                      <Phone className="w-4 h-4" />
                      <span>{String(location.phone)}</span>
                    </div>
                  )}

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-white font-semibold group-hover:gap-3 transition-all"
                  >
                    <span>Get directions</span>
                    <ArrowRight className="w-4 h-4 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

