"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from 'swr';
import ProductPageClient from "./ProductPageClient";

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
  
  // Use SWR for instant cached loads
  const { data, error, isLoading } = useSWR(
    `/api/product/${productId}`,
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

  const { product, inventory, locations, pricingRules, productFields } = data;

  // Extract blueprint name from product category
  let blueprintName = null;
  if (product?.categories && product.categories.length > 0) {
    const categorySlug = product.categories[0].slug;
    if (categorySlug.includes('flower') || categorySlug.includes('pre-roll')) {
      blueprintName = 'flower_blueprint';
    } else if (categorySlug.includes('concentrate') || categorySlug.includes('extract')) {
      blueprintName = 'concentrate_blueprint';
    } else if (categorySlug.includes('edible')) {
      blueprintName = 'edibles_blueprint';
    } else if (categorySlug.includes('vape') || categorySlug.includes('cart')) {
      blueprintName = 'vape_blueprint';
    } else if (categorySlug.includes('beverage') || categorySlug.includes('drink')) {
      blueprintName = 'beverage_blueprint';
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={productId}
        initial={{ opacity: 0 }}
        animate={{ opacity: isReady ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {data && (
          <ProductPageClient
            product={product}
            locations={locations || []}
            inventory={inventory || []}
            pricingRules={pricingRules}
            blueprintName={blueprintName}
            orderType={undefined}
            relatedProducts={[]}
            reviews={[]}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

