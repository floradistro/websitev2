import { logger } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: Error,
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  },
) => {
  // This will be automatically picked up by Sentry
  logger.error("Request error:", {
    error: err.message,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
  });
};
