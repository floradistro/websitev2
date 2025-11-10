"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";

/**
 * Safe state hook that prevents setState calls on unmounted components
 * Prevents memory leaks and React warnings
 */
export function useSafeState<T>(initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState: Dispatch<SetStateAction<T>> = (value) => {
    if (isMountedRef.current) {
      setState(value);
    }
  };

  return [state, safeSetState];
}
