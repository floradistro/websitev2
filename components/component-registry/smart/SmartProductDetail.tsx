/**
 * Smart Component: SmartProductDetail
 * Renders full product detail with images, pricing tiers, and fields
 */

"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export interface SmartProductDetailProps {
  productSlug?: string; // If not provided, extract from URL
  vendorId: string;
  showGallery?: boolean;
  showPricingTiers?: boolean;
  showFields?: boolean;
  showAddToCart?: boolean;
  className?: string;
}

export function SmartProductDetail({
  productSlug: propsSlug,
  vendorId,
  showGallery = true,
  showPricingTiers = true,
  showFields = true,
  showAddToCart = true,
  className = '',
}: SmartProductDetailProps) {
  const pathname = usePathname();
  const [product, setProduct] = useState<any>(null);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extract slug from URL if not provided
  const productSlug = propsSlug || pathname?.split('/').pop();

  useEffect(() => {
    if (!productSlug || !vendorId) return;

    async function loadProduct() {
      try {
        setLoading(true);
        
        // Fetch products via the working /api/products endpoint
        const res = await fetch(`/api/products?vendor_id=${vendorId}&limit=100`);
        if (!res.ok) {
          console.error('Failed to fetch products:', res.status);
          return;
        }

        const data = await res.json();
        if (!data.success) {
          console.error('API returned error:', data);
          return;
        }

        // Find this product
        const foundProduct = data.products.find((p: any) => 
          p.slug === productSlug
        );

        if (!foundProduct) {
          console.error('Product not found:', productSlug, 'in', data.products.length, 'products');
          return;
        }

        setProduct(foundProduct);

        // Use pricing tiers from product (already attached by API)
        if (foundProduct.pricing_tiers && foundProduct.pricing_tiers.length > 0) {
          setPricingTiers(foundProduct.pricing_tiers);
          setSelectedTier(foundProduct.pricing_tiers[0]);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productSlug, vendorId]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-neutral-900 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-900 rounded w-3/4" />
            <div className="h-6 bg-neutral-900 rounded w-1/4" />
            <div className="h-24 bg-neutral-900 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-neutral-500">Product not found</p>
      </div>
    );
  }

  const currentPrice = selectedTier?.price || product.price || 0;
  const pricePerUnit = selectedTier?.price_per_gram || (currentPrice / (selectedTier?.quantity || 1));

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${className}`}>
      {/* Gallery */}
      {showGallery && (
        <div className="space-y-4">
          {/* Main Image */}
          {product.featured_image_storage && (
            <div className="aspect-square relative bg-neutral-900 rounded-lg overflow-hidden">
              <Image
                src={product.featured_image_storage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
          
          {/* Thumbnail Gallery */}
          {product.image_gallery_storage && product.image_gallery_storage.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.image_gallery_storage.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square relative bg-neutral-900 rounded overflow-hidden cursor-pointer hover:ring-2 ring-white">
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Info */}
      <div className="space-y-6">
        {/* Name & Price */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{product.name}</h1>
          <p className="text-2xl text-white font-semibold">
            ${currentPrice}
            {pricePerUnit !== currentPrice && (
              <span className="text-sm text-neutral-400 ml-2">
                (${pricePerUnit.toFixed(2)}/g)
              </span>
            )}
          </p>
        </div>

        {/* Pricing Tiers */}
        {showPricingTiers && pricingTiers.length > 0 && (
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Select Quantity</label>
            <select
              value={selectedTier?.break_id || ''}
              onChange={(e) => {
                const tier = pricingTiers.find(t => t.break_id === e.target.value);
                setSelectedTier(tier);
              }}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white"
            >
              {pricingTiers.map((tier: any) => (
                <option key={tier.break_id} value={tier.break_id}>
                  {tier.label} - ${tier.price} (${tier.price_per_gram?.toFixed(2)}/g)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div>
            <p className="text-neutral-300 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Blueprint Fields */}
        {showFields && product.blueprint_fields && product.blueprint_fields.length > 0 && (
          <div className="border-t border-neutral-800 pt-6">
            <h3 className="text-sm font-semibold text-white mb-3">Product Details</h3>
            <dl className="space-y-2">
              {product.blueprint_fields.map((field: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <dt className="text-neutral-400">{field.field_name || field.label}:</dt>
                  <dd className="text-white font-medium">{field.field_value || field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Add to Cart */}
        {showAddToCart && (
          <button className="w-full bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-neutral-200 transition-all">
            Add to Cart - ${currentPrice}
          </button>
        )}

        {/* Stock Status */}
        <div className="text-xs text-neutral-500">
          {product.stock_status === 'instock' ? (
            <span className="text-green-500">✓ In Stock</span>
          ) : (
            <span className="text-red-500">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}

