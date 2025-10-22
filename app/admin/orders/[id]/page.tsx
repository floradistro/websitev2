"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, User, CreditCard, MapPin, Truck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/supabase/orders/${orderId}`);
      const data = await res.json();
      
      if (data.success) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      processing: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      completed: 'text-green-500 bg-green-500/10 border-green-500/20',
      cancelled: 'text-red-500 bg-red-500/10 border-red-500/20',
      'on-hold': 'text-orange-500 bg-orange-500/10 border-orange-500/20'
    };
    return colors[status] || 'text-white/50 bg-white/5 border-white/10';
  }

  if (loading) {
    return (
      <div className="w-full animate-fadeIn px-4 lg:px-0 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full animate-fadeIn px-4 lg:px-0">
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-4">Order not found</p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 transition-all"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-4 text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl text-white mb-2 font-light tracking-tight">
              Order {order.order_number}
            </h1>
            <p className="text-white/50 text-sm">
              Placed on {new Date(order.order_date).toLocaleString()}
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1.5 text-sm border ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
            <span className={`px-3 py-1.5 text-sm border ${getStatusColor(order.payment_status)}`}>
              {order.payment_status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white/5 border border-white/10">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-white text-lg font-light flex items-center gap-2">
                <Package size={20} />
                Order Items ({order.order_items?.length || 0})
              </h2>
            </div>
            <div className="divide-y divide-white/10">
              {order.order_items?.map((item: any, index: number) => (
                <div key={index} className="p-6 flex items-center gap-4">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover border border-white/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium mb-1">{item.product_name}</p>
                    {item.product_sku && (
                      <p className="text-white/50 text-xs">SKU: {item.product_sku}</p>
                    )}
                    {item.order_type && (
                      <p className="text-white/50 text-xs capitalize mt-1">
                        {item.order_type === 'pickup' ? '📦 Pickup' : '🚚 Delivery'}
                        {item.pickup_location_name && ` at ${item.pickup_location_name}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white">${parseFloat(item.unit_price).toFixed(2)} × {item.quantity}</p>
                    <p className="text-white font-medium">${parseFloat(item.line_total).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white/5 border border-white/10">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-white text-lg font-light flex items-center gap-2">
                <CreditCard size={20} />
                Payment Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-white/50">Payment Method:</span>
                <span className="text-white">{order.payment_method_title || 'Credit Card'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Payment Status:</span>
                <span className={`px-2 py-1 text-xs border ${getStatusColor(order.payment_status)}`}>
                  {order.payment_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              {order.transaction_id && (
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Transaction ID:</span>
                  <code className="text-sm text-green-500 bg-green-500/10 px-3 py-1 border border-green-500/20">
                    {order.transaction_id}
                  </code>
                </div>
              )}
              {order.paid_date && (
                <div className="flex justify-between">
                  <span className="text-white/50">Paid Date:</span>
                  <span className="text-white">{new Date(order.paid_date).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white/5 border border-white/10">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-white text-lg font-light">Order Summary</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-white/70">
                <span>Subtotal:</span>
                <span>${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              {order.shipping_amount > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Shipping:</span>
                  <span>${parseFloat(order.shipping_amount).toFixed(2)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Tax:</span>
                  <span>${parseFloat(order.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount:</span>
                  <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between text-white font-medium text-lg">
                <span>Total:</span>
                <span>${parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {order.customer && (
            <div className="bg-white/5 border border-white/10">
              <div className="border-b border-white/10 px-6 py-4">
                <h2 className="text-white text-lg font-light flex items-center gap-2">
                  <User size={20} />
                  Customer
                </h2>
              </div>
              <div className="p-6 space-y-2">
                <p className="text-white font-medium">
                  {order.customer.first_name} {order.customer.last_name}
                </p>
                <p className="text-white/70 text-sm">{order.customer.email}</p>
                {order.customer.phone && (
                  <p className="text-white/70 text-sm">{order.customer.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="bg-white/5 border border-white/10">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-white text-lg font-light flex items-center gap-2">
                <MapPin size={20} />
                Addresses
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {order.billing_address && (
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Billing</p>
                  <p className="text-white text-sm">
                    {order.billing_address.first_name} {order.billing_address.last_name}<br />
                    {order.billing_address.address_1}<br />
                    {order.billing_address.address_2 && <>{order.billing_address.address_2}<br /></>}
                    {order.billing_address.city}, {order.billing_address.state} {order.billing_address.postcode}
                  </p>
                </div>
              )}
              {order.shipping_address && order.delivery_type !== 'pickup' && (
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Shipping</p>
                  <p className="text-white text-sm">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
                    {order.shipping_address.address_1}<br />
                    {order.shipping_address.address_2 && <>{order.shipping_address.address_2}<br /></>}
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postcode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Type */}
          <div className="bg-white/5 border border-white/10 p-6">
            <div className="flex items-center gap-2 text-white mb-2">
              <Truck size={18} />
              <span className="font-medium">Delivery Type</span>
            </div>
            <p className="text-white/70 text-sm capitalize">
              {order.delivery_type?.replace('_', ' ') || 'Standard'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

