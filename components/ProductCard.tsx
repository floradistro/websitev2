"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Store, Truck, Eye } from "lucide-react";

interface ProductCardProps {
  product: any;
  index: number;
  locations: any[];
}

export default function ProductCard({ product, index, locations }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.id}`;
  };

  const handlePickup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.id}?type=pickup`;
  };

  const handleDelivery = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.id}?type=delivery`;
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] mb-3 overflow-hidden bg-[#9a9a97] shadow-sm group-hover:shadow-lg transition-all duration-500">
        {product.images?.[0] ? (
          <>
            {/* Main Image */}
            <img
              src={product.images[0].src}
              alt={product.name}
              className="w-full h-full object-contain transition-all duration-700 ease-out group-hover:scale-110"
            />
          </>
        ) : (
          <>
            {/* Logo Fallback */}
            <div className="w-full h-full flex items-center justify-center p-8 bg-[#b5b5b2]">
              <img
                src="/logoprint.png"
                alt="Flora Distro"
                className="w-full h-full object-contain opacity-40 transition-opacity duration-300 group-hover:opacity-60"
              />
            </div>
          </>
        )}

        {/* Quick Actions Overlay - Desktop */}
        <div className={`hidden md:flex absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent items-end justify-center pb-6 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleQuickBuy}
              className="flex items-center gap-2 bg-white text-black px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-white/90 transition-all font-medium shadow-lg"
            >
              <ShoppingBag size={14} />
              <span>Quick Buy</span>
            </button>
            
            <button
              onClick={handlePickup}
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white px-3 py-2.5 hover:bg-white/20 transition-all shadow-lg border border-white/20 text-xs uppercase tracking-wider font-medium"
            >
              <Store size={14} />
              <span>Pickup</span>
            </button>
            
            <button
              onClick={handleDelivery}
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white px-3 py-2.5 hover:bg-white/20 transition-all shadow-lg border border-white/20 text-xs uppercase tracking-wider font-medium"
            >
              <Truck size={14} />
              <span>Delivery</span>
            </button>
          </div>
        </div>

        {/* View Details Button - Mobile */}
        <div className="md:hidden absolute bottom-3 right-3 opacity-0 group-active:opacity-100 transition-opacity duration-200">
          <div className="bg-white/90 backdrop-blur-sm p-2 shadow-lg">
            <Eye size={16} />
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-1 px-2 md:px-3 transform transition-transform duration-300 group-hover:translate-x-1">
        <h3 className="text-xs md:text-sm leading-tight line-clamp-2 font-light group-hover:opacity-60 transition-opacity duration-200">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-xs md:text-sm font-light">
            ${product.price ? parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
          </p>
          
          {/* Availability Indicator */}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-black/50 uppercase tracking-wider">Available</span>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions - Bottom Sheet Style */}
      <div className="md:hidden mt-2 px-2 space-y-1.5 opacity-0 group-active:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleQuickBuy}
          className="w-full flex items-center justify-center gap-2 bg-black text-white px-3 py-2 text-[10px] uppercase tracking-wider"
        >
          <ShoppingBag size={12} />
          Quick Buy
        </button>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handlePickup}
            className="flex items-center justify-center gap-1.5 bg-white/80 text-black px-3 py-2 text-[10px] uppercase tracking-wider border border-black/10"
          >
            <Store size={12} />
            Pickup
          </button>
          <button
            onClick={handleDelivery}
            className="flex items-center justify-center gap-1.5 bg-white/80 text-black px-3 py-2 text-[10px] uppercase tracking-wider border border-black/10"
          >
            <Truck size={12} />
            Delivery
          </button>
        </div>
      </div>
    </Link>
  );
}

