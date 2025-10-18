"use client";

import { useEffect, useState } from 'react';
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Calendar, CheckCircle } from "lucide-react";

// Mock vendor data - will be from API later
const vendors: any = {
  'yacht-club': {
    id: 1,
    name: 'Yacht Club',
    slug: 'yacht-club',
    logo: '/yachtclub.png',
    banner: '',
    tagline: 'Premium Cannabis from the Coast',
    about: 'Yacht Club brings you premium coastal cannabis cultivated with the same attention to detail as a luxury yacht. Every product is carefully crafted, lab tested by Quantix Analytics, and delivered with the highest standards of quality and service.',
    primaryColor: '#0EA5E9',
    location: 'Newport Beach, CA',
    joinedDate: '2025-08-01',
    rating: 4.9,
    totalReviews: 47,
    verified: true,
    website: 'https://yachtclubcannabis.com',
    instagram: '@yachtclubcannabis',
    productIds: [50001, 50002, 50003, 50004, 50005, 50006, 50007, 50008, 50009],
    fontFamily: 'Lobster'
  },
  'cannaboyz': {
    id: 2,
    name: 'CannaBoyz',
    slug: 'cannaboyz',
    logo: '/CannaBoyz.png',
    banner: '',
    tagline: 'Street Certified, Lab Tested',
    about: 'CannaBoyz is bringing authentic street culture to the legal cannabis market. Based in LA, we source the realest cuts and provide lab-tested quality without the boutique price tag. Every product is grown with passion and tested by Quantix Analytics for your safety.',
    primaryColor: '#10B981',
    location: 'Los Angeles, CA',
    joinedDate: '2025-09-15',
    rating: 4.8,
    totalReviews: 38,
    verified: true,
    website: 'https://cannaboyz.com',
    instagram: '@cannaboyz',
    productIds: [60001, 60002, 60003, 60004, 60005, 60006],
    fontFamily: 'Monkey Act'
  },
  'moonwater': {
    id: 3,
    name: 'Moonwater',
    slug: 'moonwater',
    logo: '/moonwater.png',
    banner: '',
    tagline: 'Premium THC Beverages',
    about: 'Moonwater crafts premium THC-infused beverages for the modern cannabis consumer. Our drinks feature precise 10mg dosing, zero calories, and fast-acting nano-emulsion technology. Based in San Diego, we\'re redefining cannabis consumption with clean ingredients and sophisticated flavors.',
    primaryColor: '#1e40af',
    location: 'San Diego, CA',
    joinedDate: '2025-07-20',
    rating: 4.9,
    totalReviews: 52,
    verified: true,
    website: 'https://trymoonwater.com',
    instagram: '@moonwater',
    productIds: [70001, 70002, 70003, 70004],
    fontFamily: 'monospace',
    useBrackets: true
  },
  'zarati': {
    id: 4,
    name: 'Zarati',
    slug: 'zarati',
    logo: '/zarati.png',
    banner: '',
    tagline: 'Exotic Genetics, Premium Quality',
    about: 'Zarati specializes in rare exotic genetics and premium indoor cultivation. Based in Oakland, we hunt the latest hype strains and bring them to market with meticulous care. Every batch is small-batch, hand-trimmed, and lab tested by Quantix Analytics for maximum potency and purity.',
    primaryColor: '#8b5cf6',
    location: 'Oakland, CA',
    joinedDate: '2025-09-01',
    rating: 4.7,
    totalReviews: 29,
    verified: true,
    website: 'https://zarati.com',
    instagram: '@zaraticannabis',
    productIds: [80001, 80002, 80003, 80004, 80005],
    fontFamily: 'inherit'
  }
};

