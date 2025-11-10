"use client";

import { useEffect, useRef } from "react";

/**
 * Stable effect hook that prevents memory leaks
 * Automatically cleans up on unmount
 */
export function useStableEffect(
  effect: () => void | (() => void),
  deps: any[],
) {
  const cleanupRef = useRef<(() => void) | void>(undefined);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isMountedRef.current) {
      cleanupRef.current = effect();
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
