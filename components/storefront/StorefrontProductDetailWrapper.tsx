"use client";

import { useState, useEffect } from 'react';
import { useLiveEditing } from './LiveEditingProvider';
import { StorefrontProductDetail } from './StorefrontProductDetail';

interface StorefrontProductDetailWrapperProps {
  productSlug: string;
  vendorId: string;
}

/**
 * Wrapper for StorefrontProductDetail that consumes live editing context
 * Allows product_detail_config changes to update in real-time
 */
export function StorefrontProductDetailWrapper({ productSlug, vendorId }: StorefrontProductDetailWrapperProps) {
  const { sections } = useLiveEditing();
  
  const [config, setConfig] = useState(() => {
    const configSection = sections.find(s => s.section_key === 'product_detail_config');
    return configSection?.content_data || {};
  });
  
  // Update config when sections change
  useEffect(() => {
    const configSection = sections.find(s => s.section_key === 'product_detail_config');
    const newConfig = configSection?.content_data || {};
    setConfig(newConfig);
  }, [sections]);

  return (
    <StorefrontProductDetail 
      productSlug={productSlug}
      vendorId={vendorId}
      config={config}
    />
  );
}