export default function VendorStorefront() {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get slug from URL
    const slug = window.location.pathname.split('/').pop();
    const vendorData = vendors[slug || 'yacht-club'];
    setVendor(vendorData);
    setLoading(false);
  }, []);

  if (loading || !vendor) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Mock product data based on vendor
  const productsByVendor: any = {
    'yacht-club': [
      { id: 50001, name: 'OG Kush', price: '15.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50002, name: 'Blue Dream', price: '14.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50003, name: 'Sour Diesel', price: '16.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50004, name: 'Girl Scout Cookies', price: '17.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50005, name: 'Gelato', price: '18.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50006, name: 'Sunset Sherbet', price: '17.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50007, name: 'Purple Punch', price: '16.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50008, name: 'Zkittlez', price: '15.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 50009, name: 'Wedding Cake', price: '18.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
    ],
    'cannaboyz': [
      { id: 60001, name: 'Gorilla Glue #4', price: '16.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 60002, name: 'White Widow', price: '15.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 60003, name: 'Northern Lights', price: '14.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 60004, name: 'AK-47', price: '16.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 60005, name: 'Granddaddy Purple', price: '17.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 60006, name: 'Jack Herer', price: '16.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
    ],
    'moonwater': [
      { id: 70001, name: '[CITRUS BLEND]', price: '8.99', images: [], categories: [{ name: 'Beverages' }], meta_data: [] },
      { id: 70002, name: '[BERRY FUSION]', price: '8.99', images: [], categories: [{ name: 'Beverages' }], meta_data: [] },
      { id: 70003, name: '[TROPICAL WAVE]', price: '8.99', images: [], categories: [{ name: 'Beverages' }], meta_data: [] },
      { id: 70004, name: '[MINT REFRESH]', price: '8.99', images: [], categories: [{ name: 'Beverages' }], meta_data: [] },
    ],
    'zarati': [
      { id: 80001, name: 'Runtz', price: '19.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 80002, name: 'Biscotti', price: '18.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 80003, name: 'Jealousy', price: '20.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 80004, name: 'Cereal Milk', price: '19.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
      { id: 80005, name: 'Ice Cream Cake', price: '18.99', images: [], categories: [{ name: 'Flower' }], meta_data: [] },
    ]
  };

  const vendorProducts = productsByVendor[vendor.slug] || [];

  const locations: any[] = [];
  const inventoryMap: { [key: number]: any[] } = {};
  const productFieldsMap: { [key: number]: any } = {};
  
  vendorProducts.forEach((product: any) => {
    productFieldsMap[product.id] = { fields: {}, pricingTiers: [] };
  });

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Back Navigation */}
      <div className="border-b border-white/5 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Link 
            href="/products"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Link>
        </div>
      </div>

      {/* Vendor Header */}
      <div className="border-b border-white/5 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            <div className="w-24 h-24 bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-contain p-2" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl text-white mb-2 tracking-wide" style={{ fontFamily: vendor.fontFamily || 'Lobster' }}>
                  {vendor.useBrackets ? `[${vendor.name.toUpperCase()}]` : vendor.name}
                </h1>
                  <p className="text-white/60 text-sm mb-3">{vendor.tagline}</p>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-xs text-white/50">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      <span>{vendor.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      <span>Joined {new Date(vendor.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    {vendor.verified && (
                      <div className="flex items-center gap-1.5 text-green-500">
                        <CheckCircle size={12} />
                        <span>Verified Vendor</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-white text-2xl font-light">{vendor.rating}</span>
                  </div>
                  <p className="text-white/40 text-xs">{vendor.totalReviews} reviews</p>
                </div>
              </div>

              {/* About */}
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                {vendor.about}
              </p>

              {/* Links */}
              <div className="flex gap-3 text-xs">
                {vendor.website && (
                  <a 
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    Website
                  </a>
                )}
                {vendor.instagram && (
                  <span className="text-white/60">{vendor.instagram}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h2 className="text-xl font-light uppercase tracking-wider text-white mb-2">
            {vendor.name} Products
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        {vendorProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No products available from this vendor</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/5">
            {vendorProducts.map((product: any, index: number) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                locations={locations}
                pricingTiers={productFieldsMap[product.id]?.pricingTiers || []}
                productFields={productFieldsMap[product.id]}
                inventory={inventoryMap[product.id] || []}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inject Fonts */}
      <style jsx global>{`
        @font-face {
          font-family: 'Lobster';
          src: url('/Lobster 1.4.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'Monkey Act';
          src: url('/Monkey Act - Personal Use.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}

