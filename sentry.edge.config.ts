import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Lower sample rate for edge (high volume)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Strip PII
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
    }

    if (event.user?.email) {
      event.user.email = undefined;
    }

    return event;
  },

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    /NEXT_NOT_FOUND/,
  ],
});
