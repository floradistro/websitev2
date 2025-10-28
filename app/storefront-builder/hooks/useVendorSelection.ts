/**
 * Vendor Selection Hook
 * Handles vendor switching and auto-updating code references
 */

import { useState, useEffect, useRef } from 'react';
import { Vendor } from '@/lib/storefront-builder/types';
import { updateVendorReferences } from '@/lib/storefront-builder/utils';
import { getInitialCode } from '@/lib/storefront-builder/constants';

export function useVendorSelection(onCodeUpdate: (code: string) => void, onPreviewRefresh: () => void) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('cd2e1122-d511-4edb-be5d-98ef274b4baf'); // Flora Distro default
  const prevVendorRef = useRef<string>('');

  // Fetch vendors on mount
  useEffect(() => {
    fetch('/api/admin/vendors')
      .then(res => res.json())
      .then(data => {
        if (data.vendors) {
          setVendors(data.vendors);
          // Set initial code with Flora Distro logo
          const floraDistro = data.vendors.find((v: Vendor) => v.id === 'cd2e1122-d511-4edb-be5d-98ef274b4baf');
          onCodeUpdate(getInitialCode(floraDistro?.logo_url));
          // Set initial vendor ref
          prevVendorRef.current = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
        }
      })
      .catch(err => {
        // Vendor fetch failed - continue with default
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update code when vendor changes
  const handleVendorChange = (newVendorId: string, currentCode: string) => {
    if (!newVendorId || vendors.length === 0) return currentCode;

    // Skip if vendor hasn't actually changed
    if (prevVendorRef.current === newVendorId) return currentCode;

    const currentVendor = vendors.find(v => v.id === newVendorId);
    const prevVendor = vendors.find(v => v.id === prevVendorRef.current);
    if (!currentVendor) return currentCode;

    // Update all vendor-specific references in code
    const updatedCode = updateVendorReferences(
      currentCode,
      newVendorId,
      currentVendor.logo_url,
      prevVendor?.logo_url
    );

    // Update ref to track current vendor
    prevVendorRef.current = newVendorId;

    // Force refresh preview after vendor change
    setTimeout(() => {
      onPreviewRefresh();
    }, 500);

    return updatedCode;
  };

  return {
    vendors,
    selectedVendor,
    setSelectedVendor,
    currentVendor: vendors.find(v => v.id === selectedVendor),
    handleVendorChange,
  };
}
