/**
 * Analytics Page Wrapper
 * Wraps analytics pages with error boundary and common layout
 */

"use client";

import { ReactNode } from "react";
import { AnalyticsErrorBoundary } from "./ErrorBoundary";

interface AnalyticsPageWrapperProps {
  children: ReactNode;
}

export function AnalyticsPageWrapper({ children }: AnalyticsPageWrapperProps) {
  return (
    <AnalyticsErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        if (process.env.NODE_ENV === "production") {
          // TODO: Send to Sentry or other error tracking
          console.error("[Analytics Error]", {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          });
        }
      }}
    >
      {children}
    </AnalyticsErrorBoundary>
  );
}
