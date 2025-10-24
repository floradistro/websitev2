"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Globe, Instagram, ExternalLink, Store, CheckCircle, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (params.slug) {
      loadVendorData(params.slug as string);
    }
  }, [params.slug]);

  async function loadVendorData(slug: string) {
    try {
      setLoading(true);
      
      // Get vendor info
      const vendorRes = await fetch(`/api/supabase/vendors?slug=${slug}`);
      const vendorData = await vendorRes.json();
      
      if (!vendorData.success || !vendorData.vendors?.[0]) {
        router.push('/vendors');
        return;
      }
      
      const vendorInfo = vendorData.vendors[0];
      setVendor(vendorInfo);
      
      // Get vendor products
      const productsRes = await fetch(`/api/page-data/products`);
      const productsData = await productsRes.json();
      
      if (productsData.success) {
        const vendorProducts = productsData.data.products.filter(
          (p: any) => p.vendor_id === vendorInfo.id
        );
        setProducts(vendorProducts);
        setLocations(productsData.data.locations || []);
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return null;
  }

  const socialLinks = typeof vendor.social_links === 'string' 
    ? JSON.parse(vendor.social_links) 
    : vendor.social_links || {};

  const categories = [...new Set(products.flatMap((p: any) => 
    p.categories?.map((c: any) => c.name) || []
  ))].filter(Boolean);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categories?.some((c: any) => c.name === selectedCategory));
  
  // Get featured products (first 6 with images)
  const featuredProducts = products.filter(p => p.images?.[0]?.src).slice(0, 6);
  
  // Get new arrivals (most recent 6)
  const newArrivals = products.slice(0, 6);

  return (
    <div className="bg-[#2a2a2a] min-h-screen overflow-x-hidden w-full text-white">
      {/* Match Site Theme */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Vendor Header - Match Site Theme */}
      <div className="relative py-16 px-4 sm:px-6 border-b border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 via-[#1a1a1a]/35 to-[#1a1a1a]/30 backdrop-blur-sm"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <Link 
            href="/vendors"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to Vendors</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Logo */}
            <div className="lg:col-span-3">
              <div className="bg-[#3a3a3a] p-12 aspect-square flex items-center justify-center border border-white/10">
                <img 
                  src={vendor.logo_url || '/yacht-club-logo.png'} 
                  alt={vendor.store_name}
                  className="w-full h-full object-contain opacity-90"
                />
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-9">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 tracking-tight">
                {vendor.store_name}
              </h1>
              
              {vendor.store_tagline && (
                <p className="text-white/50 text-base font-light mb-6">
                  {vendor.store_tagline}
                </p>
              )}

              {vendor.store_description && (
                <p className="text-white/60 text-sm font-light leading-relaxed mb-8 max-w-2xl">
                  {vendor.store_description}
                </p>
              )}
              
              <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent mb-8"></div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mb-6">
                {vendor.total_locations && (
                  <div className="bg-[#3a3a3a]/30 backdrop-blur-md border border-white/10 hover:border-purple-500/30 p-4 transition-all">
                    <div className="text-white text-3xl font-light mb-1">{vendor.total_locations}</div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider">Locations</div>
                  </div>
                )}
                <div className="bg-[#3a3a3a]/30 backdrop-blur-md border border-white/10 hover:border-purple-500/30 p-4 transition-all">
                  <div className="text-white text-3xl font-light mb-1">{products.length}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">Products</div>
                </div>
                <div className="bg-[#3a3a3a]/30 backdrop-blur-md border border-white/10 hover:border-purple-500/30 p-4 transition-all">
                  <div className="text-white text-3xl font-light mb-1">{categories.length}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">Categories</div>
                </div>
              </div>

              {/* Contact & Social */}
              <div className="flex flex-wrap gap-2 text-sm text-white/60">
                {vendor.city && vendor.state && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    <span>{vendor.city}, {vendor.state}</span>
                  </div>
                )}
                {vendor.phone && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} />
                      <span>{vendor.phone}</span>
                    </div>
                  </>
                )}
                {socialLinks.instagram && (
                  <>
                    <span>•</span>
                    <a 
                      href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                    >
                      <Instagram size={14} />
                      <span>{socialLinks.instagram}</span>
                    </a>
                  </>
                )}
                {socialLinks.website && (
                  <>
                    <span>•</span>
                    <a 
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                    >
                      <Globe size={14} />
                      <span>Website</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Category Filter - Match Site Theme */}
      {categories.length > 0 && (
        <div className="relative py-8 px-4 sm:px-6 border-b border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
          <div className="absolute inset-0 bg-[#2a2a2a]/30 backdrop-blur-sm"></div>
          
          <div className="max-w-7xl mx-auto relative flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-3 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => 
                p.categories?.some((c: any) => c.name === cat)
              ).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-3 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/40">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/5">
            {filteredProducts.map((product: any, index: number) => {
              const vendorInfo = {
                name: vendor.store_name,
                logo: vendor.logo_url || '/yacht-club-logo.png',
                slug: vendor.slug
              };
              
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                  locations={locations}
                  pricingTiers={product.pricing_tiers || []}
                  productFields={{ fields: product.fields || {} }}
                  inventory={product.inventory || []}
                  vendorInfo={vendorInfo}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
