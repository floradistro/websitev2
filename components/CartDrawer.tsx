"use client";

import { useEffect, useState } from "react";
import { X, Trash2, ArrowRight, Store, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, total, itemCount } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[120]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-full sm:w-[500px] bg-[#2a2a2a]/95 backdrop-blur-xl shadow-2xl z-[121] flex flex-col border-l border-white/10 animate-slideInRight overflow-hidden">
        {/* Header - Fixed */}
        <div className="px-6 py-5 border-b border-white/10 bg-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-light uppercase tracking-[0.2em] text-white">
              Cart ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 transition-colors rounded"
              type="button"
            >
              <X size={20} className="text-white/60 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Items - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-20 h-20 border border-white/10 flex items-center justify-center mb-6">
                <X size={32} className="text-white/20" />
              </div>
              <p className="text-base font-light text-white/50 mb-6">
                Your cart is empty
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-black border border-white/20 text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-black/70 transition-all font-medium"
              >
                <span>Shop Products</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={`${item.productId}-${item.tierName}`} className="p-6 hover:bg-[#333333] transition-colors group border-b border-white/5">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-[#1a1a1a] flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src="/logoprint.png"
                          alt="Flora Distro"
                          className="w-full h-full object-contain opacity-20"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-xs uppercase tracking-[0.15em] font-normal text-white line-clamp-2 flex-1 leading-relaxed">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded flex-shrink-0"
                          type="button"
                        >
                          <Trash2 size={14} className="text-white/40 hover:text-white" />
                        </button>
                      </div>
                      
                      <p className="text-sm font-medium text-white mb-3">${(item.price * item.quantity).toFixed(0)}</p>
                      
                      <p className="text-[10px] text-white/40 mb-2 uppercase tracking-[0.12em]">{item.tierName}</p>
                      
                      {item.orderType && (
                        <div className="flex items-center gap-1 text-[10px] text-white/50">
                          {item.orderType === "pickup" ? (
                            <>
                              <Store size={10} />
                              <span>Pickup: {item.locationName}</span>
                            </>
                          ) : (
                            <>
                              <Truck size={10} />
                              <span>Delivery</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-white/10 bg-[#1a1a1a]/80 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-light text-white">
                <span>Subtotal</span>
                <span>${total.toFixed(0)}</span>
              </div>
              
              <p className="text-[10px] text-white/40 text-center">
                Shipping calculated at checkout
              </p>
              
              <Link
                href="/checkout"
                onClick={onClose}
                className="group block w-full bg-black border border-white/20 text-white text-center px-8 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 hover:border-white/40 transition-all duration-500 font-medium relative overflow-hidden"
              >
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="relative z-10">Checkout</span>
              </Link>
              
              <button
                onClick={onClose}
                type="button"
                className="block w-full text-center text-xs uppercase tracking-wider text-white/50 hover:text-white transition-colors py-2"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
