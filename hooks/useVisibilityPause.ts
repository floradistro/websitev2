'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Hook that pauses operations when page is hidden
 * Prevents crashes and memory leaks when user tabs away
 */
export function useVisibilityPause() {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (!visible) {
        // Page hidden - pause after 5 seconds
        timeoutRef.current = setTimeout(() => {
          setIsPaused(true);
          console.log('🔵 Page hidden - pausing operations');
        }, 5000);
      } else {
        // Page visible - resume immediately
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsPaused(false);
        console.log('✅ Page visible - resuming operations');
      }
    };

    // Set initial state
    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isVisible, isPaused };
}

/**
 * Hook that cancels pending fetches when component unmounts or page is hidden
 */
export function useFetchWithCleanup() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { isPaused } = useVisibilityPause();

  useEffect(() => {
    // Cancel fetch if page is paused
    if (isPaused && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      // Cancel on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchWithCleanup = async <T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // Cancel previous fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    abortControllerRef.current = new AbortController();

    const response = await fetch(url, {
      ...options,
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  };

  return { fetchWithCleanup, isPaused };
}

