"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ArrowRight, Store, Truck, Lock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  
  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    zipCode: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const pickupItems = items.filter((item) => item.orderType === "pickup");
  const deliveryItems = items.filter((item) => item.orderType === "delivery");
  const hasPickupItems = pickupItems.length > 0;
  const hasDeliveryItems = deliveryItems.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const orderData = {
      billing: billingInfo,
      payment: paymentInfo,
      items,
      total,
      timestamp: new Date().toISOString(),
    };

    const orderId = Date.now().toString();
    localStorage.setItem(`order-${orderId}`, JSON.stringify(orderData));

    clearCart();

    if (hasPickupItems && !hasDeliveryItems) {
      router.push(`/track?orderId=${orderId}&type=pickup`);
    } else if (hasDeliveryItems && !hasPickupItems) {
      router.push(`/track?orderId=${orderId}&type=delivery`);
    } else {
      router.push(`/track?orderId=${orderId}&type=mixed`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-6">Your cart is empty</h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-black border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 transition-all font-medium"
          >
            <span>Shop Products</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Breadcrumb */}
      <div className="border-b border-white/10 bg-[#1a1a1a]">
        <div className="px-4 py-4">
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 text-xs text-white/60 hover:text-white transition-colors uppercase tracking-wider"
          >
            <ChevronLeft size={14} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="py-0">
        <div className="grid lg:grid-cols-2">
          {/* Left - Forms */}
          <div className="bg-[#2a2a2a] px-8 md:px-12 py-12 space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white mb-6 uppercase tracking-wider">Checkout</h1>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal">Contact Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={billingInfo.firstName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, firstName: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={billingInfo.lastName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, lastName: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal flex items-center gap-2">
                <Lock size={16} className="text-white/60" />
                Payment Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1234 5678 9012 3456"
                    value={paymentInfo.cardNumber}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                    maxLength={19}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      Expiry
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={paymentInfo.expiry}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })}
                      maxLength={5}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      CVV
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      value={paymentInfo.cvv}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                      maxLength={4}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Billing ZIP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="28801"
                    value={paymentInfo.zipCode}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, zipCode: e.target.value })}
                    maxLength={5}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="bg-[#3a3a3a] px-8 md:px-12 py-12">
            <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto scrollbar-hide">
              {items.map((item) => (
                <div key={`${item.productId}-${item.tierName}`} className="flex gap-4 pb-4 border-b border-white/5 last:border-0">
                  <div className="w-16 h-16 bg-[#2a2a2a] flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <img src="/logoprint.png" alt="Flora Distro" className="w-full h-full object-contain opacity-20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs text-white mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-[10px] text-white/40 mb-2">{item.tierName}</p>
                    {item.orderType === "pickup" ? (
                      <div className="flex items-center gap-1 text-[10px] text-white/50 mb-2">
                        <Store size={10} />
                        <span>{item.locationName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-white/50 mb-2">
                        <Truck size={10} />
                        <span>Delivery</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Qty: {item.quantity}</span>
                      <span className="text-xs text-white">${(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span>${total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-lg text-white pt-3 border-t border-white/10 font-medium">
                <span>Total</span>
                <span>${total.toFixed(0)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full mt-8 px-8 py-4 text-xs uppercase tracking-[0.25em] transition-all duration-500 font-medium flex items-center justify-center gap-2 ${
                isProcessing
                  ? "bg-black/40 text-white/60 cursor-not-allowed border border-white/10"
                  : "bg-black text-white hover:bg-black/70 border border-white/20 hover:border-white/40"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  Place Order
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/40">
              <Lock size={10} />
              <span>Secure checkout · SSL encrypted</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
