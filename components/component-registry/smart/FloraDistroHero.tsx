"use client";

import React, { useEffect, useState } from "react";
import {
  SmartComponentWrapper,
  SmartComponentBaseProps,
} from "@/lib/smart-component-base";

export interface FloraDistroHeroProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  ctaPrimaryLink?: string;
  ctaSecondaryLink?: string;
  showTrustBadges?: boolean;
  showFeaturedProducts?: boolean;
}

export function FloraDistroHero({
  vendorId,
  headline = "Flora Distro",
  subheadline = "Premium Cannabis Delivered",
  ctaPrimary = "Shop Now",
  ctaSecondary = "Learn More",
  ctaPrimaryLink = "/shop",
  ctaSecondaryLink = "/about",
  showTrustBadges = false,
  showFeaturedProducts = false,
  animate = true,
  ...props
}: FloraDistroHeroProps) {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [trustBadges, setTrustBadges] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    // Only fetch if features are enabled
    if (showFeaturedProducts || showTrustBadges) {
      setDataLoading(true);

      const fetchPromises = [];

      if (showFeaturedProducts) {
        fetchPromises.push(
          fetch("/api/products/featured?limit=3")
            .then((res) => res.json())
            .then((data) =>
              setFeaturedProducts(Array.isArray(data) ? data : []),
            )
            .catch(() => setFeaturedProducts([])),
        );
      }

      if (showTrustBadges) {
        fetchPromises.push(
          fetch("/api/trust-indicators")
            .then((res) => res.json())
            .then((data) => setTrustBadges(Array.isArray(data) ? data : []))
            .catch(() => setTrustBadges([])),
        );
      }

      Promise.all(fetchPromises).finally(() => setDataLoading(false));
    }
  }, [vendorId, showFeaturedProducts, showTrustBadges]);

  // Quantum state management
  const [activeState, setActiveState] = useState("Desktop");

  useEffect(() => {
    // Detect device type for quantum state selection
    const isMobile = window.innerWidth < 768;
    const device = isMobile ? "mobile" : "desktop";

    if (device == "mobile") {
      setActiveState("Mobile");
    } else if (device == "desktop") {
      setActiveState("Desktop");
    }
  }, []);

  return (
    <SmartComponentWrapper componentName="FloraDistroHero" animate={animate}>
      <>
        {activeState === "Mobile" && (
          <div className="relative min-h-screen bg-black overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-black to-black"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent"></div>

            <div className="relative z-10 px-4 pt-20 pb-16">
              <div className="max-w-2xl mx-auto text-center">
                <div className="inline-block mb-6 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-wider">
                    Premium Cannabis
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-white mb-6 leading-[0.9]">
                  {headline}
                </h1>

                <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-xl mx-auto">
                  {subheadline}
                </p>

                <div className="flex flex-col gap-4 mb-12">
                  <a
                    href={ctaPrimaryLink}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl px-8 py-4 font-black uppercase tracking-tight text-sm transition-all duration-300 shadow-lg shadow-emerald-500/20"
                  >
                    {ctaPrimary}
                  </a>
                  <a
                    href={ctaSecondaryLink}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-2xl px-8 py-4 font-black uppercase tracking-tight text-sm transition-all duration-300"
                  >
                    {ctaSecondary}
                  </a>
                </div>

                {showTrustBadges && trustBadges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-6 mb-12">
                    {trustBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-12 h-12 bg-white/5 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">{badge.icon}</span>
                        </div>
                        <span className="text-white/40 text-xs uppercase font-bold tracking-wide">
                          {badge.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {showFeaturedProducts && featuredProducts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-white/40 text-xs font-black uppercase tracking-wider mb-4">
                      Featured Products
                    </h3>
                    {featuredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-2xl p-4 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 rounded-xl object-cover bg-white/5"
                          />
                          <div className="flex-1 text-left">
                            <h4 className="text-white font-black uppercase text-sm mb-1">
                              {product.name}
                            </h4>
                            <p className="text-white/40 text-xs mb-2">
                              {product.strain}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-black text-lg">
                                ${product.price}
                              </span>
                              <span className="text-white/40 text-xs">
                                {product.thc}% THC
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeState === "Desktop" && (
          <div className="relative min-h-screen bg-black overflow-hidden flex items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-black to-black"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/5 to-transparent"></div>

            <div className="relative z-10 w-full px-8 py-20">
              <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <div className="inline-block px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="text-emerald-400 text-sm font-black uppercase tracking-wider">
                      Premium Cannabis
                    </span>
                  </div>

                  <h1 className="text-7xl xl:text-8xl font-black uppercase tracking-tight text-white leading-[0.85]">
                    {headline}
                  </h1>

                  <p className="text-xl text-white/60 leading-relaxed max-w-lg">
                    {subheadline}
                  </p>

                  <div className="flex gap-4 pt-4">
                    <a
                      href={ctaPrimaryLink}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl px-10 py-5 font-black uppercase tracking-tight text-base transition-all duration-300 shadow-2xl shadow-emerald-500/30 hover:scale-105"
                    >
                      {ctaPrimary}
                    </a>
                    <a
                      href={ctaSecondaryLink}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-2xl px-10 py-5 font-black uppercase tracking-tight text-base transition-all duration-300"
                    >
                      {ctaSecondary}
                    </a>
                  </div>

                  {showTrustBadges && trustBadges.length > 0 && (
                    <div className="flex gap-8 pt-8">
                      {trustBadges.map((badge) => (
                        <div key={badge.id} className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-white/5 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-3xl">{badge.icon}</span>
                          </div>
                          <span className="text-white/60 text-sm uppercase font-bold tracking-wide">
                            {badge.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showFeaturedProducts && featuredProducts.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-white/40 text-sm font-black uppercase tracking-wider mb-6">
                      Featured Collection
                    </h3>
                    <div className="grid gap-6">
                      {featuredProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="group bg-white/5 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-500 hover:bg-white/10 hover:scale-105"
                          style={{ transitionDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-28 h-28 rounded-2xl object-cover bg-white/5"
                              />
                              <div className="absolute -top-2 -right-2 bg-emerald-500 text-black text-xs font-black uppercase px-3 py-1 rounded-full">
                                New
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-black uppercase text-xl mb-2 group-hover:text-emerald-400 transition-colors">
                                {product.name}
                              </h4>
                              <p className="text-white/40 text-sm mb-3">
                                {product.strain}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-emerald-400 font-black text-2xl">
                                    ${product.price}
                                  </span>
                                  <span className="text-white/40 text-sm">
                                    /3.5g
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/40 font-bold uppercase">
                                  <span className="bg-white/5 px-3 py-1 rounded-lg">
                                    {product.thc}% THC
                                  </span>
                                  <span className="bg-white/5 px-3 py-1 rounded-lg">
                                    {product.cbd}% CBD
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    </SmartComponentWrapper>
  );
}
