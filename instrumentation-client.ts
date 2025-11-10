/**
 * Client-side instrumentation for Sentry
 * This file is automatically loaded by Next.js on the client
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Performance monitoring sample rate (lower in production)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay session recording (only on errors in production)
  replaysSessionSampleRate: 0, // Don't record all sessions
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Mask all text for privacy
      blockAllMedia: true, // Block all media
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Strip PII from client-side events
  beforeSend(event) {
    // Remove cookies
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
    }

    // Remove email
    if (event.user?.email) {
      event.user.email = undefined;
    }

    return event;
  },

  // Ignore common browser errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    /NEXT_NOT_FOUND/,
    "cancelled", // User cancelled requests
    "AbortError", // Aborted fetch requests
  ],
});

// Enable router transition tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
