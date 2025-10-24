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
  
  // Find shop_config section
  const shopConfigSection = sections.find(s => s.section_key === 'shop_config');
  const [config, setConfig] = useState(shopConfigSection?.content_data || {});
  
  // Update config when sections change
  useEffect(() => {
    const newConfig = shopConfigSection?.content_data || {};
    const configString = JSON.stringify(newConfig);
    const currentConfigString = JSON.stringify(config);
    
    // Only update if content actually changed
    if (configString !== currentConfigString) {
      setConfig(newConfig);
    }
  }, [sections]);

  return (
    <StorefrontShopClient 
      vendorId={vendorId}
      config={config}
    />
  );
}

