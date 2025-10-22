"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import axios from "axios";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  billing?: any;
  shipping?: any;
  avatar_url?: string;
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uaednwpxursknmwdeejn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTcyMzMsImV4cCI6MjA3NjU3MzIzM30.Dj0FtFqxF-FXHJrD_gNkKg5KQRPyMc-f6vO18CPhVVE";

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
      // Call our login API endpoint which validates credentials
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("flora-user");
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

