"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from 'swr';
import ProductPageClient from "./ProductPageClient";
import ProductRecommendations from "./ProductRecommendations";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ProductPageClientOptimizedProps {
  productId: string;
  initialData?: any;
}

export default function ProductPageClientOptimized({ 
  productId, 
  initialData 
}: ProductPageClientOptimizedProps) {
  const [isReady, setIsReady] = useState(false);
  
  // Use SWR for instant cached loads with bulk endpoint
  const { data, error, isLoading } = useSWR(
    `/api/page-data/product/${productId}`,
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  useEffect(() => {
    // Delay for smooth transition
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Show nothing while loading (instant feel)
  if (isLoading || !data) {
    return <div className="min-h-screen bg-[#1a1a1a]" />;
  }

  // Only show error if actual error after data loaded
  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white/50 text-center">
          <p className="text-xl mb-4">Product not found</p>
          <a href="/products" className="text-white underline">Back to products</a>
        </div>
      </div>
    );
  }

  const { product, relatedProducts } = data.data || data;
  
  if (!product) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white/50 text-center">
          <p className="text-xl mb-4">Product not found</p>
          <a href="/products" className="text-white underline">Back to products</a>
        </div>
      </div>
    );
  }
  
  const inventory = product?.inventory || [];
  const pricingTiers = product?.pricing_tiers || [];
  
  // Extract locations from inventory and mark as active (they have stock)
  const locations = inventory
    .filter((inv: any) => inv?.location)
    .map((inv: any) => ({
      ...inv.location,
      is_active: "1" // Mark as active since it has inventory
    }));

  return (
    <motion.div
      key={productId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      <ProductPageClient
        product={product}
        locations={locations}
        inventory={inventory}
        pricingTiers={pricingTiers}
        orderType={undefined}
        relatedProducts={relatedProducts || []}
        reviews={[]}
      />
    </motion.div>
  );
}

