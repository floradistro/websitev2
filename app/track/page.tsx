"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Store, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import Link from "next/link";

function TrackContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
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
      <div className="bg-[#1a1a1a] min-h-screen">
        <section className="relative min-h-[80vh] flex items-center justify-center text-white px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Package className="w-16 h-16 mx-auto mb-8 text-white/40" />
            <h1 className="text-4xl md:text-6xl font-light mb-6">Track Your Order</h1>
            <p className="text-base text-white/50 mb-12">
              Enter your order number to check status
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-black border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 transition-all"
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
    <div className="bg-[#1a1a1a]">
      {/* Success Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-white/5 border-2 border-white/20 flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={40} className="text-white/80" />
          </div>
          <h1 className="text-4xl md:text-6xl font-light mb-6 leading-tight">
            Order Confirmed
          </h1>
          <p className="text-lg text-white/60 mb-2">
            Order #{orderId}
          </p>
          <p className="text-sm text-white/40">
            Confirmation sent to {orderData.billing?.email}
          </p>
        </div>
      </section>

      {/* Order Details */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Pickup Items */}
          {pickupItems.length > 0 && (
            <div className="bg-[#3a3a3a] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Store size={20} className="text-white/60" />
                <h2 className="text-sm uppercase tracking-[0.2em] text-white font-normal">In-Store Pickup</h2>
              </div>
              
              <div className="space-y-4">
                {pickupItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0">
                    <div className="w-16 h-16 bg-[#2a2a2a] flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <img src="/logoprint.png" alt="Flora Distro" className="w-full h-full object-contain opacity-20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white mb-1">{item.name}</p>
                      <p className="text-xs text-white/40">{item.tierName} · Qty: {item.quantity}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
                        <MapPin size={12} />
                        <span>{item.locationName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 bg-[#2a2a2a] p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={16} className="text-white/60" />
                  <p className="text-sm text-white">Ready in 1-2 hours</p>
                </div>
                <p className="text-xs text-white/40 font-light">
                  You'll receive notification when ready for pickup
                </p>
              </div>
            </div>
          )}

          {/* Delivery Items */}
          {deliveryItems.length > 0 && (
            <div className="bg-[#3a3a3a] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Truck size={20} className="text-white/60" />
                <h2 className="text-sm uppercase tracking-[0.2em] text-white font-normal">Delivery</h2>
              </div>
              
              <div className="space-y-4">
                {deliveryItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0">
                    <div className="w-16 h-16 bg-[#2a2a2a] flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <img src="/logoprint.png" alt="Flora Distro" className="w-full h-full object-contain opacity-20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white mb-1">{item.name}</p>
                      <p className="text-xs text-white/40">{item.tierName} · Qty: {item.quantity}</p>
                      {item.deliveryAddress && (
                        <p className="text-xs text-white/50 mt-1">
                          {item.deliveryAddress.city}, {item.deliveryAddress.state}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 bg-[#2a2a2a] p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Package size={16} className="text-white/60" />
                  <p className="text-sm text-white">Ships today at 2PM EST</p>
                </div>
                <p className="text-xs text-white/40 font-light">
                  Tracking info sent to your email
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-black text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 transition-all font-medium border border-white/20"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#1a1a1a] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-light text-white/60">Loading...</p>
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
