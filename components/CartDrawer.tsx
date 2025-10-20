"use client";

import { useEffect, useState } from "react";
import { X, Trash2, ArrowRight, Store, Truck, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, total, itemCount } = useCart();

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
      {/* Backdrop - Full screen overlay */}
      <div 
        className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        style={{ isolation: 'isolate' }}
      />
      
      {/* Cart Drawer Panel */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a] border-l border-white/10 flex flex-col z-[999]"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', isolation: 'isolate' }}
      >
        {/* Safe Area Top Fill */}
        <div 
          className="absolute top-0 left-0 right-0 bg-[#0a0a0a] pointer-events-none"
          style={{ height: 'env(safe-area-inset-top, 0px)', marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))' }}
        />
        
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-sm tracking-wide">Your Cart</h2>
            <div className="text-white/40 text-xs">({itemCount})</div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white active:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 relative z-10">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 border border-white/10 rounded-lg flex items-center justify-center mb-4">
                <X size={28} className="text-white/20" />
              </div>
              <p className="text-white/50 text-sm mb-6">Your cart is empty</p>
              <Link
                href="/products"
                onClick={onClose}
                className="w-full px-4 py-3 bg-white text-black text-sm text-center hover:bg-white/90 transition-all"
              >
                Shop Products
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={`${item.productId}-${item.tierName}`} 
                className="p-4 bg-[#1a1a1a] mb-2 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 bg-black flex-shrink-0 rounded relative overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <Image
                        src="/logoprint.png"
                        alt="Flora"
                        fill
                        className="object-contain opacity-20 p-2"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm text-white line-clamp-1 flex-1">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 hover:bg-red-500/10 rounded text-white/40 hover:text-red-400 transition-colors"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <p className="text-xs text-white/40 mb-2">{item.tierName}</p>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 flex items-center justify-center bg-black rounded hover:bg-white/10 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={12} className="text-white" />
                        </button>
                        <span className="text-sm text-white min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-black rounded hover:bg-white/10 transition-colors"
                        >
                          <Plus size={12} className="text-white" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-white">${(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Bottom Actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-white/5 relative z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-lg text-white mb-4">
                <span>Total</span>
                <span className="font-medium">${total.toFixed(0)}</span>
              </div>
              
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full px-4 py-3 bg-white text-black text-sm text-center font-medium hover:bg-white/90 transition-all block"
              >
                Checkout
              </Link>
              
              <button
                onClick={onClose}
                className="w-full px-4 py-3 text-white/60 hover:text-white text-sm border border-white/10 transition-all"
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
