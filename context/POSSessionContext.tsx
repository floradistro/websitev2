"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

interface POSSession {
  id: string;
  session_number: string;
  register_id: string;
  register_name?: string;
  location_id: string;
  location_name?: string;
  total_sales?: number;
  total_transactions?: number;
  opened_at: string;
  opening_cash?: number;
  status: "open" | "closed";
  payment_processor_id?: string | null;
  has_payment_processor?: boolean;
}

interface POSLocation {
  id: string;
  name: string;
}

interface POSSessionContextValue {
  // Session state
  session: POSSession | null;
  registerId: string | null;
  location: POSLocation | null;
  hasPaymentProcessor: boolean;

  // Session actions
  startSession: (
    registerId: string,
    locationId: string,
    locationName: string,
    registerName: string,
    openingCash: number,
    hasProcessor?: boolean,
    processorId?: string | null
  ) => Promise<void>;
  endSession: () => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  refreshProcessorStatus: () => Promise<void>;

  // Location/Register management
  setLocation: (location: POSLocation) => void;
  clearLocation: () => void;

  // Loading states
  isLoading: boolean;
}

const POSSessionContext = createContext<POSSessionContextValue | null>(null);

export function POSSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<POSSession | null>(null);
  const [registerId, setRegisterId] = useState<string | null>(null);
  const [location, setLocationState] = useState<POSLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPaymentProcessor, setHasPaymentProcessor] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("pos_active_session");
    const savedRegisterId = localStorage.getItem("pos_register_id");
    const savedLocation = localStorage.getItem("pos_selected_location");

    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        // Restore payment processor status from session
        setHasPaymentProcessor(parsedSession.has_payment_processor || false);
      } catch (e) {
        localStorage.removeItem("pos_active_session");
      }
    }

    if (savedRegisterId) {
      setRegisterId(savedRegisterId);
    }

    if (savedLocation) {
      try {
        setLocationState(JSON.parse(savedLocation));
      } catch (e) {
        localStorage.removeItem("pos_selected_location");
      }
    }

    setIsLoading(false);
  }, []);

  // Monitor session status
  useEffect(() => {
    if (!session?.id) return;

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/pos/sessions/status?sessionId=${session.id}`);
        
        if (response.ok) {
          const { session: updatedSession } = await response.json();
          
          // Session was closed - clear everything
          if (updatedSession && updatedSession.status === "closed") {
            setSession(null);
            setRegisterId(null);
            localStorage.removeItem("pos_active_session");
            localStorage.removeItem("pos_register_id");
          } else if (updatedSession) {
            // Update session with latest data
            setSession(updatedSession);
            localStorage.setItem("pos_active_session", JSON.stringify(updatedSession));
          }
        }
      } catch (error) {
        logger.error("Session check error:", error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(checkSession, 3000);

    return () => clearInterval(interval);
  }, [session?.id]);

  const startSession = useCallback(
    async (
      registerId: string,
      locationId: string,
      locationName: string,
      registerName: string,
      openingCash: number,
      hasProcessor?: boolean,
      processorId?: string | null
    ) => {
      try {
        console.log("Starting session with:", { registerId, locationId, openingCash, hasProcessor });

        const response = await fetch("/api/pos/sessions/get-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registerId,
            locationId,
            openingCash,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to start session");
        }

        const data = await response.json();
        console.log("Session created/joined:", data);

        const newSession: POSSession = {
          ...data.session,
          register_id: registerId,
          register_name: registerName,
          location_id: locationId,
          location_name: locationName,
          // Ensure numeric fields have defaults
          total_sales: data.session.total_sales || 0,
          total_transactions: data.session.total_transactions || 0,
          opening_cash: data.session.opening_cash || 0,
          // CRITICAL: Store payment processor info in session
          payment_processor_id: processorId,
          has_payment_processor: hasProcessor || false,
        };

        setSession(newSession);
        setRegisterId(registerId);
        setLocationState({ id: locationId, name: locationName });
        setHasPaymentProcessor(hasProcessor || false);

        localStorage.setItem("pos_active_session", JSON.stringify(newSession));
        localStorage.setItem("pos_register_id", registerId);
        localStorage.setItem("pos_selected_location", JSON.stringify({ id: locationId, name: locationName }));

        console.log("Session state updated successfully with processor status:", hasProcessor);
      } catch (error) {
        logger.error("Failed to start session:", error);
        throw error;
      }
    },
    []
  );

  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch("/api/pos/sessions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          closingCash: 0,
          closingNotes: "Session ended by user",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to end session");
      }

      // Clear session state
      setSession(null);
      setRegisterId(null);
      localStorage.removeItem("pos_active_session");
      localStorage.removeItem("pos_register_id");
    } catch (error) {
      logger.error("Failed to end session:", error);
      throw error;
    }
  }, [session]);

  const joinSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/pos/sessions/status?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error("Failed to join session");
      }

      const { session: fetchedSession } = await response.json();
      
      if (!fetchedSession) {
        throw new Error("Session not found");
      }

      setSession(fetchedSession);
      localStorage.setItem("pos_active_session", JSON.stringify(fetchedSession));
    } catch (error) {
      logger.error("Failed to join session:", error);
      throw error;
    }
  }, []);

  const setLocation = useCallback((location: POSLocation) => {
    setLocationState(location);
    localStorage.setItem("pos_selected_location", JSON.stringify(location));
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    setSession(null);
    setRegisterId(null);
    setHasPaymentProcessor(false);
    localStorage.removeItem("pos_selected_location");
    localStorage.removeItem("pos_active_session");
    localStorage.removeItem("pos_register_id");
  }, []);

  // CRITICAL FIX: Refresh payment processor status
  // Call this after successful transactions to ensure processor stays connected
  const refreshProcessorStatus = useCallback(async () => {
    if (!location?.id || !registerId) {
      return;
    }

    try {
      const response = await fetch(`/api/pos/registers?locationId=${location.id}`);
      if (!response.ok) return;

      const data = await response.json();
      const register = data.registers?.find((r: any) => r.id === registerId);

      if (register) {
        const processorStatus = !!(
          register.payment_processor_id &&
          register.payment_processor?.is_active === true
        );

        console.log("🔄 Refreshed processor status:", processorStatus);
        setHasPaymentProcessor(processorStatus);

        // Update session with fresh processor status
        if (session) {
          const updatedSession = {
            ...session,
            has_payment_processor: processorStatus,
            payment_processor_id: register.payment_processor_id,
          };
          setSession(updatedSession);
          localStorage.setItem("pos_active_session", JSON.stringify(updatedSession));
        }
      }
    } catch (error) {
      logger.error("Failed to refresh processor status:", error);
    }
  }, [location, registerId, session]);

  return (
    <POSSessionContext.Provider
      value={{
        session,
        registerId,
        location,
        hasPaymentProcessor,
        startSession,
        endSession,
        joinSession,
        refreshProcessorStatus,
        setLocation,
        clearLocation,
        isLoading,
      }}
    >
      {children}
    </POSSessionContext.Provider>
  );
}

export function usePOSSession() {
  const context = useContext(POSSessionContext);
  if (!context) {
    throw new Error("usePOSSession must be used within POSSessionProvider");
  }
  return context;
}
