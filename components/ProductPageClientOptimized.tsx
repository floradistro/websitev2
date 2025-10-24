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
  
  // Use SWR with bulk products endpoint (same as storefront)
  const { data: bulkData, error, isLoading } = useSWR(
    `/api/page-data/products`,
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );
  
  // Extract the specific product from bulk data and map images
  const data = bulkData?.success ? {
    success: true,
    data: {
      product: (() => {
        const p = bulkData.data.products.find((prod: any) => 
          prod.id === productId || prod.slug === productId
        );
        if (!p) return null;
        
        // Map images from storage fields to images array
        const images = [];
        if (p.featured_image_storage) {
          images.push({ src: p.featured_image_storage, id: 0, name: p.name });
        }
        if (p.image_gallery_storage && Array.isArray(p.image_gallery_storage)) {
          p.image_gallery_storage.forEach((img: string, idx: number) => {
            images.push({ src: img, id: images.length, name: p.name });
          });
        }
        
        return {
          ...p,
          images: images.length > 0 ? images : p.images || []
        };
      })(),
      relatedProducts: bulkData.data.products.filter((p: any) => 
        (p.id !== productId && p.slug !== productId)
      ).slice(0, 12).map((p: any) => ({
        ...p,
        images: p.featured_image_storage 
          ? [{ src: p.featured_image_storage, id: 0, name: p.name }]
          : p.images || []
      }))
    }
  } : bulkData;

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
  const inventory = product?.inventory || [];
  const pricingTiers = product?.pricing_tiers || [];
  
  // Extract locations from inventory and mark as active (they have stock)
  const locations = inventory.map((inv: any) => ({
    ...inv.location,
    is_active: "1" // Mark as active since it has inventory
  })).filter(Boolean);

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

