"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Globe, Instagram, ExternalLink, Store } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
        <style jsx>{`
          @keyframes subtle-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
        <div className="w-2 h-2 bg-white/30 rounded-full" style={{ animation: 'subtle-pulse 2s infinite' }} />
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
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Refined Glass Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .fade-in {
          animation: fade-in 0.6s ease-out both;
        }
        .subtle-pulse {
          animation: subtle-pulse 2s infinite;
        }
        .minimal-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .subtle-glow {
          box-shadow: 0 0 40px rgba(255, 255, 255, 0.03);
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Gradient Header Background */}
      <div className="bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#1a1a1a] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12 fade-in">
          <Link 
            href="/vendors"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-[10px] uppercase tracking-widest transition-colors mb-10 font-light"
          >
            <ArrowLeft size={12} />
            ALL VENDORS
          </Link>

          {/* Vendor Profile Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Logo */}
            <div className="lg:col-span-3">
              <div className="minimal-glass subtle-glow p-10 aspect-square flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
                <img 
                  src={vendor.logo_url || '/yacht-club-logo.png'} 
                  alt={vendor.store_name}
                  className="w-full h-full object-contain opacity-90"
                />
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-9">
              <h1 className="text-5xl font-thin text-white tracking-tight mb-3">
                {vendor.store_name}
              </h1>
              
              {vendor.store_tagline && (
                <p className="text-white/50 text-sm font-light mb-6">
                  {vendor.store_tagline}
                </p>
              )}

              {vendor.store_description && (
                <p className="text-white/60 text-sm font-light leading-relaxed mb-8 max-w-2xl">
                  {vendor.store_description}
                </p>
              )}

              {/* Stats Grid - Enhanced Contrast */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {vendor.city && vendor.state && (
                  <div className="minimal-glass subtle-glow p-5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={12} className="text-white/40" />
                      <div className="text-[9px] uppercase tracking-widest text-white/40 font-light">LOCATION</div>
                    </div>
                    <div className="text-xs text-white/90 font-light">{vendor.city}, {vendor.state}</div>
                  </div>
                )}
                {vendor.phone && (
                  <div className="minimal-glass subtle-glow p-5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={12} className="text-white/40" />
                      <div className="text-[9px] uppercase tracking-widest text-white/40 font-light">PHONE</div>
                    </div>
                    <div className="text-xs text-white/90 font-light">{vendor.phone}</div>
                  </div>
                )}
                {vendor.total_locations && (
                  <div className="minimal-glass subtle-glow p-5 hover:bg-white/[0.04] transition-all">
                    <div className="text-white text-2xl font-thin mb-1">{vendor.total_locations}</div>
                    <div className="text-[9px] uppercase tracking-widest text-white/40 font-light">LOCATIONS</div>
                  </div>
                )}
                <div className="minimal-glass subtle-glow p-5 hover:bg-white/[0.04] transition-all">
                  <div className="text-white/90 text-2xl font-thin mb-1">{products.length}</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/40 font-light">PRODUCTS</div>
                </div>
              </div>

              {/* Social Links - Enhanced */}
              <div className="flex flex-wrap gap-3">
                {socialLinks.website && (
                  <a 
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 minimal-glass hover:bg-white/[0.05] hover:border-white/15 px-5 py-2.5 text-[10px] uppercase tracking-widest text-white/60 hover:text-white transition-all font-light"
                  >
                    <Globe size={12} />
                    WEBSITE
                    <ExternalLink size={9} className="opacity-50" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a 
                    href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 minimal-glass hover:bg-white/[0.05] hover:border-white/15 px-5 py-2.5 text-[10px] uppercase tracking-widest text-white/60 hover:text-white transition-all font-light"
                  >
                    <Instagram size={12} />
                    {socialLinks.instagram}
                    <ExternalLink size={9} className="opacity-50" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-16 fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-white/40 via-white/20 to-transparent"></div>
            <div>
              <h2 className="text-2xl font-light text-white tracking-tight">Featured</h2>
              <p className="text-white/40 text-[10px] font-light tracking-widest uppercase">Handpicked Selection</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredProducts.map((product: any, index: number) => (
              <Link 
                key={product.id}
                href={`/products/${product.id}`}
                className="group relative overflow-hidden"
              >
                <div className="relative aspect-square bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                  <img 
                    src={product.images?.[0]?.src || vendor.logo_url}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute bottom-2 left-2 right-2 z-20">
                    <p className="text-white text-xs font-light truncate">{product.name}</p>
                    <p className="text-white/60 text-[10px] font-light">${parseFloat(product.price || 0).toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Brand Story - Elegant Highlight */}
      {vendor.store_description && vendor.store_description.length > 20 && (
        <div className="max-w-7xl mx-auto px-6 py-16 fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/10 p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_50%)]"></div>
            <div className="relative max-w-3xl mx-auto text-center">
              <div className="w-1 h-12 bg-gradient-to-b from-white/30 via-white/10 to-transparent mx-auto mb-6"></div>
              <h2 className="text-3xl font-extralight text-white/90 tracking-tight mb-6">Our Story</h2>
              <p className="text-white/60 text-sm font-light leading-relaxed">
                {vendor.store_description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter - Elegant */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-10 fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-white/30 via-white/10 to-transparent"></div>
            <h2 className="text-white/50 text-xs font-light tracking-[0.2em]">FULL CATALOG</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`relative px-5 py-3.5 text-[10px] font-light tracking-widest transition-all whitespace-nowrap overflow-hidden ${
                selectedCategory === 'all'
                  ? 'bg-white text-black'
                  : 'bg-[#0a0a0a] border border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              ALL · {products.length}
            </button>
            {categories.map(cat => {
              const count = products.filter(p => 
                p.categories?.some((c: any) => c.name === cat)
              ).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-5 py-3.5 text-[10px] font-light tracking-widest transition-all whitespace-nowrap overflow-hidden ${
                    selectedCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-[#0a0a0a] border border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  {cat} · {count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16 fade-in" style={{ animationDelay: '0.8s' }}>
        {filteredProducts.length === 0 ? (
          <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 p-20 text-center">
            <p className="text-white/40 text-sm font-light tracking-widest">NO PRODUCTS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      {/* Quality Guarantee Footer */}
      {products.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-16 fade-in" style={{ animationDelay: '1s' }}>
          <div className="relative bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_60%)]"></div>
            
            <div className="relative p-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div className="group/trust">
                  <div className="w-2 h-2 bg-white/40 rounded-full mx-auto mb-3 group-hover/trust:bg-white/60 transition-colors"></div>
                  <div className="text-white/70 text-xs font-light tracking-wide">Lab Tested</div>
                </div>
                <div className="group/trust">
                  <CheckCircle size={16} className="text-white/40 mx-auto mb-3 group-hover/trust:text-white/60 transition-colors" />
                  <div className="text-white/70 text-xs font-light tracking-wide">Licensed Vendor</div>
                </div>
                <div className="group/trust">
                  <div className="w-2 h-2 bg-white/40 rounded-full mx-auto mb-3 group-hover/trust:bg-white/60 transition-colors"></div>
                  <div className="text-white/70 text-xs font-light tracking-wide">Quality Guaranteed</div>
                </div>
                <div className="group/trust">
                  <div className="w-2 h-2 bg-white/40 rounded-full mx-auto mb-3 group-hover/trust:bg-white/60 transition-colors"></div>
                  <div className="text-white/70 text-xs font-light tracking-wide">Secure Transactions</div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
        </div>
      )}
    </div>
  );
}
