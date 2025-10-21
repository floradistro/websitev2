"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface VendorUser {
  id: number;
  store_name: string;
  slug: string;
  email: string;
  user_id: number;
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

  // Check if vendor is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      setIsLoading(true);
      
      // Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // No valid session
        setIsLoading(false);
        return;
      }
      
      // Get vendor data from Supabase
      const vendorId = localStorage.getItem('vendor_id');
      const vendorEmail = localStorage.getItem('vendor_email');
      
      if (!vendorId || !vendorEmail) {
        // Missing vendor data, logout
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Fetch current vendor data
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendorData) {
        // Vendor not found, clear session
        await supabase.auth.signOut();
        localStorage.clear();
        setIsLoading(false);
        return;
      }

      // Set vendor state
      setVendor({
        id: vendorData.wordpress_user_id || 0,
        store_name: vendorData.store_name,
        slug: vendorData.slug,
        email: vendorData.email,
        user_id: vendorData.wordpress_user_id || 0
      });
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      // 1. Login to Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.session) {
        console.error('Supabase login failed:', authError);
        return false;
      }

      // 2. Get vendor profile from Supabase
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('email', email)
        .single();

      if (vendorError || !vendorData) {
        console.error('Vendor not found in Supabase:', vendorError);
        await supabase.auth.signOut();
        return false;
      }

      // 3. Store auth data (SIMPLIFIED - just Supabase session and vendor data)
      localStorage.setItem('supabase_session', authData.session.access_token);
      localStorage.setItem('vendor_id', vendorData.id);
      localStorage.setItem('vendor_email', vendorData.email);
      localStorage.setItem('vendor_slug', vendorData.slug || '');
      localStorage.setItem('vendor_wordpress_id', vendorData.wordpress_user_id?.toString() || '');
      
      // 4. Set vendor state
      setVendor({
        id: vendorData.wordpress_user_id || 0,
        store_name: vendorData.store_name,
        slug: vendorData.slug,
        email: vendorData.email,
        user_id: vendorData.wordpress_user_id || 0
      });
      setIsAuthenticated(true);
      
      console.log('✅ Login successful:', vendorData.store_name);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function logout() {
    // Logout from Supabase
    await supabase.auth.signOut();
    
    // Clear simplified storage
    localStorage.removeItem('supabase_session');
    localStorage.removeItem('vendor_id');
    localStorage.removeItem('vendor_email');
    localStorage.removeItem('vendor_slug');
    localStorage.removeItem('vendor_wordpress_id');
    
    setVendor(null);
    setIsAuthenticated(false);
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

