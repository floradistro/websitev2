"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Store, Package, ShoppingCart, Filter, Search, ChevronDown, TrendingUp, Award, Users } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";

interface WholesaleProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  price: number;
  wholesale_price?: number;
  regular_price: number;
  featured_image?: string;
  vendor?: {
    id: string;
    store_name: string;
    slug: string;
    vendor_type: string;
  };
  minimum_wholesale_quantity: number;
  stock_status: string;
  wholesale_pricing?: Array<{
    tier_name: string;
    minimum_quantity: number;
    unit_price: number;
    discount_percentage?: number;
  }>;
}

interface Distributor {
  id: string;
  store_name: string;
  slug: string;
  email: string;
  vendor_type: string;
  wholesale_enabled: boolean;
  minimum_order_amount: number;
  distributor_terms?: string;
  products?: { count: number };
}

export default function WholesalePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { vendor, isLoading: vendorLoading } = useVendorAuth();
  const { addToCart } = useCart();

  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessCheckComplete, setAccessCheckComplete] = useState(false);
  
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'products' | 'distributors'>('products');

  // Check wholesale access
  useEffect(() => {
    async function checkAccess() {
      try {
        // Wait for both auth contexts to finish loading
        if (authLoading || vendorLoading) {
          console.log('⏳ Waiting for auth to load... authLoading:', authLoading, 'vendorLoading:', vendorLoading);
          setLoading(true);
          return;
        }
        
        setLoading(true);
        console.log('🔍 Checking wholesale access... vendor:', vendor?.store_name, 'isAuthenticated:', isAuthenticated);
        
        // If not authenticated at all, no access
        if (!isAuthenticated && !vendor) {
          console.log('❌ No authentication found');
          setHasAccess(false);
          setAccessCheckComplete(true);
          setLoading(false);
          return;
        }
        
        // Simple check: if they're a vendor, they have access
        if (vendor) {
          console.log('✅ Vendor detected, granting wholesale access:', vendor.store_name);
          setHasAccess(true);
          setAccessCheckComplete(true);
          setLoading(false);
          return;
        }
        
        // Check if customer is wholesale approved
        if (user && user.id) {
          console.log('🔍 Checking customer wholesale approval for user:', user.id);
          const { data: customerData } = await axios.get(`/api/auth/customer/${user.id}`);
          
          if (customerData?.customer?.is_wholesale_approved) {
            console.log('✅ Customer is wholesale approved');
            setHasAccess(true);
          } else {
            console.log('❌ Customer is not wholesale approved');
            setHasAccess(false);
          }
        }
        
        setAccessCheckComplete(true);
        setLoading(false);
      } catch (error) {
        console.error('Access check error:', error);
        setHasAccess(false);
        setAccessCheckComplete(true);
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [authLoading, vendorLoading, isAuthenticated, user, vendor]);

  // Load wholesale products
  useEffect(() => {
    if (hasAccess && accessCheckComplete) {
      loadProducts();
      loadDistributors();
    }
  }, [hasAccess, accessCheckComplete, selectedDistributor]);

  async function loadProducts() {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        wholesaleOnly: 'true'
      });
      
      if (selectedDistributor) {
        params.append('vendorId', selectedDistributor);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const { data } = await axios.get(`/api/wholesale/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Load products error:', error);
    }
  }

  async function loadDistributors() {
    try {
      const { data } = await axios.get('/api/wholesale/distributors');
      setDistributors(data.distributors || []);
    } catch (error) {
      console.error('Load distributors error:', error);
    }
  }

  // Loading state
  if (loading || !accessCheckComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Checking access...</p>
        </div>
      </div>
    );
  }

  // No access - show application page
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Store className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h1 className="text-4xl font-light mb-4">Wholesale Marketplace</h1>
            <p className="text-white/60 text-lg">
              Access exclusive wholesale pricing and products from our distributor network
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-lg">
            <h2 className="text-2xl font-light mb-6">Apply for Wholesale Access</h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <Award className="w-6 h-6 text-white/40 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-1">Exclusive Pricing</h3>
                  <p className="text-white/60 text-sm">Access tier-based wholesale pricing with volume discounts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Package className="w-6 h-6 text-white/40 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-1">Distributor Network</h3>
                  <p className="text-white/60 text-sm">Connect with verified distributors and wholesalers</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <TrendingUp className="w-6 h-6 text-white/40 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-1">Bulk Ordering</h3>
                  <p className="text-white/60 text-sm">Minimum order quantities and special wholesale terms</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!isAuthenticated ? (
                <>
                  <p className="text-white/60 text-sm mb-4">
                    You need to be signed in to apply for wholesale access
                  </p>
                  <Link
                    href="/login"
                    className="block w-full py-3 bg-white text-black text-center font-medium hover:bg-white/90 transition-all"
                  >
                    Sign In to Apply
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full py-3 border border-white/20 text-white text-center font-medium hover:bg-white/5 transition-all"
                  >
                    Create Account
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-white/60 text-sm mb-4">
                    Submit your wholesale application to get access to exclusive distributor products
                  </p>
                  <Link
                    href="/dashboard?tab=wholesale"
                    className="block w-full py-3 bg-white text-black text-center font-medium hover:bg-white/90 transition-all"
                  >
                    Apply for Wholesale Access
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has access - show wholesale marketplace
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-light mb-2">Wholesale Marketplace</h1>
              <p className="text-white/60">
                Exclusive access to distributor products and wholesale pricing
              </p>
            </div>
            
            {vendor && (
              <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Vendor Access</p>
                <p className="font-medium">{vendor.store_name}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <Users className="w-5 h-5 text-white/40 mb-2" />
              <p className="text-2xl font-light mb-1">{distributors.length}</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Distributors</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <Package className="w-5 h-5 text-white/40 mb-2" />
              <p className="text-2xl font-light mb-1">{products.length}</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Products</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <TrendingUp className="w-5 h-5 text-white/40 mb-2" />
              <p className="text-2xl font-light mb-1">Up to 40%</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Savings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setViewMode('products')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                viewMode === 'products'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={18} />
                <span className="font-medium">Products</span>
              </div>
            </button>
            
            <button
              onClick={() => setViewMode('distributors')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                viewMode === 'distributors'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store size={18} />
                <span className="font-medium">Distributors</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-black/50 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search wholesale products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Distributor Filter */}
            {viewMode === 'products' && (
              <select
                value={selectedDistributor || ''}
                onChange={(e) => setSelectedDistributor(e.target.value || null)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/30"
              >
                <option value="">All Distributors</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.store_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {viewMode === 'products' ? (
          // Products Grid
          <div>
            {products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <p className="text-white/60">No wholesale products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/30 transition-all group">
                    <Link href={`/products/${product.slug}`}>
                      <div className="aspect-square bg-white/5 relative">
                        {product.featured_image ? (
                          <Image
                            src={product.featured_image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-12 h-12 text-white/20" />
                          </div>
                        )}
                        
                        {product.wholesale_price && (
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
                            WHOLESALE
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-4">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-medium mb-1 group-hover:text-white/80 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      {product.vendor && (
                        <p className="text-xs text-white/40 mb-2">{product.vendor.store_name}</p>
                      )}
                      
                      <div className="flex items-baseline gap-2 mb-3">
                        {product.wholesale_price ? (
                          <>
                            <span className="text-lg font-medium">${product.wholesale_price}</span>
                            <span className="text-sm text-white/40 line-through">${product.regular_price}</span>
                          </>
                        ) : (
                          <span className="text-lg font-medium">${product.price}</span>
                        )}
                      </div>
                      
                      {product.wholesale_pricing && product.wholesale_pricing.length > 0 && (
                        <div className="mb-3 text-xs text-white/60">
                          <p className="mb-1">Tier Pricing:</p>
                          {product.wholesale_pricing.slice(0, 2).map((tier, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{tier.minimum_quantity}+ units:</span>
                              <span className="font-medium">${tier.unit_price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-white/40 mb-3">
                        Min. Order: {product.minimum_wholesale_quantity} units
                      </p>
                      
                      <button
                        onClick={() => {
                          addToCart({
                            productId: Number(product.id),
                            name: product.name,
                            price: product.wholesale_price || product.price,
                            quantity: product.minimum_wholesale_quantity,
                            tierName: 'Wholesale',
                            image: product.featured_image
                          });
                        }}
                        className="w-full py-2 bg-white text-black text-sm font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={16} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Distributors Grid
          <div>
            {distributors.length === 0 ? (
              <div className="text-center py-16">
                <Store className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <p className="text-white/60">No distributors available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {distributors.map((distributor) => (
                  <div key={distributor.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-medium mb-1">{distributor.store_name}</h3>
                        <p className="text-sm text-white/40">{distributor.vendor_type}</p>
                      </div>
                      <Store className="w-6 h-6 text-white/40" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Products:</span>
                        <span className="font-medium">{distributor.products?.count || 0}</span>
                      </div>
                      
                      {distributor.minimum_order_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Min. Order:</span>
                          <span className="font-medium">${distributor.minimum_order_amount}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedDistributor(distributor.id);
                        setViewMode('products');
                      }}
                      className="w-full py-2 bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all"
                    >
                      View Products
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

