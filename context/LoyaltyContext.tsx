"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

interface LoyaltySettings {
  points_label: string;
  earn_ratio: string;
  redeem_ratio: string;
  min_redeem_points: number;
  max_redeem_discount: string;
  points_expiry: string;
}

interface PointsTransaction {
  id: number;
  user_id: number;
  points: number;
  type: string;
  description: string;
  date: string;
}

interface LoyaltyContextType {
  points: number;
  pointsLabel: string;
  history: PointsTransaction[];
  settings: LoyaltySettings | null;
  loading: boolean;
  refreshPoints: () => Promise<void>;
  addPoints: (amount: number, description: string) => Promise<void>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Load user points when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setPoints(0);
      setHistory([]);
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`/api/wp-proxy`, {
        params: {
          path: '/wp-json/wc-points-rewards/v1/settings',
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        }
      });
      setSettings(response.data);
    } catch (error) {
      console.error("Error loading loyalty settings:", error);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get balance and history in parallel - use proxy to avoid CORS
      const [balanceRes, historyRes] = await Promise.all([
        axios.get(`/api/wp-proxy`, {
          params: {
            path: `/wp-json/wc-points-rewards/v1/user/${user.id}/balance`,
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
          }
        }),
        axios.get(`/api/wp-proxy`, {
          params: {
            path: `/wp-json/wc-points-rewards/v1/user/${user.id}/history`,
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
            per_page: 50,
          }
        })
      ]);

      setPoints(balanceRes.data.balance || 0);
      setHistory(historyRes.data.history || []);
    } catch (error) {
      console.error("Error loading loyalty data:", error);
      setPoints(0);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPoints = async () => {
    await loadUserData();
  };

  const addPoints = async (amount: number, description: string) => {
    if (!user) return;
    
    try {
      await axios.post(
        `/api/wp-proxy?path=/wp-json/wc-points-rewards/v1/user/${user.id}/adjust&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
        {
          points: amount,
          description: description,
        }
      );
      
      // Refresh data after adding points
      await refreshPoints();
    } catch (error) {
      console.error("Error adding points:", error);
      throw error;
    }
  };

  return (
    <LoyaltyContext.Provider
      value={{
        points,
        pointsLabel: settings?.points_label || "Points",
        history,
        settings,
        loading,
        refreshPoints,
        addPoints,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error("useLoyalty must be used within a LoyaltyProvider");
  }
  return context;
}
