"use client";

import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useLoyalty } from "@/context/LoyaltyContext";
import { showNotification } from "@/components/NotificationToast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Package, MapPin, User, LogOut, ShoppingBag, CreditCard, ChevronRight, Calendar, DollarSign, Heart, Clock, X, RotateCcw, Star, Award, TrendingUp, Gift, Sparkles, Truck, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import SavedPaymentMethods from "@/components/SavedPaymentMethods";

interface Order {
  id: number;
  status: string;
  total: string;
  date_created: string;
  line_items: any[];
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { points, pointsLabel, history, settings, addPoints, loading: loyaltyLoading } = useLoyalty();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [editingAddress, setEditingAddress] = useState<'billing' | 'shipping' | null>(null);
  const [addressForm, setAddressForm] = useState<any>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      loadRecentlyViewed();
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      
      // Get data for recommendations
      const orderHistory = orders.map(o => ({
        items: o.line_items.map((item: any) => ({ name: item.name }))
      }));
      
      const wishlistData = wishlistItems.map(w => ({ name: w.name }));
      
      // Use recently viewed as product context
      const productContext = recentlyViewed.slice(0, 50);
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderHistory,
          currentProduct: null,
          wishlist: wishlistData,
          allProducts: productContext
        })
      });

      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadRecentlyViewed = () => {
    // Try multiple localStorage keys
    const keys = ["recentlyViewed", "flora-recently-viewed"];
    
    for (const key of keys) {
      const viewed = localStorage.getItem(key);
      if (viewed) {
        try {
          const parsed = JSON.parse(viewed);
          // Handle both array and object formats
          if (Array.isArray(parsed)) {
            setRecentlyViewed(parsed);
            return;
          } else if (parsed.products && Array.isArray(parsed.products)) {
            setRecentlyViewed(parsed.products);
            return;
          }
        } catch (error) {
          console.error(`Error loading recently viewed from ${key}:`, error);
        }
      }
    }
    
    setRecentlyViewed([]);
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
      const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
      
      // Use Next.js proxy to avoid CORS issues
      const response = await axios.get(`/api/wp-proxy`, {
        params: {
          path: '/wp-json/wc/v3/orders',
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
          customer: user.id,
          per_page: 10,
          orderby: 'date',
          order: 'desc',
        }
      });
      
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleQuickReorder = async (order: Order) => {
    // Add all items from the order to cart
    order.line_items.forEach((item: any) => {
      const qty = parseInt(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;
      
      addToCart({
        productId: item.product_id,
        name: item.name,
        price: price,
        quantity: qty,
        tierName: item.meta_data?.find((m: any) => m.key === 'tier_name')?.value || "Standard",
        image: item.image?.src,
      });
    });
    
    // Navigate to checkout
    router.push("/checkout");
  };

  const handleAddWishlistItemToCart = (item: any) => {
    // Navigate to product page to select pricing tier
    router.push(`/products/${item.productId}`);
  };

  const handleEditAddress = (type: 'billing' | 'shipping') => {
    setEditingAddress(type);
    setAddressForm(user?.[type] || {
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'US',
    });
  };

  const handleSaveAddress = async () => {
    if (!editingAddress || !user) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
      const consumerKey = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_KEY || "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
      const consumerSecret = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_SECRET || "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
      
      const updateData: any = {};
      updateData[editingAddress] = addressForm;
      
      await axios.put(
        `${baseUrl}/wp-json/wc/v3/customers/${user.id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
        updateData
      );
      
      // Refresh user data by reloading
      window.location.reload();
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setAddressForm({});
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddressForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Test earning chips - saves to WooCommerce Points & Rewards
  const handleTestPoints = async () => {
    const amount = 100;
    const [singularLabel, pluralLabel] = pointsLabel.split(':');
    const label = pluralLabel || singularLabel;
    
    try {
      await addPoints(amount, "Test reward - Welcome bonus");
      
      showNotification({
        type: "points",
        title: `${label} Earned!`,
        message: `You earned ${amount} ${label.toLowerCase()} via WooCommerce Points & Rewards!`,
      });
    } catch (error) {
      showNotification({
        type: "info",
        title: "Error",
        message: "Failed to save points. Please try again.",
      });
    }
  };

  // Calculate redemption value
  const getRedemptionValue = (chips: number): number => {
    if (!settings) return 0;
    // Parse redeem_ratio e.g. "100:5" means 100 chips = $5
    const [chipAmount, dollarAmount] = settings.redeem_ratio.split(':').map(n => parseFloat(n));
    return (chips / chipAmount) * dollarAmount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xs uppercase tracking-[0.2em] font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "processing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-white/5 text-white/60 border-white/20";
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const pendingOrders = orders.filter(o => o.status === "processing" || o.status === "pending").length;

  return (
    <div className="bg-[#1a1a1a] min-h-screen">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] border-b border-white/10 px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3 font-medium">Dashboard</p>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-3 tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <div className="h-[1px] w-20 bg-gradient-to-r from-white/30 to-transparent mb-4"></div>
              <p className="text-sm text-white/50 tracking-wide">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="interactive-button flex items-center gap-2 bg-black/40 border border-white/10 text-white px-5 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 hover:border-white/30 font-medium transition-all"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3">
              <div className="bg-[#2a2a2a] border border-white/10 sticky top-24">
                <nav className="flex flex-col">
                  {[
                    { id: "overview", label: "Overview", icon: User },
                    { id: "orders", label: "Orders", icon: Package },
                    { id: "loyalty", label: "Rewards", icon: Star },
                    { id: "wishlist", label: "Wishlist", icon: Heart },
                    { id: "recently-viewed", label: "Recently Viewed", icon: Clock },
                    { id: "payment-methods", label: "Payment Methods", icon: CreditCard },
                    { id: "addresses", label: "Addresses", icon: MapPin },
                    { id: "account", label: "Account", icon: User },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.2em] transition-all border-b border-white/5 last:border-b-0 group ${
                        activeTab === item.id
                          ? "bg-white text-black font-medium"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={14} className={activeTab === item.id ? "text-black" : "text-white/40 group-hover:text-white/60"} />
                        {item.label}
                      </div>
                      <ChevronRight size={14} className={`transition-transform ${activeTab === item.id ? "translate-x-0.5" : ""}`} />
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9">
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-[#2a2a2a] border border-white/10 p-6 hover:border-white/20 transition-all glow-hover group">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
                          <ShoppingBag size={16} className="text-white/60" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">Total</span>
                      </div>
                      <div className="text-4xl font-light text-white mb-2">{orders.length}</div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Orders Placed</p>
                    </div>

                    <div className="bg-[#2a2a2a] border border-white/10 p-6 hover:border-white/20 transition-all glow-hover group">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
                          <DollarSign size={16} className="text-white/60" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">Lifetime</span>
                      </div>
                      <div className="text-4xl font-light text-white mb-2">${totalSpent.toFixed(0)}</div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Total Spent</p>
                    </div>

                    <div className="bg-[#2a2a2a] border border-white/10 p-6 hover:border-white/20 transition-all glow-hover group">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
                          <Package size={16} className="text-white/60" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">Active</span>
                      </div>
                      <div className="text-4xl font-light text-white mb-2">{pendingOrders}</div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Pending Orders</p>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-[#2a2a2a] border border-white/10">
                    <div className="border-b border-white/10 px-6 py-4">
                      <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">Recent Orders</h2>
                    </div>
                    <div className="p-6">
                      {loadingOrders ? (
                        <div className="text-white/40 text-xs text-center py-8">Loading orders...</div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                            <Package size={24} className="text-white/20" />
                          </div>
                          <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-6">No orders yet</p>
                          <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                          >
                            Start Shopping
                            <ChevronRight size={12} />
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.slice(0, 5).map((order) => (
                            <div
                              key={order.id}
                              className="bg-[#3a3a3a] border border-white/10 p-4 hover:border-white/20 transition-all group"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-white/60">#{order.id}</span>
                                  <span className={`text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-light text-white">${parseFloat(order.total).toFixed(2)}</span>
                                  <button
                                    onClick={() => handleQuickReorder(order)}
                                    className="interactive-button flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] hover:bg-white/90 transition-all font-medium"
                                    title="Reorder"
                                  >
                                    <RotateCcw size={11} />
                                    Reorder
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-white/40">
                                <Calendar size={10} />
                                {new Date(order.date_created).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="bg-[#2a2a2a] border border-white/10">
                      <div className="border-b border-white/10 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-400" />
                            <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">Recommended For You</h2>
                          </div>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-amber-400/60">Flora Budtender's Picks</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {recommendations.slice(0, 6).map((product: any) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.id}`}
                              className="bg-[#3a3a3a] border border-white/10 p-4 hover:border-white/20 transition-all group"
                            >
                              <div className="flex gap-3">
                                {product.image ? (
                                  <div className="relative w-16 h-16 flex-shrink-0 bg-[#2a2a2a]">
                                    <Image
                                      src={product.image}
                                      alt={product.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 flex-shrink-0 bg-[#2a2a2a] flex items-center justify-center">
                                    <Image
                                      src="/logoprint.png"
                                      alt="Flora Distro"
                                      width={24}
                                      height={24}
                                      className="opacity-20"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-white group-hover:text-white/80 transition-smooth line-clamp-2">
                                    {product.name}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Link
                      href="/products"
                      className="bg-[#2a2a2a] border border-white/10 p-8 hover:border-white/20 transition-all group glow-hover"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all">
                        <ShoppingBag size={20} className="text-white/60" />
                      </div>
                      <h3 className="text-base font-light text-white mb-2 uppercase tracking-[0.15em]">Continue Shopping</h3>
                      <p className="text-[11px] text-white/40 leading-relaxed">Browse our premium products</p>
                    </Link>
                    <Link
                      href="/track"
                      className="bg-[#2a2a2a] border border-white/10 p-8 hover:border-white/20 transition-all group glow-hover"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all">
                        <Package size={20} className="text-white/60" />
                      </div>
                      <h3 className="text-base font-light text-white mb-2 uppercase tracking-[0.15em]">Track Order</h3>
                      <p className="text-[11px] text-white/40 leading-relaxed">Check your order status</p>
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="bg-[#2a2a2a] border border-white/10">
                  <div className="border-b border-white/10 px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">Order History</h2>
                      
                      {/* Filters */}
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] border transition-all ${
                              statusFilter === 'all'
                                ? 'bg-white text-black border-white'
                                : 'bg-black/20 text-white/60 border-white/20 hover:border-white/40'
                            }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setStatusFilter('processing')}
                            className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] border transition-all ${
                              statusFilter === 'processing'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                : 'bg-black/20 text-white/60 border-white/20 hover:border-white/40'
                            }`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => setStatusFilter('completed')}
                            className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] border transition-all ${
                              statusFilter === 'completed'
                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                : 'bg-black/20 text-white/60 border-white/20 hover:border-white/40'
                            }`}
                          >
                            Completed
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {loadingOrders ? (
                      <div className="text-white/40 text-xs text-center py-8">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                          <Package size={24} className="text-white/20" />
                        </div>
                        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-6">No orders yet</p>
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                        >
                          Start Shopping
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders
                          .filter(order => statusFilter === 'all' || order.status === statusFilter)
                          .map((order) => {
                            // Determine order type
                            const hasDelivery = order.line_items?.some((item: any) =>
                              item.meta_data?.find((m: any) => m.key === 'order_type')?.value === 'delivery'
                            );
                            const hasPickup = order.line_items?.some((item: any) =>
                              item.meta_data?.find((m: any) => m.key === 'order_type')?.value === 'pickup'
                            );

                            return (
                              <div
                                key={order.id}
                                className="bg-[#3a3a3a] border border-white/10 hover:border-white/20 transition-all"
                              >
                                <div className="p-6">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <Link
                                          href={`/track?orderId=${order.id}`}
                                          className="text-base text-white font-light hover:text-white/80 transition-smooth"
                                        >
                                          Order #{order.id}
                                        </Link>
                                        <span className={`text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 border ${getStatusColor(order.status)}`}>
                                          {order.status}
                                        </span>
                                        {hasDelivery && (
                                          <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-white/60">
                                            <Truck size={10} />
                                            Delivery
                                          </span>
                                        )}
                                        {hasPickup && (
                                          <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-white/60">
                                            <Store size={10} />
                                            Pickup
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-white/40 flex items-center gap-2">
                                        <Calendar size={10} />
                                        {new Date(order.date_created).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                      
                                      {/* Order Items Preview */}
                                      <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                                          Items ({order.line_items?.length || 0})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {order.line_items?.slice(0, 3).map((item: any, idx: number) => (
                                            <span key={idx} className="text-xs text-white/60">
                                              {item.name}
                                              {idx < Math.min(2, (order.line_items?.length || 0) - 1) && ','}
                                            </span>
                                          ))}
                                          {(order.line_items?.length || 0) > 3 && (
                                            <span className="text-xs text-white/40">
                                              +{(order.line_items?.length || 0) - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right space-y-3 ml-6">
                                      <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Total</p>
                                        <span className="text-2xl text-white font-light">${parseFloat(order.total).toFixed(2)}</span>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <Link
                                          href={`/track?orderId=${order.id}`}
                                          className="interactive-button flex items-center justify-center gap-2 bg-white text-black px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                                        >
                                          <Package size={12} />
                                          Track
                                        </Link>
                                        <button
                                          onClick={() => handleQuickReorder(order)}
                                          className="interactive-button flex items-center justify-center gap-2 bg-black/40 border border-white/10 text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all font-medium"
                                        >
                                          <RotateCcw size={12} />
                                          Reorder
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "loyalty" && (
                <div className="space-y-6">
                  {/* Points Balance Card */}
                  <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border border-white/10 p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-medium">Rewards Balance</p>
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-5xl font-light text-white tracking-tight">{points.toLocaleString()}</h2>
                          <span className="text-lg text-white/60 font-light tracking-wide">{pointsLabel.split(':')[1] || pointsLabel}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Value</p>
                        <p className="text-3xl font-light text-amber-400">${getRedemptionValue(points).toFixed(2)}</p>
                        <p className="text-[9px] text-white/30 mt-1">Available Discount</p>
                      </div>
                    </div>

                    {/* Earn & Redeem Info */}
                    {settings && (
                      <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Earn Rate</p>
                          <p className="text-white text-sm">{settings.earn_ratio.replace(':', ' chip per $')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Redeem Rate</p>
                          <p className="text-white text-sm">{settings.redeem_ratio.replace(':', ' chips = $')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Minimum Redeem</p>
                          <p className="text-white text-sm">{settings.min_redeem_points} chips</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Expiry</p>
                          <p className="text-white text-sm">{settings.points_expiry.replace(':', ' ').toLowerCase()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transaction History */}
                  <div className="bg-[#2a2a2a] border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm uppercase tracking-[0.2em] text-white font-medium flex items-center gap-2">
                        <TrendingUp size={16} className="text-white/60" />
                        Points History
                      </h3>
                      <button
                        onClick={handleTestPoints}
                        className="interactive-button text-[10px] uppercase tracking-[0.2em] bg-amber-500/20 text-amber-400 px-4 py-2 border border-amber-500/30 hover:bg-amber-500/30 transition-all font-medium"
                      >
                        Test Earn +100
                      </button>
                    </div>
                    {loyaltyLoading ? (
                      <div className="text-center py-8">
                        <p className="text-white/40 text-xs">Loading history...</p>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                          <Star size={24} className="text-white/20" />
                        </div>
                        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">No transaction history</p>
                        <p className="text-white/30 text-[10px]">Complete orders to earn {pointsLabel.split(':')[1]?.toLowerCase() || 'points'}!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {history.slice(0, 20).map((transaction) => (
                          <div 
                            key={transaction.id}
                            className="flex items-center justify-between bg-[#3a3a3a] border border-white/10 p-4"
                          >
                            <div className="flex-1">
                              <p className="text-xs text-white/80 mb-1">{transaction.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-white/40">
                                <span className="flex items-center gap-1">
                                  <Calendar size={10} />
                                  {new Date(transaction.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="uppercase tracking-wider">{transaction.type}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-light ${transaction.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {transaction.points > 0 ? '+' : ''}{transaction.points}
                              </span>
                              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                {pointsLabel.split(':')[1]?.toLowerCase() || 'points'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* How It Works */}
                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 p-6">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-amber-400 font-medium mb-4">
                      How It Works
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ShoppingBag size={14} className="text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white font-medium mb-1">Earn on Purchases</p>
                          <p className="text-[10px] text-white/60">
                            {settings ? settings.earn_ratio.replace(':', ' chip per $') : 'Earn chips on every order'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <DollarSign size={14} className="text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white font-medium mb-1">Redeem for Discounts</p>
                          <p className="text-[10px] text-white/60">
                            {settings ? settings.redeem_ratio.replace(':', ' chips = $') : 'Use chips for discounts'}
                          </p>
                        </div>
                      </div>
                      {settings && settings.min_redeem_points && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Star size={14} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xs text-white font-medium mb-1">Minimum Redemption</p>
                            <p className="text-[10px] text-white/60">{settings.min_redeem_points} chips required</p>
                          </div>
                        </div>
                      )}
                      {settings && settings.points_expiry && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock size={14} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xs text-white font-medium mb-1">Points Expiry</p>
                            <p className="text-[10px] text-white/60">{settings.points_expiry.replace(':', ' ').toLowerCase()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "wishlist" && (
                <div className="bg-[#2a2a2a] border border-white/10">
                  <div className="border-b border-white/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">My Wishlist</h2>
                      <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">{wishlistItems.length} Items</span>
                    </div>
                  </div>
                  <div className="p-6">
                    {wishlistItems.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                          <Heart size={24} className="text-white/20" />
                        </div>
                        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-6">No favorites yet</p>
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                        >
                          Browse Products
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {wishlistItems.map((item) => (
                          <div
                            key={item.productId}
                            className="bg-[#3a3a3a] border border-white/10 p-4 hover:border-white/20 transition-all group"
                          >
                            <div className="flex gap-4">
                              {item.image ? (
                                <div className="relative w-20 h-20 flex-shrink-0 bg-[#2a2a2a]">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 flex-shrink-0 bg-[#2a2a2a] flex items-center justify-center">
                                  <Image
                                    src="/logoprint.png"
                                    alt="Flora Distro"
                                    width={30}
                                    height={30}
                                    className="opacity-20"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <Link 
                                  href={`/products/${item.productId}`}
                                  className="text-xs text-white hover:text-white/80 transition-smooth line-clamp-2 mb-2 block"
                                >
                                  {item.name}
                                </Link>
                                <p className="text-[10px] text-white/40 mb-3">View product for pricing</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAddWishlistItemToCart(item)}
                                    className="interactive-button flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] hover:bg-white/90 transition-all font-medium"
                                  >
                                    <ShoppingBag size={11} />
                                    View Product
                                  </button>
                                  <button
                                    onClick={() => removeFromWishlist(item.productId)}
                                    className="interactive-button w-7 h-7 flex items-center justify-center bg-black/40 border border-white/10 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "recently-viewed" && (
                <div className="bg-[#2a2a2a] border border-white/10">
                  <div className="border-b border-white/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">Recently Viewed</h2>
                      <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">{recentlyViewed.length} Products</span>
                    </div>
                  </div>
                  <div className="p-6">
                    {recentlyViewed.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                          <Clock size={24} className="text-white/20" />
                        </div>
                        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-6">No browsing history</p>
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                        >
                          Browse Products
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {recentlyViewed.slice(0, 12).map((product: any) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            className="bg-[#3a3a3a] border border-white/10 p-4 hover:border-white/20 transition-all group"
                          >
                            <div className="flex gap-4">
                              {product.image ? (
                                <div className="relative w-20 h-20 flex-shrink-0 bg-[#2a2a2a]">
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 flex-shrink-0 bg-[#2a2a2a] flex items-center justify-center">
                                  <Image
                                    src="/logoprint.png"
                                    alt="Flora Distro"
                                    width={30}
                                    height={30}
                                    className="opacity-20"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white group-hover:text-white/80 transition-smooth line-clamp-2 mb-2">
                                  {product.name}
                                </p>
                                <p className="text-sm font-light text-white mb-2">${parseFloat(product.price).toFixed(2)}</p>
                                <p className="text-[10px] text-white/40">
                                  Viewed {new Date(product.viewedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "payment-methods" && (
                <SavedPaymentMethods />
              )}

              {activeTab === "addresses" && (
                <div className="space-y-6">
                  {/* Billing Address */}
                  <div className="bg-[#2a2a2a] border border-white/10">
                    <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                      <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">Billing Address</h2>
                      {editingAddress !== 'billing' && (
                        <button
                          onClick={() => handleEditAddress('billing')}
                          className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-smooth"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <div className="p-6">
                      {editingAddress === 'billing' ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">First Name</label>
                              <input
                                type="text"
                                value={addressForm.first_name || ''}
                                onChange={(e) => handleAddressChange('first_name', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">Last Name</label>
                              <input
                                type="text"
                                value={addressForm.last_name || ''}
                                onChange={(e) => handleAddressChange('last_name', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">Address Line 1</label>
                            <input
                              type="text"
                              value={addressForm.address_1 || ''}
                              onChange={(e) => handleAddressChange('address_1', e.target.value)}
                              className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">Address Line 2</label>
                            <input
                              type="text"
                              value={addressForm.address_2 || ''}
                              onChange={(e) => handleAddressChange('address_2', e.target.value)}
                              className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                            />
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">City</label>
                              <input
                                type="text"
                                value={addressForm.city || ''}
                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">State</label>
                              <input
                                type="text"
                                value={addressForm.state || ''}
                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">ZIP Code</label>
                              <input
                                type="text"
                                value={addressForm.postcode || ''}
                                onChange={(e) => handleAddressChange('postcode', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-4">
                            <button
                              onClick={handleSaveAddress}
                              className="interactive-button bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                            >
                              Save Address
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="interactive-button bg-black/40 border border-white/10 text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {user.billing && (user.billing.address_1 || user.billing.city) ? (
                            <div className="space-y-1.5 text-white/70 text-sm leading-relaxed">
                              <p className="text-white font-medium">{user.billing.first_name} {user.billing.last_name}</p>
                              {user.billing.address_1 && <p>{user.billing.address_1}</p>}
                              {user.billing.address_2 && <p>{user.billing.address_2}</p>}
                              {user.billing.city && (
                                <p>
                                  {user.billing.city}
                                  {user.billing.state && `, ${user.billing.state}`}
                                  {user.billing.postcode && ` ${user.billing.postcode}`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-white/40 text-xs">No billing address set</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-[#2a2a2a] border border-white/10">
                    <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                      <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">Shipping Address</h2>
                      {editingAddress !== 'shipping' && (
                        <button
                          onClick={() => handleEditAddress('shipping')}
                          className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-smooth"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <div className="p-6">
                      {editingAddress === 'shipping' ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">First Name</label>
                              <input
                                type="text"
                                value={addressForm.first_name || ''}
                                onChange={(e) => handleAddressChange('first_name', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">Last Name</label>
                              <input
                                type="text"
                                value={addressForm.last_name || ''}
                                onChange={(e) => handleAddressChange('last_name', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">Address Line 1</label>
                            <input
                              type="text"
                              value={addressForm.address_1 || ''}
                              onChange={(e) => handleAddressChange('address_1', e.target.value)}
                              className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">Address Line 2</label>
                            <input
                              type="text"
                              value={addressForm.address_2 || ''}
                              onChange={(e) => handleAddressChange('address_2', e.target.value)}
                              className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                            />
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">City</label>
                              <input
                                type="text"
                                value={addressForm.city || ''}
                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">State</label>
                              <input
                                type="text"
                                value={addressForm.state || ''}
                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">ZIP Code</label>
                              <input
                                type="text"
                                value={addressForm.postcode || ''}
                                onChange={(e) => handleAddressChange('postcode', e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-4">
                            <button
                              onClick={handleSaveAddress}
                              className="interactive-button bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                            >
                              Save Address
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="interactive-button bg-black/40 border border-white/10 text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {user.shipping && (user.shipping.address_1 || user.shipping.city) ? (
                            <div className="space-y-1.5 text-white/70 text-sm leading-relaxed">
                              <p className="text-white font-medium">{user.shipping.first_name} {user.shipping.last_name}</p>
                              {user.shipping.address_1 && <p>{user.shipping.address_1}</p>}
                              {user.shipping.address_2 && <p>{user.shipping.address_2}</p>}
                              {user.shipping.city && (
                                <p>
                                  {user.shipping.city}
                                  {user.shipping.state && `, ${user.shipping.state}`}
                                  {user.shipping.postcode && ` ${user.shipping.postcode}`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-white/40 text-xs">No shipping address set</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "account" && (
                <div className="bg-[#2a2a2a] border border-white/10">
                  <div className="border-b border-white/10 px-6 py-4">
                    <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">Account Details</h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-medium">
                          First Name
                        </label>
                        <div className="text-white text-sm">{user.firstName}</div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-medium">
                          Last Name
                        </label>
                        <div className="text-white text-sm">{user.lastName}</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-medium">
                        Email Address
                      </label>
                      <div className="text-white text-sm">{user.email}</div>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-[11px] text-white/40 mb-4 leading-relaxed">
                        Need to update your account information? Contact our support team.
                      </p>
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
                      >
                        Contact Support
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
