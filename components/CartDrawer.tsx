"use client";

import { useEffect, useState } from "react";
import { X, Trash2, ArrowRight, Store, Truck, Plus, Minus, Edit3 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, total, itemCount } = useCart();
  const [editingItem, setEditingItem] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll completely for PWA mode
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = "0";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.bottom = "0";
      document.body.style.width = "100%";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Prevent iOS overscroll
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.position = "fixed";
      document.documentElement.style.width = "100%";
      document.documentElement.style.height = "100%";
    } else {
      // Restore scroll
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.bottom = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
      
      document.documentElement.style.overflow = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width = "";
      document.documentElement.style.height = "";
    }
    
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.bottom = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
      
      document.documentElement.style.overflow = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width = "";
      document.documentElement.style.height = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />

      {/* Drawer - With Safe Area Support */}
      <div 
        className="absolute right-0 w-full sm:w-[500px] bg-[#2a2a2a] shadow-2xl flex flex-col border-l border-white/10 animate-slideInRight"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          height: '100%',
          maxHeight: '100vh',
          overflowY: 'hidden'
        }}
      >
        {/* Safe Area Top Fill - extends into iOS notch area */}
        <div 
          className="absolute top-0 left-0 right-0 bg-[#2a2a2a] pointer-events-none"
          style={{ 
            height: 'env(safe-area-inset-top, 0px)', 
            marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))'
          }}
        />
        
        {/* Header - Fixed with safe area */}
        <div 
          className="px-5 border-b border-white/10 bg-[#2a2a2a] flex-shrink-0 relative z-10"
          style={{ 
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
            paddingBottom: '1rem'
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-light uppercase tracking-[0.2em] text-white">
              Cart ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 active:bg-white/20 transition-all rounded-full click-feedback group min-w-[44px] min-h-[44px] flex items-center justify-center"
              type="button"
              aria-label="Close cart"
            >
              <X size={20} className="text-white/70 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Items - Scrollable with momentum */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden bg-[#2a2a2a] relative z-10"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            minHeight: 0,
            flex: '1 1 0',
            touchAction: 'pan-y'
          }}
        >
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-20 h-20 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
                <X size={32} className="text-white/20" />
              </div>
              <p className="text-lg font-light text-white/50 mb-8">
                Your cart is empty
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="interactive-button inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-white/90 active:scale-95 font-medium rounded-xl min-h-[52px] transition-all"
              >
                <span>Shop Products</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {items.map((item) => (
                <div 
                  key={`${item.productId}-${item.tierName}`} 
                  className="p-5 hover:bg-[#333333]/50 active:bg-[#333333] transition-colors group"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-24 bg-[#1a1a1a] flex-shrink-0 rounded-xl relative overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                          loading="lazy"
                        />
                      ) : (
                        <Image
                          src="/yacht-club-logo.png"
                          alt="Yacht Club"
                          fill
                          className="object-contain opacity-20 p-2"
                          loading="lazy"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-normal text-white line-clamp-2 flex-1 leading-relaxed">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-2 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg flex-shrink-0 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                          type="button"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} className="text-white/40 hover:text-red-400 transition-colors" />
                        </button>
                      </div>
                      
                      <p className="text-[11px] text-white/40 mb-3 uppercase tracking-wider">{item.tierName}</p>
                      
                      {item.orderType && (
                        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-3">
                          {item.orderType === "pickup" ? (
                            <>
                              <Store size={12} />
                              <span className="truncate">{item.locationName}</span>
                            </>
                          ) : (
                            <>
                              <Truck size={12} />
                              <span>Delivery</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Quantity Controls & Price */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} className="text-white" />
                          </button>
                          <span className="text-sm font-medium text-white min-w-[24px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                            type="button"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} className="text-white" />
                          </button>
                        </div>
                        <p className="text-base font-semibold text-white">${(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed with safe area */}
        {items.length > 0 && (
          <div 
            className="px-5 border-t border-white/10 bg-[#1a1a1a] flex-shrink-0 relative z-10" 
            style={{ 
              paddingTop: '1.25rem',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)'
            }}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xl font-medium text-white">
                <span>Subtotal</span>
                <span>${total.toFixed(0)}</span>
              </div>
              
              <p className="text-[11px] text-white/40 text-center">
                Shipping & taxes calculated at checkout
              </p>
              
              <Link
                href="/checkout"
                onClick={onClose}
                className="interactive-button group block w-full bg-white text-black text-center px-8 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/90 active:scale-[0.98] font-semibold rounded-xl transition-all"
                style={{ minHeight: '56px' }}
              >
                <span className="relative z-10">Checkout</span>
              </Link>
              
              <button
                onClick={onClose}
                type="button"
                className="block w-full text-center text-sm text-white/60 hover:text-white transition-colors py-3 min-h-[44px]"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
