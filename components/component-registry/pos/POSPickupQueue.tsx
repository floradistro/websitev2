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
  customer_id: string;
  customers: Customer;
  order_items: OrderItem[];
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  metadata: any;
}

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
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [modal, setModal] = useState<{isOpen: boolean; title: string; message: string; type: 'success'|'error'|'info'}>({ 
    isOpen: false, title: '', message: '', type: 'info' 
  });

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
      const notification = new Notification('New Pickup Order! 🛍️', {
        body: `${order.customers.first_name} ${order.customers.last_name}\n$${order.total_amount.toFixed(2)} - ${order.order_items.length} items`,
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
        throw new Error(errorData.error || 'Failed to load orders');
      }

      const { orders } = await response.json();
      setOrders(orders as PickupOrder[] || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading pickup orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // Initial load
  useEffect(() => {
    loadPickupOrders();
  }, [loadPickupOrders]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadPickupOrders();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadPickupOrders]);

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

      // Remove from queue
      setOrders(prev => prev.filter(o => o.id !== orderId));

      // Show success message
      setModal({
        isOpen: true,
        title: 'Order Fulfilled',
        message: `Order ${orderNumber} has been fulfilled successfully!`,
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
            Pickup Orders
          </h2>
          <p className="text-white/40 text-sm mt-1">{locationName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
            <div className="text-white/40 text-xs uppercase tracking-wide">Ready</div>
            <div className="text-white font-black text-2xl mt-1" style={{ fontWeight: 900 }}>
              {orders.length}
            </div>
          </div>
          <button
            onClick={() => loadPickupOrders()}
            className="px-4 py-3 border border-white/20 text-white rounded-2xl hover:bg-white/5 text-sm font-bold uppercase"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="text-white/40 text-lg mb-2">No Pickup Orders</div>
          <div className="text-white/20 text-sm">
            New orders will appear here in real-time
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
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => fulfillOrder(order.id, order.order_number)}
                  disabled={fulfilling === order.id}
                  className="flex-1 bg-white text-black font-black uppercase py-4 rounded-2xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ fontWeight: 900 }}
                >
                  {fulfilling === order.id ? 'Fulfilling...' : 'Fulfill Order'}
                </button>
                <button
                  onClick={() => setModal({
                    isOpen: true,
                    title: 'Customer Contact',
                    message: order.customers.phone || order.customers.email,
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

