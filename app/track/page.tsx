"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Package, Store, Truck, CheckCircle, Clock, MapPin, Calendar, CreditCard, Mail } from "lucide-react";
import Link from "next/link";
import OrderTracking from "@/components/OrderTracking";
import Image from "next/image";

function TrackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderData, setOrderData] = useState<any>(null);
  const [orderInput, setOrderInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      setError(null);
      // Fetch real order from WooCommerce
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.order) {
            setOrderData(data.order);
          } else {
            setError("Order not found");
          }
        })
        .catch(err => {
          console.error('Failed to fetch order:', err);
          setError("Failed to load order details");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [orderId]);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderInput.trim()) {
      router.push(`/track?orderId=${orderInput.trim()}`);
    }
  };

  if (!orderId || !orderData) {
    return (
      <div 
        className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
        style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
      >
        <section className="relative min-h-[80vh] flex items-center justify-center text-white px-4 pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <Package className="w-16 h-16 mx-auto mb-8 text-white/40" />
            <h1 className="text-4xl md:text-6xl font-light mb-6">Track Your Order</h1>
            <p className="text-base text-white/50 mb-12">
              Enter your order number to check status
            </p>
            
            {/* Order Tracking Form */}
            <form onSubmit={handleTrackOrder} className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  placeholder="Order number"
                  className="flex-1 px-6 py-4 bg-[#2a2a2a] border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-black border border-white/20 text-white text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all font-medium"
                >
                  Track
                </button>
              </div>
            </form>

            {error && (
              <div className="mb-8 text-red-400 text-sm">{error}</div>
            )}

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

  if (loading) {
    return (
      <div 
        className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full flex items-center justify-center pt-20"
        style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-light text-white/60">Loading order details...</p>
        </div>
      </div>
    );
  }

  const pickupItems = orderData.line_items?.filter((item: any) => 
    item.meta_data?.find((m: any) => m.key === 'order_type')?.value === "pickup"
  ) || [];
  
  const deliveryItems = orderData.line_items?.filter((item: any) => 
    item.meta_data?.find((m: any) => m.key === 'order_type')?.value === "delivery"
  ) || [];
  
  const hasDelivery = deliveryItems.length > 0;
  const hasPickup = pickupItems.length > 0;
  const primaryOrderType = hasDelivery ? "delivery" : "pickup";
  const pickupLocation = pickupItems.length > 0 
    ? pickupItems[0].meta_data?.find((m: any) => m.key === 'pickup_location_name')?.value 
    : null;

  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Order Header */}
      <section className="relative bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] border-b border-white/10 px-4 pt-20 pb-12">
        <div className="max-w-5xl mx-auto">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-smooth mb-6"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3 font-medium">
                Order Details
              </p>
              <h1 className="text-3xl md:text-4xl font-light text-white mb-3 tracking-tight">
                Order #{orderData.number || orderId}
              </h1>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>
                    {new Date(orderData.date_created).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {orderData.billing?.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span>{orderData.billing.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-[#2a2a2a] border border-white/10 p-6 min-w-[200px]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                Order Total
              </p>
              <p className="text-3xl font-light text-white mb-2">
                ${parseFloat(orderData.total).toFixed(2)}
              </p>
              {orderData.payment_method_title && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <CreditCard size={12} />
                  <span>{orderData.payment_method_title}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Order Tracking & Details */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Order Tracking Timeline */}
          <OrderTracking
            orderStatus={orderData.status}
            orderType={primaryOrderType}
            dateCreated={orderData.date_created}
            dateCompleted={orderData.date_completed}
            dateShipped={orderData.date_modified}
            pickupLocation={pickupLocation}
          />

          {/* Order Items */}
          <div className="space-y-6">
            {/* Delivery Items */}
            {deliveryItems.length > 0 && (
              <div className="bg-[#2a2a2a] border border-white/10">
                <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
                  <Truck size={18} className="text-white/60" />
                  <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">
                    Delivery Items ({deliveryItems.length})
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Shipping Address */}
                  {orderData.shipping && orderData.shipping.address_1 && (
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                        Shipping Address
                      </p>
                      <div className="text-sm text-white/70 space-y-1">
                        <p className="text-white font-medium">
                          {orderData.shipping.first_name} {orderData.shipping.last_name}
                        </p>
                        <p>{orderData.shipping.address_1}</p>
                        {orderData.shipping.address_2 && <p>{orderData.shipping.address_2}</p>}
                        <p>
                          {orderData.shipping.city}, {orderData.shipping.state} {orderData.shipping.postcode}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {deliveryItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0">
                        <div className="relative w-20 h-20 bg-[#3a3a3a] flex-shrink-0">
                          {item.image?.src ? (
                            <Image
                              src={item.image.src}
                              alt={item.name}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image
                                src="/logoprint.png"
                                alt="Flora Distro"
                                width={30}
                                height={30}
                                className="opacity-20"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white mb-2">{item.name}</p>
                          <div className="flex items-center gap-4 text-xs text-white/60">
                            <span>Qty: {item.quantity}</span>
                            <span>${parseFloat(item.price).toFixed(2)} each</span>
                          </div>
                          {item.meta_data?.find((m: any) => m.key === 'tier_name')?.value && (
                            <p className="text-xs text-white/40 mt-1">
                              {item.meta_data.find((m: any) => m.key === 'tier_name').value}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-base font-light text-white">
                            ${parseFloat(item.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Items */}
            {pickupItems.length > 0 && (
              <div className="bg-[#2a2a2a] border border-white/10">
                <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
                  <Store size={18} className="text-white/60" />
                  <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">
                    Pickup Items ({pickupItems.length})
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Pickup Location */}
                  {pickupLocation && (
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                        Pickup Location
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white">
                        <MapPin size={16} className="text-white/60" />
                        <span>{pickupLocation}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {pickupItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0">
                        <div className="relative w-20 h-20 bg-[#3a3a3a] flex-shrink-0">
                          {item.image?.src ? (
                            <Image
                              src={item.image.src}
                              alt={item.name}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image
                                src="/logoprint.png"
                                alt="Flora Distro"
                                width={30}
                                height={30}
                                className="opacity-20"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white mb-2">{item.name}</p>
                          <div className="flex items-center gap-4 text-xs text-white/60">
                            <span>Qty: {item.quantity}</span>
                            <span>${parseFloat(item.price).toFixed(2)} each</span>
                          </div>
                          {item.meta_data?.find((m: any) => m.key === 'tier_name')?.value && (
                            <p className="text-xs text-white/40 mt-1">
                              {item.meta_data.find((m: any) => m.key === 'tier_name').value}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-base font-light text-white">
                            ${parseFloat(item.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-[#2a2a2a] border border-white/10 p-6">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white font-medium mb-6">
              Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">${parseFloat(orderData.total).toFixed(2)}</span>
              </div>
              {orderData.shipping_lines && orderData.shipping_lines.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Shipping</span>
                  <span className="text-white">
                    ${parseFloat(orderData.shipping_lines[0].total).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-white/10 flex justify-between">
                <span className="text-base text-white font-medium">Total</span>
                <span className="text-xl font-light text-white">
                  ${parseFloat(orderData.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
            >
              Continue Shopping
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-black border border-white/20 text-white px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-all font-medium"
            >
              Contact Support
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
