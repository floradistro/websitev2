"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import axios from "axios";

interface User {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  billing?: any;
  shipping?: any;
  avatar_url?: string;
  isWholesaleApproved?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios to include credentials (cookies) with all requests
axios.defaults.withCredentials = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("flora-user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user:", error);
        localStorage.removeItem("flora-user");
      }
    }
    setLoading(false);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("flora-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("flora-user");
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // SECURITY FIX: Session token now stored in HTTP-only cookie (XSS protection)
      // No longer storing session in localStorage
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success && response.data.user) {
        console.log('✅ Setting user in context:', response.data.user);
        setUser(response.data.user);
        // Save user data to localStorage (but NOT the session token)
        localStorage.setItem("flora-user", JSON.stringify(response.data.user));
        // Clean up old session storage if it exists
        localStorage.removeItem("supabase-session");
      } else {
        throw new Error(response.data.error || "Invalid email or password");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.response?.data?.error || error.message || "Login failed. Please check your credentials.");
    }
  }, []);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Create customer via Supabase API
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName
      });

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error(response.data.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.response?.data?.error || error.message || "Registration failed. Please try again.");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout API to clear HTTP-only cookie
      await axios.post('/api/auth/logout').catch(() => {
        // Ignore errors - logout locally anyway
      });
    } finally {
      // Always clear local state
      setUser(null);
      localStorage.removeItem("flora-user");
      localStorage.removeItem("supabase-session"); // Clean up legacy
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;

    try {
      // Update customer via Supabase API
      const response = await axios.put(
        `/api/auth/update-profile`,
        {
          userId: user.id,
          ...userData
        }
      );

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error(response.data.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Update user error:", error);
      throw new Error(error.response?.data?.error || error.message || "Failed to update profile.");
    }
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user,
    }),
    [user, loading, login, register, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

