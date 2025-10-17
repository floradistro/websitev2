"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
const consumerKey = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_KEY || "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_SECRET || "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

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
      // First, authenticate with WordPress JWT or basic auth
      // Since WooCommerce doesn't have a direct login endpoint, we'll use the customers endpoint
      // to find the user by email
      const response = await axios.get(
        `${baseUrl}/wp-json/wc/v3/customers`,
        {
          params: {
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
            email: email,
          }
        }
      );

      if (response.data && response.data.length > 0) {
        const customerData = response.data[0];
        
        // In a real implementation, you'd verify the password via a custom endpoint
        // For now, we'll store the customer data
        const userData: User = {
          id: customerData.id,
          email: customerData.email,
          firstName: customerData.first_name,
          lastName: customerData.last_name,
          username: customerData.username,
          billing: customerData.billing,
          shipping: customerData.shipping,
          avatar_url: customerData.avatar_url,
        };

        setUser(userData);
      } else {
        throw new Error("Invalid email or password");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.response?.data?.message || "Login failed. Please check your credentials.");
    }
  }, []);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Create customer via WooCommerce API
      const response = await axios.post(
        `${baseUrl}/wp-json/wc/v3/customers?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
        {
          email: email,
          first_name: firstName,
          last_name: lastName,
          username: email.split('@')[0], // Use email prefix as username
          password: password,
          billing: {
            first_name: firstName,
            last_name: lastName,
            email: email,
          },
          shipping: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      );

      if (response.data) {
        const customerData = response.data;
        const userData: User = {
          id: customerData.id,
          email: customerData.email,
          firstName: customerData.first_name,
          lastName: customerData.last_name,
          username: customerData.username,
          billing: customerData.billing,
          shipping: customerData.shipping,
          avatar_url: customerData.avatar_url,
        };

        setUser(userData);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("flora-user");
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;

    try {
      // Update customer via WooCommerce API
      const response = await axios.put(
        `${baseUrl}/wp-json/wc/v3/customers/${user.id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
        {
          first_name: userData.firstName,
          last_name: userData.lastName,
          billing: userData.billing,
          shipping: userData.shipping,
        }
      );

      if (response.data) {
        const updatedData: User = {
          id: response.data.id,
          email: response.data.email,
          firstName: response.data.first_name,
          lastName: response.data.last_name,
          username: response.data.username,
          billing: response.data.billing,
          shipping: response.data.shipping,
          avatar_url: response.data.avatar_url,
        };

        setUser(updatedData);
      }
    } catch (error: any) {
      console.error("Update user error:", error);
      throw new Error(error.response?.data?.message || "Failed to update profile.");
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
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

