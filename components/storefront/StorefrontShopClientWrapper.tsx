"use client";

import { useState, useEffect } from 'react';
import { useLiveEditing } from './LiveEditingProvider';
import { StorefrontShopClient } from './StorefrontShopClient';

interface StorefrontShopClientWrapperProps {
  vendorId: string;
}

/**
 * Wrapper for StorefrontShopClient that consumes live editing context
 * Allows shop_config changes to update in real-time during live editing
 * WITHOUT full page refresh
 */
export function StorefrontShopClientWrapper({ vendorId }: StorefrontShopClientWrapperProps) {
  const { sections } = useLiveEditing();
  
  const [config, setConfig] = useState(() => {
    const shopConfigSection = sections.find(s => s.section_key === 'shop_config');
    return shopConfigSection?.content_data || {};
  });
  
  // Update config when sections change - use sections directly as dependency
  useEffect(() => {
    const shopConfigSection = sections.find(s => s.section_key === 'shop_config');
    const newConfig = shopConfigSection?.content_data || {};
    setConfig(newConfig);
  }, [sections]);

  return (
    <StorefrontShopClient 
      vendorId={vendorId}
      config={config}
    />
  );
}

