/**
 * Centralized Environment Variable Validation
 * All environment variables should be accessed through this file
 * This provides type safety and validation at startup
 */

// Required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: process.env.NODE_ENV || "development",
  VERCEL_URL: process.env.VERCEL_URL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SUPABASE_POOLER_URL: process.env.SUPABASE_POOLER_URL,

  // Payment processors
  AUTHORIZE_NET_API_LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN_ID,
  AUTHORIZE_NET_TRANSACTION_KEY: process.env.AUTHORIZE_NET_TRANSACTION_KEY,

  // Upstash Redis (for caching)
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
} as const;

// Validate required environment variables
function validateRequiredEnvVars() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}\n\nPlease check your .env.local file.`,
    );
  }
}

// Run validation on import (fails fast at startup)
if (typeof window === "undefined") {
  // Only validate on server-side
  validateRequiredEnvVars();
}

// Export validated environment variables with type safety
export const env = {
  // Supabase
  supabase: {
    url: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
    poolerUrl: optionalEnvVars.SUPABASE_POOLER_URL,
  },

  // AI Services
  ai: {
    anthropic: optionalEnvVars.ANTHROPIC_API_KEY,
    openai: optionalEnvVars.OPENAI_API_KEY,
  },

  // Payment
  payment: {
    authorizeNet: {
      apiLoginId: optionalEnvVars.AUTHORIZE_NET_API_LOGIN_ID,
      transactionKey: optionalEnvVars.AUTHORIZE_NET_TRANSACTION_KEY,
    },
  },

  // Cache
  cache: {
    upstash: {
      url: optionalEnvVars.UPSTASH_REDIS_REST_URL,
      token: optionalEnvVars.UPSTASH_REDIS_REST_TOKEN,
    },
  },

  // App
  app: {
    nodeEnv: optionalEnvVars.NODE_ENV,
    vercelUrl: optionalEnvVars.VERCEL_URL,
    isProd: optionalEnvVars.NODE_ENV === "production",
    isDev: optionalEnvVars.NODE_ENV === "development",
  },
} as const;

// Helper functions
export function isProduction() {
  return env.app.isProd;
}

export function isDevelopment() {
  return env.app.isDev;
}

// Type exports for use in other files
export type Env = typeof env;
