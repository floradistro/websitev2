"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";

interface ProductRecommendationsProps {
  currentProduct?: any;
  allProducts: any[];
  locations: any[];
  inventoryMap: any;
  productFieldsMap: any;
}

export default function ProductRecommendations({ 
  currentProduct, 
  allProducts,
  locations,
  inventoryMap,
  productFieldsMap
}: ProductRecommendationsProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [currentProduct, user]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Get order history if user is logged in
      let orderHistory = [];
      let wishlist = [];
      
      if (user) {
        // Load order history from localStorage or API
        const savedOrders = localStorage.getItem('flora-order-history');
        if (savedOrders) {
          orderHistory = JSON.parse(savedOrders);
        }
        
        // Load wishlist
        const savedWishlist = localStorage.getItem('flora-wishlist');
        if (savedWishlist) {
          wishlist = JSON.parse(savedWishlist);
        }
      }

      // Call AI recommendation endpoint
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderHistory,
          currentProduct,
          wishlist,
          allProducts: allProducts.slice(0, 50) // Send sample
        })
      });

      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        // Fallback: show popular products
        const popular = allProducts
          .filter(p => p.stock_status === 'in_stock')
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);
        setRecommendations(popular);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback
      const popular = allProducts
        .filter(p => p.stock_status === 'in_stock')
        .slice(0, 6);
      setRecommendations(popular);
    } finally {
      setLoading(false);
    }
  };

  if (loading || recommendations.length === 0) return null;

  return (
    <section className="bg-[#2a2a2a] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles size={20} className="text-amber-400" />
          <h2 className="text-2xl font-light text-white uppercase tracking-wider">
            Recommended For You
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recommendations.map((product, index) => (
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
      </div>
    </section>
  );
}

