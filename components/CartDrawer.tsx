"use client";

import { useEffect } from "react";
import { X, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <h2 className="text-lg font-light uppercase tracking-wider">
            Shopping Bag ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 transition-colors rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mb-4">
                <X size={32} className="text-black/20" />
              </div>
              <p className="text-base font-light text-black/60 mb-6">
                Your bag is empty
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs uppercase tracking-wider hover:bg-black/90 transition-all"
              >
                <span>Continue Shopping</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {items.map((item) => (
                <div key={`${item.productId}-${item.tierName}`} className="p-6 group hover:bg-black/[0.02] transition-colors">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-[#f5f5f2] flex-shrink-0 flex items-center justify-center">
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
                          className="w-full h-full object-contain opacity-40"
                        />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-light mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-xs text-black/50 mb-2">{item.tierName}</p>
                      
                      {item.orderType && (
                        <p className="text-xs text-black/50 mb-2 capitalize">
                          {item.orderType === "pickup" 
                            ? `Pickup: ${item.locationName || "Store"}` 
                            : "Delivery"}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center border border-black/10 hover:border-black transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-light w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center border border-black/10 hover:border-black transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Price */}
                        <p className="text-sm font-light">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-black/5 rounded-full h-fit"
                    >
                      <Trash2 size={16} className="text-black/40 hover:text-black transition-colors" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-black/5 p-6 space-y-4 bg-[#fafafa]">
            <div className="flex justify-between items-center text-lg font-light">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-black/50 text-center">
              Shipping and taxes calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-black text-white text-center px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-black/90 transition-all font-medium"
            >
              Checkout
            </Link>
            <button
              onClick={onClose}
              className="block w-full text-center text-xs uppercase tracking-wider text-black/60 hover:text-black transition-colors py-2"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

