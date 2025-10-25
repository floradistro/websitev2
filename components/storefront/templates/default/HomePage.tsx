/**
 * Default Template - Home Page Component
 * Simple, clean homepage design for vendors without a specific template
 */

"use client";

import Link from 'next/link';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
// import ProductsCarousel from '@/components/ProductsCarousel'; // Component doesn't exist
import { usePathname } from 'next/navigation';
import { Store, Truck, Shield } from 'lucide-react';

interface HomePageProps {
  vendor: VendorStorefront;
  products: any[];
  inventoryMap: { [key: number]: any[] };
  productFieldsMap: { [key: number]: any };
  locations?: any[];
  reviews?: any[];
}

export default function HomePage({
  vendor,
  products,
  inventoryMap,
  productFieldsMap,
  locations = [],
  reviews = [],
}: HomePageProps) {
  const pathname = usePathname();
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to {vendor.store_name}
            </h1>
            {vendor.store_tagline && (
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                {vendor.store_tagline}
              </p>
            )}
            <Link 
              href={`${basePath}/shop`}
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Store size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">Premium selection curated for you</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Truck size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Shipping</h3>
              <p className="text-gray-600">Quick delivery to your door</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Shield size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lab Tested</h3>
              <p className="text-gray-600">Third-party certified quality</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Carousel */}
      {products.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Products</h2>
            
          </div>
        </section>
      )}
    </div>
  );
}

