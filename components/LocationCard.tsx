"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface LocationCardProps {
  location: any;
  address: string;
  googleMapsUrl: string;
  hours?: string;
}

export default function LocationCard({ location, address, googleMapsUrl, hours }: LocationCardProps) {
  const [reviews, setReviews] = useState<{ rating?: number; user_ratings_total?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      // Skip review fetching for vendor warehouses or locations without addresses
      if (!address || address.trim() === '' || location.type === 'vendor') {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/google-reviews?location=${encodeURIComponent(location.name)}&address=${encodeURIComponent(address)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [location.name, address, location.type]);

  const CardContent = (
    <div className="group bg-[#404040] hover:bg-[#4a4a4a] transition-all duration-500 border border-white/10 hover:border-white/30 h-full flex flex-col hover:shadow-2xl hover:shadow-white/5 hover:scale-[1.02] hover:-translate-y-1">
      <div className="aspect-[4/5] flex items-center justify-center border-b border-white/5 bg-[#2a2a2a] p-12 relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-100 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Enhanced gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Logo */}
        <img 
          src="/logoprint.png" 
          alt={location.name}
          className="w-full h-full object-contain opacity-40 group-hover:opacity-60 transition-all duration-700 brightness-110 group-hover:brightness-125 group-hover:scale-110 relative z-10"
        />
        
        {/* Map pin icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:scale-125 transition-all duration-500">
          <div className="w-8 h-8 border border-white/30 group-hover:border-white/50 rounded-full flex items-center justify-center transition-all duration-500">
            <div className="w-2 h-2 bg-white/50 group-hover:bg-white/80 rounded-full transition-all duration-500" />
          </div>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
          {location.name}
        </h3>
        
        {address && (
          <p className="text-xs text-white/40 font-light leading-relaxed whitespace-pre-line mb-4">
            {address}
          </p>
        )}
        
        {/* Hours */}
        {hours && (
          <div className="mb-4 pb-4 border-b border-white/5">
            <p className="text-xs text-white/50 font-light leading-relaxed whitespace-pre-line">
              {hours}
            </p>
          </div>
        )}
        
        {/* Google Reviews */}
        {!loading && reviews && reviews.rating && (
          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={`${
                      i < Math.floor(reviews.rating!)
                        ? 'fill-white text-white'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-white font-medium">{reviews.rating.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              {reviews.user_ratings_total} Google Reviews
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return googleMapsUrl ? (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      {CardContent}
    </a>
  ) : (
    <div className="h-full">
      {CardContent}
    </div>
  );
}

