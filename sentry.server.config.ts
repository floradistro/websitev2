import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // DSN from environment variable (secure)
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Enable structured logging
  _experiments: {
    enableLogs: true,
  },

  // Performance monitoring sample rate
  // 10% in production (reduce costs), 100% in development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Integrations
  integrations: [
    // Automatic console logging
    Sentry.consoleIntegration({
      levels: ["warn", "error"], // Only warn and error in production
    }),
  ],

  // Security: Strip PII before sending
  beforeSend(event) {
    // Remove cookies (may contain auth tokens)
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
    }

    // Remove customer email from user context
    if (event.user?.email) {
      event.user.email = undefined;
    }

    return event;
  },

  // Tag all events with vendor context
  beforeSendTransaction(event) {
    const vendorId = event.contexts?.vendor?.id;
    if (vendorId) {
      event.tags = {
        ...event.tags,
        vendor_id: vendorId as string,
        environment: process.env.NODE_ENV || "development",
      };
    }
    return event;
  },

  // Ignore known errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded", // Benign browser error
    "Non-Error promise rejection captured", // Usually user cancellations
    /NEXT_NOT_FOUND/, // Next.js 404s
  ],
});
