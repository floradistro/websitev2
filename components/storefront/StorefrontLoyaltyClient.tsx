"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { supabase } from '@/lib/supabase/client';
import { Trophy, Gift, Star, ShoppingBag, Calendar, Loader2 } from 'lucide-react';
import AddToWalletButton from '@/components/customer/AddToWalletButton';

interface StorefrontLoyaltyClientProps {
  vendor: VendorStorefront;
}

interface CustomerData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  loyalty_points: number;
  loyalty_tier: string | null;
}

interface OrderData {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: string;
}

export default function StorefrontLoyaltyClient({ vendor }: StorefrontLoyaltyClientProps) {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const vendorParam = searchParams?.get('vendor');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login
        router.push(`/storefront/login${vendorParam ? `?vendor=${vendorParam}` : ''}&redirect=/storefront/loyalty${vendorParam ? `?vendor=${vendorParam}` : ''}`);
        return;
      }

      // Get customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, loyalty_points, loyalty_tier')
        .eq('auth_user_id', session.user.id)
        .single();

      if (customerError || !customerData) {
        console.error('Error fetching customer:', customerError);
        setLoading(false);
        return;
      }

      setCustomer(customerData);

      // Get recent orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, order_date, total_amount, status')
        .eq('customer_id', customerData.id)
        .order('order_date', { ascending: false })
        .limit(5);

      if (!ordersError && ordersData) {
        setRecentOrders(ordersData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 text-center">
        <p className="text-white/60 mb-4">Unable to load loyalty information</p>
        <Link
          href={`/storefront/login${vendorParam ? `?vendor=${vendorParam}` : ''}`}
          className="inline-block bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const loyaltyTier = customer.loyalty_tier || 'Bronze';
  const loyaltyPoints = customer.loyalty_points || 0;

  return (
    <div className="space-y-6">
      {/* Loyalty Summary Card */}
      <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {customer.first_name} {customer.last_name}
            </h2>
            <p className="text-neutral-400">{customer.email}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
            <Trophy className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
              {loyaltyTier}
            </span>
          </div>
        </div>

        {/* Points Display */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/60 mb-1">
                Loyalty Points
              </p>
              <p className="text-4xl font-black text-white">
                {loyaltyPoints.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">
              💡 Earn 1 point for every $1 spent
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <Gift className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black">
                Rewards
              </h3>
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">
              Redeem points for discounts and exclusive offers
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black">
                Orders
              </h3>
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">
              {recentOrders.length} recent orders
            </p>
          </div>
        </div>
      </div>

      {/* Add to Wallet */}
      <AddToWalletButton customerId={customer.id} variant="full" />

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white/60" />
            Recent Orders
          </h2>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div>
                  <p className="text-sm font-bold text-white mb-1">
                    {order.order_number}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">
                    {new Date(order.order_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white mb-1">
                    ${order.total_amount.toFixed(2)}
                  </p>
                  <div className={`inline-flex px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.15em] font-black ${
                    order.status === 'completed'
                      ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                      : order.status === 'pending'
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                      : 'bg-neutral-500/20 border border-neutral-500/30 text-neutral-300'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Orders Message */}
      {recentOrders.length === 0 && (
        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Orders Yet</h3>
          <p className="text-white/60 mb-6">
            Start shopping to earn loyalty points!
          </p>
          <Link
            href={`/storefront/shop${vendorParam ? `?vendor=${vendorParam}` : ''}`}
            className="inline-block bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all"
          >
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}
