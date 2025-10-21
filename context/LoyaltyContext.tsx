"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

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

// Default settings - no WordPress needed
const DEFAULT_SETTINGS: LoyaltySettings = {
  points_label: 'Chips',
  earn_ratio: '1:100',
  redeem_ratio: '100:1',
  min_redeem_points: 100,
  max_redeem_discount: '50',
  points_expiry: '365',
};

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [settings] = useState<LoyaltySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  // Load user points from localStorage when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setPoints(0);
      setHistory([]);
    }
  }, [user]);

  const loadUserData = () => {
    if (!user) return;
    
    try {
      // Load from localStorage
      const savedPoints = localStorage.getItem(`loyalty_points_${user.id}`);
      const savedHistory = localStorage.getItem(`loyalty_history_${user.id}`);
      
      if (savedPoints) {
        setPoints(parseInt(savedPoints) || 0);
      }
      
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading loyalty data:", error);
      setPoints(0);
      setHistory([]);
    }
  };

  const refreshPoints = async () => {
    loadUserData();
  };

  const addPoints = async (amount: number, description: string) => {
    if (!user) return;
    
    try {
      const newPoints = points + amount;
      const newTransaction: PointsTransaction = {
        id: Date.now(),
        user_id: user.id,
        points: amount,
        type: amount > 0 ? 'earn' : 'redeem',
        description,
        date: new Date().toISOString(),
      };
      
      const newHistory = [newTransaction, ...history];
      
      // Save to localStorage
      localStorage.setItem(`loyalty_points_${user.id}`, newPoints.toString());
      localStorage.setItem(`loyalty_history_${user.id}`, JSON.stringify(newHistory));
      
      setPoints(newPoints);
      setHistory(newHistory);
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
