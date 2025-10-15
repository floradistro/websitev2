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

  // Group items by order type
  const pickupItems = items.filter((item) => item.orderType === "pickup");
  const deliveryItems = items.filter((item) => item.orderType === "delivery");
  const hasPickupItems = pickupItems.length > 0;
  const hasDeliveryItems = deliveryItems.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create order data
    const orderData = {
      billing: billingInfo,
      payment: paymentInfo,
      items,
      total,
      timestamp: new Date().toISOString(),
    };

    console.log("Order placed:", orderData);

    // Save order to localStorage for tracking
    const orderId = Date.now().toString();
    localStorage.setItem(`order-${orderId}`, JSON.stringify(orderData));

    // Clear cart
    clearCart();

    // Redirect based on order type
    if (hasPickupItems && !hasDeliveryItems) {
      router.push(`/track?orderId=${orderId}&type=pickup`);
    } else if (hasDeliveryItems && !hasPickupItems) {
      router.push(`/track?orderId=${orderId}&type=delivery`);
    } else {
      // Mixed order - both pickup and delivery
      router.push(`/track?orderId=${orderId}&type=mixed`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#b5b5b2] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Your cart is empty</h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs uppercase tracking-wider hover:bg-black/90 transition-all"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#b5b5b2]">
      {/* Header */}
      <div className="border-b border-[#a8a8a5] bg-[#c5c5c2]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 text-sm hover:opacity-60 transition-all font-light"
          >
            <ChevronLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Forms */}
          <div className="space-y-8">
            {/* Order Type Summary */}
            <div className="bg-white/60 backdrop-blur-sm p-6 space-y-3">
              <h2 className="text-lg font-light uppercase tracking-wider mb-4">Order Summary</h2>
              {hasPickupItems && (
                <div className="flex items-center gap-3 text-sm font-light">
                  <Store size={16} className="text-black/60" />
                  <span>{pickupItems.length} item{pickupItems.length > 1 ? "s" : ""} for in-store pickup</span>
                </div>
              )}
              {hasDeliveryItems && (
                <div className="flex items-center gap-3 text-sm font-light">
                  <Truck size={16} className="text-black/60" />
                  <span>{deliveryItems.length} item{deliveryItems.length > 1 ? "s" : ""} for delivery</span>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white/60 backdrop-blur-sm p-6">
              <h2 className="text-lg font-light uppercase tracking-wider mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={billingInfo.firstName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, firstName: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={billingInfo.lastName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, lastName: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white/60 backdrop-blur-sm p-6">
              <h2 className="text-lg font-light uppercase tracking-wider mb-6 flex items-center gap-2">
                <Lock size={18} className="text-black/60" />
                Payment Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1234 5678 9012 3456"
                    value={paymentInfo.cardNumber}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                    maxLength={19}
                    className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={paymentInfo.expiry}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })}
                      maxLength={5}
                      className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                      CVV
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      value={paymentInfo.cvv}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                      maxLength={4}
                      className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-2 text-black/70">
                    Billing ZIP Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="28801"
                    value={paymentInfo.zipCode}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, zipCode: e.target.value })}
                    maxLength={5}
                    className="w-full px-4 py-3 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
            <div className="bg-white/80 backdrop-blur-sm p-6">
              <h2 className="text-lg font-light uppercase tracking-wider mb-6">Your Order</h2>
              
              {/* Cart Items */}
              <div className="divide-y divide-black/5 mb-6">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.tierName}`} className="py-4 first:pt-0">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-[#f5f5f2] flex-shrink-0 flex items-center justify-center">
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
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-light mb-1 line-clamp-2">{item.name}</h3>
                        <p className="text-xs text-black/50 mb-1">{item.tierName}</p>
                        <div className="flex items-center gap-2">
                          {item.orderType === "pickup" ? (
                            <div className="flex items-center gap-1 text-xs text-black/60">
                              <Store size={12} />
                              <span>{item.locationName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-black/60">
                              <Truck size={12} />
                              <span>Delivery</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-black/50">Qty: {item.quantity}</span>
                          <span className="text-sm font-light">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-4 border-t border-black/10">
                <div className="flex justify-between text-sm font-light">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-light">
                  <span>Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-light text-black/60">
                  <span>Tax</span>
                  <span>Calculated at final step</span>
                </div>
                <div className="flex justify-between text-lg font-light pt-3 border-t border-black/10">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full mt-6 px-8 py-4 text-xs uppercase tracking-[0.2em] transition-all duration-300 font-medium flex items-center justify-center gap-2 ${
                  isProcessing
                    ? "bg-black/40 text-white/60 cursor-not-allowed"
                    : "bg-black text-white hover:bg-black/90 shadow-elevated hover:shadow-elevated-lg"
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
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-black/50">
                <Lock size={12} />
                <span>Secure checkout · SSL encrypted</span>
              </div>
            </div>

            {/* Order Type Info */}
            {(hasPickupItems || hasDeliveryItems) && (
              <div className="bg-[#8a8a87] text-white p-6">
                <h3 className="text-sm uppercase tracking-wider mb-4 font-medium">
                  After Checkout
                </h3>
                <div className="space-y-3 text-sm font-light">
                  {hasPickupItems && (
                    <div className="flex items-start gap-3">
                      <Store size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">In-Store Pickup</p>
                        <p className="text-xs text-white/80">
                          You'll receive a notification when your order is ready for pickup
                        </p>
                      </div>
                    </div>
                  )}
                  {hasDeliveryItems && (
                    <div className="flex items-start gap-3">
                      <Truck size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">Delivery</p>
                        <p className="text-xs text-white/80">
                          Track your shipment with real-time updates
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

