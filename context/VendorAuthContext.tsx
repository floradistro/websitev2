"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getVendorDashboard, getVendorSettings } from '@/lib/wordpress';

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
      
      // Check if we have stored credentials
      const storedEmail = localStorage.getItem('vendor_email');
      const storedAuth = localStorage.getItem('vendor_auth');
      
      if (!storedEmail || !storedAuth) {
        // No stored credentials, not authenticated
        setIsLoading(false);
        return;
      }
      
      // Try to fetch vendor data to verify auth
      try {
        const data = await getVendorSettings();
        
        if (data && data.id) {
          setVendor({
            id: parseInt(data.id),
            store_name: data.store_name,
            slug: data.slug,
            email: data.email,
            user_id: parseInt(data.user_id)
          });
          setIsAuthenticated(true);
        } else {
          // Auth failed, clear storage
          localStorage.removeItem('vendor_email');
          localStorage.removeItem('vendor_auth');
          localStorage.removeItem('vendor_token');
        }
      } catch (error: any) {
        // If 401, clear bad credentials silently
        if (error.response?.status === 401) {
          localStorage.removeItem('vendor_email');
          localStorage.removeItem('vendor_auth');
          localStorage.removeItem('vendor_token');
        }
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      // Call WordPress vendor login endpoint
      const response = await fetch('https://api.floradistro.com/wp-json/flora-vendors/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.vendor) {
        // Store credentials
        localStorage.setItem('vendor_email', email);
        localStorage.setItem('vendor_auth', btoa(`${email}:${password}`));
        localStorage.setItem('vendor_token', data.token);
        
        // Set vendor state
        setVendor({
          id: data.vendor.id,
          store_name: data.vendor.store_name,
          slug: data.vendor.slug,
          email: data.vendor.email,
          user_id: data.vendor.user_id
        });
        setIsAuthenticated(true);
        return true;
      } else {
        // Login failed
        console.error('Login failed:', data);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('vendor_email');
    localStorage.removeItem('vendor_auth');
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

