
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface ChristmasHolidayShowcaseProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  promoEndDate?: string;
}

export function ChristmasHolidayShowcase({ vendorId, ...props }: ChristmasHolidayShowcaseProps) {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/user/context')
      .then(res => res.json())
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setUser({ device: "desktop", cartAbandoned: false });
      });
  }, [vendorId]);

  const [holidayProducts, setHolidayProducts] = useState(null);
  
  useEffect(() => {
    fetch('/api/products/holiday')
      .then(res => res.json())
      .then(data => {
        setHolidayProducts(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setHolidayProducts({});
      });
  }, [vendorId]);

  const [deals, setDeals] = useState(null);
  
  useEffect(() => {
    fetch('/api/promotions/christmas')
      .then(res => res.json())
      .then(data => {
        setDeals(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setDeals({});
      });
  }, [vendorId]);
  
  // Check if data is loaded
  const dataLoaded = user !== null && holidayProducts !== null && deals !== null;
  
  useEffect(() => {
    if (dataLoaded) {
      setLoading(false);
    }
  }, [dataLoaded]);
  
  
  
  // Quantum state management
  const [activeState, setActiveState] = useState('FirstTimeHoliday');
  
  useEffect(() => {
    // Evaluate conditions and collapse quantum state
    
    if (user?.visits == 1 && user?.season == "holiday") {
      setActiveState('FirstTimeHoliday');
    } else 
    if (user?.visits > 1 && user?.lastPurchase < 30) {
      setActiveState('ReturningHoliday');
    } else 
    if (user?.cartAbandoned && user?.cartValue > 50) {
      setActiveState('HighIntentHoliday');
    }
  }, [props]);
  
  
  return (
    <SmartComponentWrapper 
      componentName="ChristmasHolidayShowcase"
      loading={loading}
      error={error}
    >
      
      <>
        
      {activeState === 'FirstTimeHoliday' && dataLoaded && (
        <div className="relative bg-gradient-to-b from-emerald-950/40 via-black to-black py-16 sm:py-20 md:py-24 px-4 sm:px-6">
          <div className="absolute inset-0 bg-[url('/snowflakes.svg')] opacity-10 animate-pulse"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-block bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
                <span className="text-emerald-400 font-black uppercase text-xs sm:text-sm tracking-tight">🎄 FIRST TIME HOLIDAY OFFER</span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6">
                {props.headline || "Default Headline"}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-8 sm:mb-12 max-w-3xl mx-auto">{props.subheadline || "Default Subheadline"}</p>
              <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-4 sm:p-6 mb-8 sm:mb-12 max-w-2xl mx-auto">
                <p className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-red-400 mb-2">25% OFF FIRST ORDER</p>
                <p className="text-sm sm:text-base text-white/60">Use code: MERRYJANE25</p>
              </div>
              <button className="bg-white text-black px-6 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-2xl font-black uppercase text-sm sm:text-base md:text-lg hover:bg-white/90 transition-all">
                {props.ctaText || "Learn More"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16">
              {holidayProducts.slice(0, 6).map(product => (
                <div key={product.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 hover:border-emerald-500/30 transition-all group">
                  <div className="aspect-square bg-white/5 rounded-xl mb-4 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-emerald-400 font-black uppercase text-xs bg-emerald-500/20 px-3 py-1 rounded-lg">HOLIDAY</span>
                    <span className="text-white/40 text-xs uppercase">{product.strain}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black uppercase text-white mb-2">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl sm:text-3xl font-black text-white">${product.salePrice}</span>
                    <span className="text-base sm:text-lg text-white/40 line-through">${product.price}</span>
                  </div>
                  <button className="w-full bg-emerald-600 text-white py-2 sm:py-3 rounded-xl font-black uppercase text-xs sm:text-sm hover:bg-emerald-500 transition-colors">
                    ADD TO CART
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeState === 'ReturningHoliday' && dataLoaded && (
        <div className="relative bg-gradient-to-b from-red-950/40 via-black to-black py-16 sm:py-20 md:py-24 px-4 sm:px-6">
          <div className="absolute inset-0 bg-[url('/snowflakes.svg')] opacity-10"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-block bg-red-500/20 border border-red-500/30 rounded-2xl px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
                <span className="text-red-400 font-black uppercase text-xs sm:text-sm tracking-tight">🎁 WELCOME BACK</span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6">
                YOUR FAVORITES<br />ARE ON SALE
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-8 sm:mb-12 max-w-3xl mx-auto">Stocking up? Save 15% on your holiday haul</p>
              <button className="bg-red-600 text-white px-6 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-2xl font-black uppercase text-sm sm:text-base md:text-lg hover:bg-red-500 transition-all animate-pulse">
                VIEW YOUR PICKS
              </button>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 md:p-10 mb-12 sm:mb-16">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white mb-2 sm:mb-3">HOLIDAY REWARDS</h3>
                  <p className="text-base sm:text-lg text-white/60">You have {user.loyaltyPoints} points = ${(user.loyaltyPoints * 0.1).toFixed(2)} off</p>
                </div>
                <button className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase text-sm sm:text-base hover:bg-white/90 transition-all whitespace-nowrap">
                  REDEEM NOW
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {deals.map(deal => (
                <div key={deal.id} className="bg-gradient-to-br from-red-900/20 to-emerald-900/20 border border-white/10 rounded-2xl p-4 sm:p-6 text-center hover:border-red-500/30 transition-all">
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3">{deal.icon}</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-white mb-1 sm:mb-2">{deal.discount}</div>
                  <div className="text-xs sm:text-sm text-white/60 uppercase">{deal.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeState === 'HighIntentHoliday' && dataLoaded && (
        <div className="relative bg-gradient-to-b from-amber-950/40 via-black to-black py-16 sm:py-20 md:py-24 px-4 sm:px-6 border-t border-amber-500/20">
          <div className="absolute inset-0 bg-[url('/snowflakes.svg')] opacity-10 animate-pulse"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-block bg-amber-500/20 border border-amber-500/30 rounded-2xl px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 animate-bounce">
                <span className="text-amber-400 font-black uppercase text-xs sm:text-sm tracking-tight">⏰ URGENT: CART EXPIRES SOON</span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-amber-400 mb-4 sm:mb-6">
                DON'T MISS OUT
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-4 sm:mb-6 max-w-3xl mx-auto">Your holiday order is waiting</p>
              <div className="bg-amber-600/20 border border-amber-500/30 rounded-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 max-w-2xl mx-auto">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-amber-400 mb-3 sm:mb-4">EXTRA 20% OFF NOW</p>
                <p className="text-base sm:text-lg text-white/60 mb-4 sm:mb-6">Complete checkout in the next 15 minutes</p>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2" id="countdown">14:59</div>
                <p className="text-xs sm:text-sm text-white/40 uppercase">Limited time offer</p>
              </div>
              <button className="bg-amber-500 text-black px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl font-black uppercase text-base sm:text-lg md:text-xl hover:bg-amber-400 transition-all animate-pulse shadow-lg shadow-amber-500/50">
                COMPLETE ORDER - SAVE 20%
              </button>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white mb-4 sm:mb-6">YOUR CART ({user.cartItems} ITEMS)</h3>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {user.cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 sm:gap-4 bg-white/5 rounded-xl p-3 sm:p-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm sm:text-base font-black uppercase text-white">{item.name}</div>
                      <div className="text-xs sm:text-sm text-white/40">{item.quantity}x ${item.price}</div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 sm:pt-6">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span className="text-sm sm:text-base text-white/60 uppercase">Subtotal:</span>
                  <span className="text-base sm:text-lg text-white font-bold">${user.cartValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span className="text-sm sm:text-base text-amber-400 uppercase font-black">Holiday Discount (20%):</span>
                  <span className="text-base sm:text-lg text-amber-400 font-black">-${(user.cartValue * 0.2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xl sm:text-2xl md:text-3xl font-black uppercase text-white">
                  <span>Total:</span>
                  <span>${(user.cartValue * 0.8).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    
    </SmartComponentWrapper>
  );
}
