
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface PremiumTestimonialsProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  maxReviews?: number;
  showRatings?: boolean;
  accentColor?: string;
}

export function PremiumTestimonials({ vendorId, ...props }: PremiumTestimonialsProps) {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [reviews, setReviews] = useState(null);
  
  useEffect(() => {
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => {
        setReviews(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setReviews({});
      });
  }, [vendorId]);

  const [avgRating, setAvgRating] = useState(null);
  
  useEffect(() => {
    fetch('/api/reviews/average')
      .then(res => res.json())
      .then(data => {
        setAvgRating(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setAvgRating({});
      });
  }, [vendorId]);
  
  // Check if data is loaded
  const dataLoaded = reviews !== null && avgRating !== null;
  
  useEffect(() => {
    if (dataLoaded) {
      setLoading(false);
    }
  }, [dataLoaded]);
  
  
  
  // Quantum state management
  const [activeState, setActiveState] = useState('DesktopGrid');
  
  useEffect(() => {
    // Detect device type for quantum state selection
    const isMobile = window.innerWidth < 768;
    const device = isMobile ? 'mobile' : 'desktop';
    
    if (device == "mobile") {
      setActiveState('MobileCarousel');
    } else if (device == "desktop") {
      setActiveState('DesktopGrid');
    }
  }, []);
  
  
  return (
    <SmartComponentWrapper 
      componentName="PremiumTestimonials"
      loading={loading}
      error={error}
    >
      
      <>
        
      {activeState === 'MobileCarousel' && dataLoaded && (
        <div className="bg-black py-16 px-4">
          <div className="mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-3">
              {props.headline || "Default Headline"}
            </h2>
            <p className="text-white/60 text-lg">{props.subheadline || "Default Subheadline"}</p>
            {props.showRatings && (
              <div className="flex items-center gap-3 mt-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg className="w-5 h-5" fill={i < Math.floor(avgRating) ? props.accentColor : "#ffffff20"} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-white/80 font-bold">{avgRating.toFixed(1)}</span>
                <span className="text-white/40">({reviews.length} reviews)</span>
              </div>
            )}
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {reviews.slice(0, props.maxReviews || 6).map(review => (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 min-w-[85vw] snap-center hover:border-white/10 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg className="w-4 h-4" fill={i < review.rating ? props.accentColor : "#ffffff20"} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-white/70 text-base leading-relaxed mb-6 italic">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                    <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-base">{review.author}</div>
                    <div className="text-white/40 text-sm uppercase tracking-wide">{review.location}</div>
                  </div>
                </div>
                {review.verified && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs uppercase tracking-wider text-white/40 flex items-center gap-1">
                      <svg className="w-3 h-3" fill={props.accentColor} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Verified Purchase
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeState === 'DesktopGrid' && dataLoaded && (
        <div className="bg-black py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-7xl font-black uppercase tracking-tight text-white mb-4">
                {props.headline || "Default Headline"}
              </h2>
              <p className="text-white/60 text-xl max-w-2xl mx-auto">{props.subheadline || "Default Subheadline"}</p>
              {props.showRatings && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg className="w-6 h-6" fill={i < Math.floor(avgRating) ? props.accentColor : "#ffffff20"} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-white font-bold text-xl">{avgRating.toFixed(1)}</span>
                  <span className="text-white/40 text-lg">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-8">
              {reviews.slice(0, props.maxReviews || 6).map(review => (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:bg-white/5 hover:border-white/10 transition-all duration-300 group">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg className="w-5 h-5" fill={i < review.rating ? props.accentColor : "#ffffff20"} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  
                  <p className="text-white/70 text-lg leading-relaxed mb-8 italic group-hover:text-white/80 transition-colors">
                    "{review.text}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                      <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{review.author}</div>
                      <div className="text-white/40 text-sm uppercase tracking-wide">{review.location}</div>
                    </div>
                  </div>
                  
                  {review.verified && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <span className="text-xs uppercase tracking-wider text-white/40 flex items-center gap-2">
                        <svg className="w-4 h-4" fill={props.accentColor} viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Verified Purchase
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
    
    </SmartComponentWrapper>
  );
}
