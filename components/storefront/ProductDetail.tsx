'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  retail_price: number;
  category: string;
  strain_type?: string;
  thc_content?: number;
  cbd_content?: number;
  terpenes?: any;
  effects?: string[];
  vendor_id: string;
}

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/placeholder-product.png'];

  const price = typeof product.retail_price === 'number' 
    ? product.retail_price.toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <span className="text-sm text-gray-500 uppercase tracking-wide">
              {product.category}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={18} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-gray-600">(0 reviews)</span>
          </div>

          <div className="text-4xl font-bold mb-6">${price}</div>

          <p className="text-gray-700 leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Strain Info */}
          {(product.strain_type || product.thc_content || product.cbd_content) && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-4">Product Details</h3>
              <div className="space-y-2 text-sm">
                {product.strain_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strain Type:</span>
                    <span className="font-medium capitalize">{product.strain_type}</span>
                  </div>
                )}
                {product.thc_content && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">THC Content:</span>
                    <span className="font-medium">{product.thc_content}%</span>
                  </div>
                )}
                {product.cbd_content && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CBD Content:</span>
                    <span className="font-medium">{product.cbd_content}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <button 
              className="w-full btn-primary flex items-center justify-center gap-2"
              onClick={() => {
                // TODO: Add to cart
                console.log('Add to cart:', product.id, quantity);
              }}
            >
              <ShoppingCart size={20} />
              Add to Cart
            </button>

            <div className="flex gap-4">
              <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                <Heart size={20} />
                Wishlist
              </button>
              <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                <Share2 size={20} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

