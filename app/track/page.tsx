"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Store, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import Link from "next/link";

export default function TrackPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderType = searchParams.get("type");
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      const savedOrder = localStorage.getItem(`order-${orderId}`);
      if (savedOrder) {
        setOrderData(JSON.parse(savedOrder));
      }
    }
  }, [orderId]);

  if (!orderId || !orderData) {
    return (
      <div className="min-h-screen bg-[#b5b5b2]">
        <section className="bg-gradient-to-br from-black via-[#1a1a1a] to-black text-white py-20 md:py-32 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-light mb-4 leading-tight">Track Your Order</h1>
            <p className="text-base md:text-lg font-light text-white/60 max-w-2xl mx-auto mb-8">
              Enter your order number to check the status
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const pickupItems = orderData.items?.filter((item: any) => item.orderType === "pickup") || [];
  const deliveryItems = orderData.items?.filter((item: any) => item.orderType === "delivery") || [];

  return (
    <div className="min-h-screen">
      {/* Success Hero */}
      <section className="bg-gradient-to-br from-[#2d5016] via-[#3a6b1f] to-[#2d5016] text-white py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 animate-scaleIn">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-light mb-4 leading-tight animate-fadeIn">
            Order Confirmed
          </h1>
          <p className="text-lg font-light text-white/80 mb-2 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Order #{orderId}
          </p>
          <p className="text-sm font-light text-white/60 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Confirmation sent to {orderData.billing?.email}
          </p>
        </div>
      </section>

      {/* Order Details */}
      <section className="bg-[#b5b5b2] py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Pickup Items */}
          {pickupItems.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3 mb-6">
                <Store size={24} className="text-black/60" />
                <h2 className="text-xl font-light uppercase tracking-wider">In-Store Pickup</h2>
              </div>
              
              <div className="space-y-4">
                {pickupItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-black/5 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-[#f5f5f2] flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <img src="/logoprint.png" alt="Flora Distro" className="w-full h-full object-contain opacity-40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-light mb-1">{item.name}</p>
                      <p className="text-xs text-black/50">{item.tierName} · Qty: {item.quantity}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-black/60">
                        <MapPin size={12} />
                        <span>{item.locationName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-black/10 bg-[#f5f5f2] p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={18} className="text-black/60" />
                  <p className="text-sm font-medium">Ready in 1-2 hours</p>
                </div>
                <p className="text-xs text-black/60 font-light">
                  We'll send you a notification when your order is ready for pickup
                </p>
              </div>
            </div>
          )}

          {/* Delivery Items */}
          {deliveryItems.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3 mb-6">
                <Truck size={24} className="text-black/60" />
                <h2 className="text-xl font-light uppercase tracking-wider">Delivery</h2>
              </div>
              
              <div className="space-y-4">
                {deliveryItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-black/5 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-[#f5f5f2] flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <img src="/logoprint.png" alt="Flora Distro" className="w-full h-full object-contain opacity-40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-light mb-1">{item.name}</p>
                      <p className="text-xs text-black/50">{item.tierName} · Qty: {item.quantity}</p>
                      {item.deliveryAddress && (
                        <p className="text-xs text-black/60 mt-1">
                          {item.deliveryAddress.city}, {item.deliveryAddress.state}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-black/10 bg-[#f5f5f2] p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Package size={18} className="text-black/60" />
                  <p className="text-sm font-medium">Ships today at 2PM EST</p>
                </div>
                <p className="text-xs text-black/60 font-light">
                  Regional delivery: 1-2 business days · Tracking info will be sent to your email
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-xs uppercase tracking-wider hover:bg-black/90 transition-all font-medium"
            >
              Continue Shopping
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white/80 text-black px-8 py-4 text-xs uppercase tracking-wider hover:bg-white transition-all font-medium border border-black/10"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
