"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'vendor_admin' | 'manager' | 'employee';

interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
  vendor_type?: 'standard' | 'distributor' | 'both';
  wholesale_enabled?: boolean;
  pos_enabled?: boolean;
  marketing_provider?: 'builtin' | 'alpineiq';
  marketing_config?: any;
}

interface Location {
  id: string;
  name: string;
  address?: string;
  is_primary: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  vendor_id: string;
  employee_code?: string;
  vendor: Vendor | null;
}

interface AppAuthContextType {
  user: AppUser | null;
  vendor: Vendor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  accessibleApps: string[];
  locations: Location[];
  primaryLocation: Location | null;
  hasAppAccess: (appKey: string) => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AppAuthContext = createContext<AppAuthContextType>({
  user: null,
  vendor: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
  accessibleApps: [],
  locations: [],
  primaryLocation: null,
  hasAppAccess: () => false,
  login: async () => false,
  logout: () => {},
  refreshUserData: async () => {},
});

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessibleApps, setAccessibleApps] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Load user from localStorage on mount
  useEffect(() => {
    let mounted = true;

    const savedUser = localStorage.getItem('app_user');
    const savedApps = localStorage.getItem('app_accessible_apps');
    const savedLocations = localStorage.getItem('app_locations');

    if (savedUser && mounted) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setVendor(userData.vendor);
        setIsAuthenticated(true);

        // Default apps available to all users: POS, Customers, Digital Menus
        const defaultApps = ['pos', 'customers', 'tv_menus'];
        if (savedApps) {
          const parsedApps = JSON.parse(savedApps);
          // If empty array and not vendor_admin, use default apps
          setAccessibleApps(parsedApps.length === 0 && userData.role !== 'vendor_admin' ? defaultApps : parsedApps);
        } else {
          // No saved apps - use defaults for non-admins
          setAccessibleApps(userData.role === 'vendor_admin' ? [] : defaultApps);
        }

        if (savedLocations) {
          setLocations(JSON.parse(savedLocations));
        }

        // Ensure legacy keys are set for backwards compatibility
        if (userData.vendor_id && !localStorage.getItem('vendor_id')) {
          localStorage.setItem('vendor_id', userData.vendor_id);
        }
        if (userData.vendor?.email && !localStorage.getItem('vendor_email')) {
          localStorage.setItem('vendor_email', userData.vendor.email);
        }

        console.log('✅ Loaded user from localStorage:', userData.name, `(${userData.role})`);
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
        localStorage.removeItem('app_user');
        localStorage.removeItem('app_accessible_apps');
        localStorage.removeItem('app_locations');
      }
    }

    setIsLoading(false);

    return () => {
      mounted = false;
    };
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      // SECURITY FIX: Session token now stored in HTTP-only cookie (XSS protection)
      // Try new unified app login endpoint first
      let response = await fetch('/api/auth/app-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Include cookies in request
      });

      let data = await response.json();

      // If new endpoint fails, fallback to old vendor login
      if (!data.success) {
        console.log('⚠️  New auth endpoint failed, falling back to legacy vendor login');
        response = await fetch('/api/vendor/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include' // Include cookies in request
        });

        data = await response.json();

        if (!data.success || !data.vendor) {
          console.error('Login failed:', data.error);
          return false;
        }

        // Convert vendor response to user format
        const legacyUser: AppUser = {
          id: data.vendor.id,
          email: data.vendor.email,
          name: data.vendor.store_name,
          role: 'vendor_admin',
          vendor_id: data.vendor.id,
          vendor: data.vendor
        };

        setUser(legacyUser);
        setVendor(data.vendor);
        setIsAuthenticated(true);
        setAccessibleApps([]); // Vendor admins have access to all
        setLocations([]);

        // Save to localStorage (but NOT session token - it's in HTTP-only cookie)
        localStorage.setItem('app_user', JSON.stringify(legacyUser));
        localStorage.setItem('app_accessible_apps', JSON.stringify([])); // Vendor admins have access to all
        localStorage.setItem('app_locations', JSON.stringify([]));
        // Also set legacy keys for backwards compatibility
        localStorage.setItem('vendor_id', data.vendor.id);
        localStorage.setItem('vendor_email', data.vendor.email);
        // Clean up old session storage
        localStorage.removeItem('supabase_session');

        console.log('✅ Legacy login successful:', legacyUser.name);
        return true;
      }

      if (!data.user) {
        console.error('Login failed: No user data');
        return false;
      }

      // Store user data
      const userData: AppUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        vendor_id: data.user.vendor_id,
        employee_code: data.user.employee_code,
        vendor: data.user.vendor
      };

      setUser(userData);
      setVendor(data.user.vendor);
      setIsAuthenticated(true);

      // Store accessible apps (vendor admins have access to all)
      // Default apps available to all users: POS, Customers, Digital Menus
      const defaultApps = ['pos', 'customers', 'tv_menus'];
      const apps = data.user.role === 'vendor_admin' ? [] : (data.apps || defaultApps);
      setAccessibleApps(apps);

      // Store locations
      const userLocations = data.locations || [];
      setLocations(userLocations);

      // Save to localStorage (but NOT session token - it's in HTTP-only cookie)
      localStorage.setItem('app_user', JSON.stringify(userData));
      localStorage.setItem('app_accessible_apps', JSON.stringify(apps));
      localStorage.setItem('app_locations', JSON.stringify(userLocations));
      // Also set legacy keys for backwards compatibility
      localStorage.setItem('vendor_id', userData.vendor_id);
      if (data.user.vendor) {
        localStorage.setItem('vendor_email', data.user.vendor.email || userData.email);
      }
      // Clean up old session storage
      localStorage.removeItem('supabase_session');

      console.log('✅ Login successful:', userData.name, `(${userData.role})`);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function logout() {
    try {
      // Call logout API to clear HTTP-only cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {
        // Ignore errors - logout locally anyway
      });
    } finally {
      // Clear all storage
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('app_user');
      localStorage.removeItem('app_accessible_apps');
      localStorage.removeItem('app_locations');
      // Also clear old vendor auth data for backwards compatibility
      localStorage.removeItem('vendor_id');
      localStorage.removeItem('vendor_email');
      localStorage.removeItem('vendor_slug');
      localStorage.removeItem('vendor_user');

      setUser(null);
      setVendor(null);
      setIsAuthenticated(false);
      setAccessibleApps([]);
      setLocations([]);

      console.log('✅ User logged out');
    }
  }

  async function refreshUserData() {
    if (!user) return;

    try {
      // Re-fetch user data to get latest permissions
      // Session token is automatically sent via HTTP-only cookie
      const response = await fetch('/api/auth/app-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          email: user.email
          // No need to send refreshToken - it's in HTTP-only cookie
        })
      });

      const data = await response.json();

      if (data.success && data.user) {
        const updatedUser: AppUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          vendor_id: data.user.vendor_id,
          employee_code: data.user.employee_code,
          vendor: data.user.vendor
        };

        setUser(updatedUser);
        setVendor(data.user.vendor);

        // Default apps available to all users: POS, Customers, Digital Menus
        const defaultApps = ['pos', 'customers', 'tv_menus'];
        const apps = data.user.role === 'vendor_admin' ? [] : (data.apps || defaultApps);
        setAccessibleApps(apps);

        const userLocations = data.locations || [];
        setLocations(userLocations);

        localStorage.setItem('app_user', JSON.stringify(updatedUser));
        localStorage.setItem('app_accessible_apps', JSON.stringify(apps));
        localStorage.setItem('app_locations', JSON.stringify(userLocations));
        // Also set legacy keys for backwards compatibility
        localStorage.setItem('vendor_id', updatedUser.vendor_id);
        if (data.user.vendor) {
          localStorage.setItem('vendor_email', data.user.vendor.email || updatedUser.email);
        }

        console.log('✅ User data refreshed:', updatedUser.name);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }

  function hasAppAccess(appKey: string): boolean {
    // Vendor admins have access to everything
    if (user?.role === 'vendor_admin') {
      return true;
    }

    // Check if app is in accessible apps list
    return accessibleApps.includes(appKey);
  }

  const primaryLocation = locations.find(l => l.is_primary) || locations[0] || null;

  return (
    <AppAuthContext.Provider
      value={{
        user,
        vendor,
        isAuthenticated,
        isLoading,
        role: user?.role || null,
        accessibleApps,
        locations,
        primaryLocation,
        hasAppAccess,
        login,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AppAuthContext);
}

// Backwards compatibility: Export as useVendorAuth too
export function useVendorAuth() {
  const context = useAppAuth();
  return {
    vendor: context.vendor,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    login: context.login,
    logout: context.logout,
    refreshUserData: context.refreshUserData,
  };
}
