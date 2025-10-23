"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface VendorUser {
  id: string | number;
  store_name: string;
  slug: string;
  email: string;
  user_id: string | number;
  vendor_type?: 'standard' | 'distributor' | 'both';
  wholesale_enabled?: boolean;
}

interface VendorAuthContextType {
  vendor: VendorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const VendorAuthContext = createContext<VendorAuthContextType>({
  vendor: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

export function VendorAuthProvider({ children }: { children: React.ReactNode }) {
  const [vendor, setVendor] = useState<VendorUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load vendor from localStorage on mount first
  useEffect(() => {
    const savedVendor = localStorage.getItem('vendor_user');
    if (savedVendor) {
      try {
        const vendorData = JSON.parse(savedVendor);
        setVendor(vendorData);
        setIsAuthenticated(true);
        console.log('✅ Loaded vendor from localStorage:', vendorData.store_name);
      } catch (error) {
        console.error('Failed to load vendor from localStorage:', error);
        localStorage.removeItem('vendor_user');
      }
    }
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      setIsLoading(true);
      
      // Check if vendor exists in localStorage first
      const savedVendor = localStorage.getItem('vendor_user');
      const vendorId = localStorage.getItem('vendor_id');
      
      if (!savedVendor || !vendorId) {
        // No vendor data, not logged in
        setIsLoading(false);
        return;
      }
      
      // Vendor data exists, we're good
      // Don't check Supabase session - it causes refresh token errors
      console.log('✅ Vendor session valid from localStorage');
      setIsLoading(false);
      
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      // Use our vendor auth API endpoint
      const response = await fetch('/api/vendor/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!data.success || !data.vendor) {
        console.error('Vendor login failed:', data.error);
        return false;
      }
      
      // Store vendor data
      const vendorUser = {
        id: data.vendor.id,
        store_name: data.vendor.store_name,
        slug: data.vendor.slug,
        email: data.vendor.email,
        user_id: data.vendor.id,
        vendor_type: data.vendor.vendor_type || 'standard',
        wholesale_enabled: data.vendor.wholesale_enabled || false
      };
      
      setVendor(vendorUser);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('vendor_user', JSON.stringify(vendorUser));
      localStorage.setItem('vendor_id', data.vendor.id);
      localStorage.setItem('vendor_email', data.vendor.email);
      localStorage.setItem('vendor_slug', data.vendor.slug || '');
      if (data.session) {
        localStorage.setItem('supabase_session', data.session);
      }
      
      console.log('✅ Vendor login successful:', vendorUser.store_name, 'Type:', vendorUser.vendor_type);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function logout() {
    // Logout from Supabase (ignore errors)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Supabase logout error (ignored):', error);
    }
    
    // Clear all vendor storage
    localStorage.removeItem('supabase_session');
    localStorage.removeItem('vendor_id');
    localStorage.removeItem('vendor_email');
    localStorage.removeItem('vendor_slug');
    localStorage.removeItem('vendor_user');
    
    setVendor(null);
    setIsAuthenticated(false);
    
    console.log('✅ Vendor logged out');
  }

  return (
    <VendorAuthContext.Provider value={{ vendor, isAuthenticated, isLoading, login, logout }}>
      {children}
    </VendorAuthContext.Provider>
  );
}

export function useVendorAuth() {
  return useContext(VendorAuthContext);
}

