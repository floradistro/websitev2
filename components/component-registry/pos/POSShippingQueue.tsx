'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { POSModal } from './POSModal';
import { Package, MapPin, Truck } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
}

interface ShippingAddress {
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface ShippingOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customers: Customer;
  order_items: OrderItem[];
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  payment_status: string;
  payment_method: string | null;
  fulfillment_status: string;
  created_at: string;
  shipped_date: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_carrier: string | null;
  shipping_address: ShippingAddress;
  shipping_method_title: string | null;
  metadata: any;
}

interface POSShippingQueueProps {
  locationId?: string;
  vendorId?: string;
  locationName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableSound?: boolean;
}

export function POSShippingQueue({
  locationId,
  vendorId,
  locationName = 'All Locations',
  autoRefresh = true,
  refreshInterval = 30,
  enableSound = true,
}: POSShippingQueueProps) {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
    trackingNumber: string;
    carrier: string;
  } | null>(null);
  const [modal, setModal] = useState<{isOpen: boolean; title: string; message: string; type: 'success'|'error'|'info'}>({ 
    isOpen: false, title: '', message: '', type: 'info' 
  });

  // Load shipping orders via API
  const loadShippingOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (locationId) params.append('locationId', locationId);
      if (vendorId) params.append('vendorId', vendorId);
      
      const response = await fetch(`/api/pos/orders/shipping?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load orders');
      }

      const { orders } = await response.json();
      setOrders(orders as ShippingOrder[] || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading shipping orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [locationId, vendorId]);

  // Initial load
  useEffect(() => {
    loadShippingOrders();
  }, [loadShippingOrders]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadShippingOrders();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadShippingOrders]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`shipping-orders-${locationId || vendorId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('🆕 New shipping order received!', payload);
          loadShippingOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order updated:', payload);
          loadShippingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, vendorId, loadShippingOrders]);

  // Mark as shipped
  const markAsShipped = async (orderId: string, orderNumber: string, trackingNumber: string, carrier: string) => {
    if (shipping) return;

    setShipping(orderId);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          fulfillment_status: 'fulfilled',
          shipped_date: new Date().toISOString(),
          tracking_number: trackingNumber || null,
          shipping_carrier: carrier || null,
        })
        .eq('id', orderId);

      if (error) throw error;

      // Remove from queue
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setTrackingModal(null);

      // Show success message
      setModal({
        isOpen: true,
        title: 'Order Shipped',
        message: `Order ${orderNumber} has been marked as shipped!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error marking order as shipped:', err);
      setModal({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to update order',
        type: 'error',
      });
    } finally {
      setShipping(null);
    }
  };

  // Format address
  const formatAddress = (address: ShippingAddress) => {
    if (!address) return 'No address provided';
    
    const parts = [
      address.address_1,
      address.address_2,
      address.city,
      address.state,
      address.postcode,
    ].filter(Boolean);

    return parts.join(', ');
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/40 text-lg">Loading shipping orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 m-6">
        <div className="text-red-500 font-bold mb-2">Error Loading Orders</div>
        <div className="text-white/60">{error}</div>
        <button
          onClick={() => loadShippingOrders()}
          className="mt-4 px-4 py-2 bg-white text-black font-black uppercase rounded-xl text-sm hover:bg-white/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <POSModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* Tracking Number Modal */}
      {trackingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-black text-white uppercase mb-4" style={{ fontWeight: 900 }}>
              Mark as Shipped
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Order #{trackingModal.orderNumber}
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">
                  Carrier
                </label>
                <input
                  type="text"
                  value={trackingModal.carrier}
                  onChange={(e) => setTrackingModal({ ...trackingModal, carrier: e.target.value })}
                  placeholder="USPS, UPS, FedEx..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
              
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">
                  Tracking Number (Optional)
                </label>
                <input
                  type="text"
                  value={trackingModal.trackingNumber}
                  onChange={(e) => setTrackingModal({ ...trackingModal, trackingNumber: e.target.value })}
                  placeholder="Enter tracking number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => markAsShipped(
                  trackingModal.orderId,
                  trackingModal.orderNumber,
                  trackingModal.trackingNumber,
                  trackingModal.carrier
                )}
                disabled={shipping === trackingModal.orderId || !trackingModal.carrier}
                className="flex-1 bg-white text-black font-black uppercase py-3 rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 900 }}
              >
                {shipping === trackingModal.orderId ? 'Updating...' : 'Confirm Shipment'}
              </button>
              <button
                onClick={() => setTrackingModal(null)}
                className="px-6 border border-white/20 text-white rounded-xl hover:bg-white/5 font-bold uppercase text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight" style={{ fontWeight: 900 }}>
            Shipping Orders
          </h2>
          <p className="text-white/40 text-sm mt-1">{locationName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
            <div className="text-white/40 text-xs uppercase tracking-wide">Pending</div>
            <div className="text-white font-black text-2xl mt-1" style={{ fontWeight: 900 }}>
              {orders.length}
            </div>
          </div>
          <button
            onClick={() => loadShippingOrders()}
            className="px-4 py-3 border border-white/20 text-white rounded-2xl hover:bg-white/5 text-sm font-bold uppercase"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Truck size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/40 text-lg mb-2">No Shipping Orders</div>
          <div className="text-white/20 text-sm">
            New online orders will appear here in real-time
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-white font-black text-xl" style={{ fontWeight: 900 }}>
                    Order #{order.order_number}
                  </div>
                  <div className="text-white/80 text-lg mt-1">
                    {order.customers.first_name} {order.customers.last_name}
                  </div>
                  {order.customers.phone && (
                    <div className="text-white/40 text-sm mt-1">
                      {order.customers.phone}
                    </div>
                  )}
                  <div className="text-white/40 text-xs mt-2">
                    {getTimeAgo(order.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-black text-3xl" style={{ fontWeight: 900 }}>
                    ${order.total_amount.toFixed(2)}
                  </div>
                  <div className={`text-sm font-bold mt-1 ${
                    order.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {order.payment_status === 'paid' ? 'PAID ✓' : order.payment_status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-white/40 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Ship To</div>
                    <div className="text-white/80 text-sm leading-relaxed">
                      {formatAddress(order.shipping_address)}
                    </div>
                    {order.shipping_method_title && (
                      <div className="text-white/40 text-xs mt-2">
                        via {order.shipping_method_title}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-white/60 text-sm">
                    <span>
                      {item.product_name} <span className="text-white/40">({item.quantity}x)</span>
                    </span>
                    <span className="font-bold">${item.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="border-t border-white/10 pt-4 space-y-1 text-sm mb-4">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Shipping</span>
                  <span>${(order.shipping_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Tax</span>
                  <span>${order.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTrackingModal({
                    isOpen: true,
                    orderId: order.id,
                    orderNumber: order.order_number,
                    trackingNumber: order.tracking_number || '',
                    carrier: order.shipping_carrier || '',
                  })}
                  disabled={shipping === order.id}
                  className="flex-1 bg-white text-black font-black uppercase py-4 rounded-2xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  style={{ fontWeight: 900 }}
                >
                  <Truck size={16} />
                  Mark as Shipped
                </button>
                <button
                  onClick={() => setModal({
                    isOpen: true,
                    title: 'Customer Contact',
                    message: `${order.customers.email}\n${order.customers.phone || 'No phone'}`,
                    type: 'info',
                  })}
                  className="px-6 border border-white/20 text-white rounded-2xl hover:bg-white/5 font-bold uppercase text-sm"
                >
                  Contact
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

