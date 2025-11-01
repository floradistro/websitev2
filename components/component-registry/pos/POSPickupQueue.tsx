'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { POSModal } from './POSModal';

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

interface PickupOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  customers: Customer | null;
  order_items: OrderItem[];
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount?: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  metadata: any;
  billing_address?: any;
  // Shipping-specific fields
  shipping_address?: any;
  tracking_number?: string;
  tracking_url?: string;
  shipping_carrier?: string;
  shipping_method_title?: string;
  fulfillment_status?: string;
  shipped_date?: string;
}

type OrderType = 'pickup' | 'shipping' | 'instore';

interface POSPickupQueueProps {
  locationId: string;
  locationName: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableSound?: boolean;
}

export function POSPickupQueue({
  locationId,
  locationName,
  autoRefresh = true,
  refreshInterval = 30,
  enableSound = true,
}: POSPickupQueueProps) {
  const [activeTab, setActiveTab] = useState<OrderType>('instore');
  const [pickupOrders, setPickupOrders] = useState<PickupOrder[]>([]);
  const [shippingOrders, setShippingOrders] = useState<PickupOrder[]>([]);
  const [instoreOrders, setInstoreOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [modal, setModal] = useState<{isOpen: boolean; title: string; message: string; type: 'success'|'error'|'info'}>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  // Get active orders based on tab
  const orders = activeTab === 'pickup' ? pickupOrders : (activeTab === 'shipping' ? shippingOrders : instoreOrders);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Show browser notification
  const showNotification = (order: PickupOrder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const customerName = order.customers
        ? `${order.customers.first_name} ${order.customers.last_name}`
        : 'Walk-In Customer';

      const notification = new Notification('New Pickup Order!', {
        body: `${customerName}\n$${order.total_amount.toFixed(2)} - ${order.order_items.length} items`,
        icon: '/icons/pos-192.png',
        badge: '/icons/pos-192.png',
        tag: order.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };

  // Play notification sound
  const playSound = () => {
    if (enableSound && typeof window !== 'undefined') {
      // Simple beep using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) {
        console.log('Could not play sound:', e);
      }
    }
  };

  // Load pickup orders via API
  const loadPickupOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/pos/orders/pickup?locationId=${locationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load pickup orders');
      }

      const { orders } = await response.json();
      setPickupOrders(orders as PickupOrder[] || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading pickup orders:', err);
      setError(err.message);
    }
  }, [locationId]);

  // Load shipping orders via API
  const loadShippingOrders = useCallback(async () => {
    console.log('🚢 Loading shipping orders for location:', locationId);
    try {
      const response = await fetch(`/api/pos/orders/shipping?locationId=${locationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Shipping orders API error:', errorData);
        throw new Error(errorData.error || 'Failed to load shipping orders');
      }

      const { orders } = await response.json();
      console.log('✅ Loaded shipping orders:', orders.length);
      setShippingOrders(orders as PickupOrder[] || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading shipping orders:', err);
      setError(err.message);
    }
  }, [locationId]);

  // Load in-store orders (POS sales) via API
  const loadInstoreOrders = useCallback(async () => {
    console.log('🏪 Loading in-store orders for location:', locationId);
    try {
      const response = await fetch(`/api/pos/orders/instore?locationId=${locationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ In-store orders API error:', errorData);
        throw new Error(errorData.error || 'Failed to load in-store orders');
      }

      const { orders } = await response.json();
      console.log('✅ Loaded in-store orders:', orders.length);
      setInstoreOrders(orders as PickupOrder[] || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading in-store orders:', err);
      setError(err.message);
    }
  }, [locationId]);

  // Load all orders
  const loadAllOrders = useCallback(async () => {
    console.log('📦 Loading all orders (pickup + shipping + in-store)...');
    setLoading(true);
    await Promise.all([loadPickupOrders(), loadShippingOrders(), loadInstoreOrders()]);
    setLoading(false);
    console.log('✅ All orders loaded');
  }, [loadPickupOrders, loadShippingOrders, loadInstoreOrders]);

  // Initial load
  useEffect(() => {
    loadAllOrders();
  }, [loadAllOrders]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAllOrders();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadAllOrders]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pickup-orders-${locationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `pickup_location_id=eq.${locationId}`,
        },
        (payload) => {
          console.log('🆕 New pickup order received!', payload);
          
          // Show browser notification
          if (payload.new) {
            showNotification(payload.new as PickupOrder);
          }
          
          // Play notification sound
          if (enableSound && typeof Audio !== 'undefined') {
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.play().catch(e => console.log('Could not play sound:', e));
            } catch (e) {
              console.log('Audio not supported:', e);
            }
          }

          // Reload orders
          loadPickupOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `pickup_location_id=eq.${locationId}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
          loadPickupOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, enableSound, loadPickupOrders]);

  // Fulfill order
  const fulfillOrder = async (orderId: string, orderNumber: string) => {
    if (fulfilling) return;

    setFulfilling(orderId);

    try {
      // Fulfill via API (updates order status + creates POS transaction)
      const response = await fetch('/api/pos/sales/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          locationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fulfill order');
      }

      // Remove from the appropriate queue
      if (activeTab === 'pickup') {
        setPickupOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        setShippingOrders(prev => prev.filter(o => o.id !== orderId));
      }

      // Show success message
      const successTitle = activeTab === 'shipping' ? 'Order Shipped' : 'Order Ready';
      const successMessage = activeTab === 'shipping'
        ? `Order ${orderNumber} has been marked as shipped!`
        : `Order ${orderNumber} is ready for pickup!`;

      setModal({
        isOpen: true,
        title: successTitle,
        message: successMessage,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error fulfilling order:', err);
      setModal({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to fulfill order',
        type: 'error',
      });
    } finally {
      setFulfilling(null);
    }
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
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/40 text-lg">Loading pickup orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="text-red-500 font-bold mb-2">Error Loading Orders</div>
        <div className="text-white/60">{error}</div>
        <button
          onClick={() => loadPickupOrders()}
          className="mt-4 px-4 py-2 bg-white text-black font-black uppercase rounded-xl text-sm hover:bg-white/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <POSModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight" style={{ fontWeight: 900 }}>
            Order Fulfillment
          </h2>
          <p className="text-white/40 text-sm mt-1">{locationName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-center">
            <div className="text-white/40 text-xs uppercase tracking-wide">
              {activeTab === 'pickup' ? 'Pickup Ready' : (activeTab === 'shipping' ? 'To Ship' : 'Today\'s Sales')}
            </div>
            <div className="text-white font-black text-2xl mt-1" style={{ fontWeight: 900 }}>
              {orders.length}
            </div>
          </div>
          <button
            onClick={() => loadAllOrders()}
            className="px-4 py-3 border border-white/20 text-white rounded-2xl hover:bg-white/5 text-sm font-bold uppercase"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('instore')}
          className={`px-6 py-3 rounded-xl font-black uppercase text-sm transition-all ${
            activeTab === 'instore'
              ? 'bg-white/20 text-white border-2 border-white/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-transparent'
          }`}
          style={{ fontWeight: 900 }}
        >
          In Store
          {instoreOrders.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'instore' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
            }`}>
              {instoreOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pickup')}
          className={`px-6 py-3 rounded-xl font-black uppercase text-sm transition-all ${
            activeTab === 'pickup'
              ? 'bg-white/20 text-white border-2 border-white/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-transparent'
          }`}
          style={{ fontWeight: 900 }}
        >
          Pickup Orders
          {pickupOrders.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'pickup' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
            }`}>
              {pickupOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`px-6 py-3 rounded-xl font-black uppercase text-sm transition-all ${
            activeTab === 'shipping'
              ? 'bg-white/20 text-white border-2 border-white/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-transparent'
          }`}
          style={{ fontWeight: 900 }}
        >
          Shipping Orders
          {shippingOrders.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'shipping' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
            }`}>
              {shippingOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="text-white/40 text-lg mb-2">
            No {activeTab === 'pickup' ? 'Pickup' : (activeTab === 'shipping' ? 'Shipping' : 'In-Store')} Orders
          </div>
          <div className="text-white/20 text-sm">
            {activeTab === 'instore' ? 'Completed POS sales will appear here' : 'New orders will appear here in real-time'}
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
                <div>
                  <div className="text-white font-black text-xl" style={{ fontWeight: 900 }}>
                    Order #{order.order_number}
                  </div>
                  <div className="text-white/80 text-lg mt-1">
                    {order.customers
                      ? `${order.customers.first_name} ${order.customers.last_name}`
                      : (order.billing_address?.name || order.metadata?.customer_name || 'Walk-In Customer')
                    }
                  </div>
                  {order.customers?.phone && (
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
                    {order.payment_status === 'paid' ? 'PREPAID ✓' : order.payment_status.toUpperCase()}
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
                  <span>Tax</span>
                  <span>${order.tax_amount.toFixed(2)}</span>
                </div>
                {activeTab === 'shipping' && order.shipping_amount !== undefined && order.shipping_amount > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>${order.shipping_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Info (for shipping orders) */}
              {activeTab === 'shipping' && order.shipping_address && (
                <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
                  <div className="text-white/40 text-xs uppercase tracking-wide mb-2">Shipping Address</div>
                  <div className="text-white/80 text-sm">
                    {order.shipping_address.address_1 && <div>{order.shipping_address.address_1}</div>}
                    {order.shipping_address.address_2 && <div>{order.shipping_address.address_2}</div>}
                    {order.shipping_address.city && order.shipping_address.state && (
                      <div>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postcode}</div>
                    )}
                  </div>
                  {order.shipping_method_title && (
                    <div className="text-white/60 text-xs mt-2">
                      Method: {order.shipping_method_title}
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Tracking</div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-mono">{order.tracking_number}</span>
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs underline"
                          >
                            Track
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {activeTab !== 'instore' && (
                  <button
                    onClick={() => fulfillOrder(order.id, order.order_number)}
                    disabled={fulfilling === order.id}
                    className="flex-1 bg-white/10 text-white border-2 border-white/20 font-black uppercase py-4 rounded-2xl hover:bg-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ fontWeight: 900 }}
                  >
                    {fulfilling === order.id
                      ? (activeTab === 'pickup' ? 'Fulfilling...' : 'Shipping...')
                      : (activeTab === 'pickup' ? 'Fulfill Order' : 'Mark as Shipped')
                    }
                  </button>
                )}
                <button
                  onClick={() => setModal({
                    isOpen: true,
                    title: 'Customer Contact',
                    message: order.customers?.phone || order.customers?.email || 'No contact information available',
                    type: 'info',
                  })}
                  className={`${activeTab === 'instore' ? 'flex-1' : 'px-6'} border border-white/20 text-white rounded-2xl hover:bg-white/5 font-bold uppercase text-sm`}
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

