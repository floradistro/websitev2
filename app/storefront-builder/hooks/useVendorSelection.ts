/**
 * Vendor Selection Hook
 * Handles vendor switching and auto-updating code references
 */

import { useState, useEffect, useRef } from 'react';
import { Vendor } from '@/lib/storefront-builder/types';
import { updateVendorReferences, loadCodeBackup } from '@/lib/storefront-builder/utils';
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
          const floraDistro = data.vendors.find((v: Vendor) => v.id === 'cd2e1122-d511-4edb-be5d-98ef274b4baf');

          // AUTO-RESTORE: Check if there's a saved backup in localStorage
          const savedCode = loadCodeBackup('cd2e1122-d511-4edb-be5d-98ef274b4baf');

          if (savedCode && savedCode.trim().length > 100) {
            // Restore from auto-save (like Canva!)
            console.log('🔄 Restoring auto-saved work...');
            onCodeUpdate(savedCode);
          } else {
            // No backup found, use initial template
            console.log('✨ Starting with fresh template');
            onCodeUpdate(getInitialCode(floraDistro?.logo_url));
          }

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

    // AUTO-RESTORE: Check if new vendor has saved work
    const savedCode = loadCodeBackup(newVendorId);
    let updatedCode: string;

    if (savedCode && savedCode.trim().length > 100) {
      // Restore vendor's saved work (like Canva!)
      console.log(`🔄 Restoring auto-saved work for ${currentVendor.store_name}...`);
      updatedCode = savedCode;
    } else {
      // No saved work, update vendor references in current code
      console.log(`✨ Applying ${currentVendor.store_name} to current design...`);
      updatedCode = updateVendorReferences(
        currentCode,
        newVendorId,
        currentVendor.logo_url,
        prevVendor?.logo_url
      );
    }

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
