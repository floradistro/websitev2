"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'vendor_owner' | 'vendor_manager' | 'location_manager' | 'pos_staff' | 'inventory_staff' | 'readonly' | 'admin';

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
  settings?: {
    tax_config?: {
      sales_tax_rate?: number;
      taxes?: Array<{
        name: string;
        rate: number;
        type: string;
      }>;
    };
  };
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

  // Helper: Check if user has admin privileges (DRY - Don't Repeat Yourself)
  const isAdminRole = (role: UserRole) => {
    return role === 'vendor_owner' || role === 'vendor_manager' || role === 'admin';
  };

  // Helper: Get accessible apps for user (DRY - Don't Repeat Yourself)
  const getAccessibleApps = (role: UserRole, serverApps?: string[]) => {
    const defaultApps = ['pos', 'customers', 'tv_menus'];
    return isAdminRole(role) ? [] : (serverApps || defaultApps);
  };

  // Helper function to fetch locations from server (DRY - Don't Repeat Yourself)
  const fetchLocationsFromServer = async () => {
    try {
      console.log('🔄 Fetching locations from server...');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.locations) {
        console.log('✅ Got locations from server:', data.locations.length);
        setLocations(data.locations);
        localStorage.setItem('app_locations', JSON.stringify(data.locations));
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const savedUser = localStorage.getItem('app_user');
      const savedApps = localStorage.getItem('app_accessible_apps');
      const savedLocations = localStorage.getItem('app_locations');

      if (savedUser && mounted) {
        try {
          const userData = JSON.parse(savedUser);

          // IMPORTANT: We CANNOT verify HTTP-only cookies from JavaScript!
          // The refresh endpoint will validate the session and log out if expired.
          // Just trust localStorage for initial load, refresh will validate.
          setUser(userData);
          setVendor(userData.vendor);
          setIsAuthenticated(true);

          // Set accessible apps
          if (savedApps) {
            const parsedApps = JSON.parse(savedApps);
            // If empty array and not admin, use default apps
            const defaultApps = ['pos', 'customers', 'tv_menus'];
            setAccessibleApps(parsedApps.length === 0 && !isAdminRole(userData.role) ? defaultApps : parsedApps);
          } else {
            // No saved apps - get defaults based on role
            setAccessibleApps(getAccessibleApps(userData.role));
          }

          // Handle locations - fetch from server if missing or empty
          if (!savedLocations || JSON.parse(savedLocations).length === 0) {
            console.warn('⚠️  No locations or empty array - fetching immediately!');
            setLocations([]);
            if (mounted && userData) {
              fetchLocationsFromServer();
            }
          } else {
            const parsedLocations = JSON.parse(savedLocations);
            setLocations(parsedLocations);
            console.log('📍 Loaded locations from localStorage:', parsedLocations.length, 'locations');
          }

          // Ensure legacy keys are set for backwards compatibility
          if (userData.vendor_id && !localStorage.getItem('vendor_id')) {
            localStorage.setItem('vendor_id', userData.vendor_id);
          }
          if (userData.vendor?.email && !localStorage.getItem('vendor_email')) {
            localStorage.setItem('vendor_email', userData.vendor.email);
          }

          console.log('✅ Loaded user from localStorage:', userData.name, `(${userData.role})`, '- session will be validated on refresh');
        } catch (error) {
          console.error('Failed to load user from localStorage:', error);
          localStorage.removeItem('app_user');
          localStorage.removeItem('app_accessible_apps');
          localStorage.removeItem('app_locations');
        }
      }

      setIsLoading(false);
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-refresh session token to prevent expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    // CRITICAL FIX: Don't refresh immediately on page load - trust localStorage
    // Only refresh periodically and when tab becomes visible
    // This prevents logout on every page refresh
    console.log('🔐 Session refresh scheduled - will refresh in 5 minutes');

    // Refresh every 5 minutes to keep session alive (more frequent = better UX)
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing session...');
      refreshUserData();
    }, 5 * 60 * 1000); // 5 minutes

    // Refresh when tab becomes visible (user comes back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        console.log('👁️  Tab visible - refreshing session...');
        refreshUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      // CRITICAL FIX: Clear ALL localStorage BEFORE login to prevent stale data
      console.log('🧹 Clearing all auth data before fresh login...');
      localStorage.removeItem('app_user');
      localStorage.removeItem('app_accessible_apps');
      localStorage.removeItem('app_locations');
      localStorage.removeItem('app_login_timestamp');
      localStorage.removeItem('vendor_id');
      localStorage.removeItem('vendor_email');
      localStorage.removeItem('supabase_session');

      // Reset state immediately
      setUser(null);
      setVendor(null);
      setIsAuthenticated(false);
      setAccessibleApps([]);
      setLocations([]);

      // SECURITY FIX: Session token now stored in HTTP-only cookie (XSS protection)
      // Try new unified app login endpoint first
      let response = await fetch('/api/auth/app-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Include cookies in request
      });

      console.log('📡 Login response status:', response.status, response.statusText);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse login response:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('📥 Login response received:', {
        status: response.status,
        success: data.success,
        hasUser: !!data.user,
        hasVendor: !!data.user?.vendor,
        locationsCount: data.locations?.length || 0,
        appsCount: data.apps?.length || 0,
        role: data.user?.role,
        error: data.error,
        message: data.message
      });

      // Check for HTTP error
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, data.error);
        throw new Error(data.error || `Login failed with status ${response.status}`);
      }

      // Check for unsuccessful response
      if (!data.success || !data.user) {
        console.error('❌ Login failed:', data.error || 'No user data');
        throw new Error(data.error || 'Login failed. Please check your credentials.');
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

      // Store accessible apps (vendor owners/managers have access to all)
      const apps = getAccessibleApps(data.user.role, data.apps);
      setAccessibleApps(apps);

      // Store locations
      const userLocations = data.locations || [];
      console.log('🗺️  Login response locations:', data.locations);
      console.log('🗺️  Setting locations:', userLocations);
      setLocations(userLocations);

      // Save to localStorage (but NOT session token - it's in HTTP-only cookie)
      localStorage.setItem('app_user', JSON.stringify(userData));
      localStorage.setItem('app_accessible_apps', JSON.stringify(apps));
      localStorage.setItem('app_locations', JSON.stringify(userLocations));
      localStorage.setItem('app_login_timestamp', Date.now().toString()); // Track login time for cookie verification grace period
      console.log('💾 Saved to localStorage - locations count:', userLocations.length);
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
      localStorage.removeItem('app_login_timestamp');
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
      // Re-fetch user data AND refresh session token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies with session token
      });

      // CRITICAL FIX: Only logout on ACTUAL session expiration, not network errors
      if (!response.ok) {
        // Check if it's specifically a 401 Unauthorized (session expired)
        if (response.status === 401) {
          console.warn('⚠️  Session expired (401) - logging out');
          logout();
          return;
        }
        // For other errors (500, network issues), just log and keep user logged in
        console.error('⚠️  Session refresh failed with status', response.status, '- keeping user logged in');
        return;
      }

      const data = await response.json();

      // Check for explicit expiration flag
      if (data.expired) {
        console.warn('⚠️  Session expired (expired flag) - logging out');
        logout();
        return;
      }

      if (data.success && data.user) {
        if (data.refreshed) {
          console.log('🔄 Session token refreshed successfully');
        }
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

        // Set accessible apps based on role
        const apps = getAccessibleApps(data.user.role, data.apps);
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
      } else {
        console.warn('⚠️  Refresh returned success=false - keeping user logged in with cached data');
      }
    } catch (error) {
      // CRITICAL FIX: Network errors should NOT log user out
      console.error('⚠️  Network error during refresh - keeping user logged in:', error);
      // Don't logout on network errors - keep user logged in with cached localStorage data
    }
  }

  function hasAppAccess(appKey: string): boolean {
    // Vendor owners/managers/admins have access to everything
    if (user && isAdminRole(user.role)) {
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
