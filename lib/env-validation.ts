/**
 * Environment Variable Validation
 * Ensures all required environment variables are set at startup
 */

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const OPTIONAL_ENV_VARS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "AUTHORIZE_NET_API_LOGIN_ID",
  "AUTHORIZE_NET_TRANSACTION_KEY",
  "VERCEL_URL",
  "NEXT_PUBLIC_SITE_URL",
] as const;

/**
 * Validate environment variables on startup
 * Call this in instrumentation.ts or app startup
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional but recommended variables
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Throw error if required vars are missing
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.`,
    );
  }

  // Log warnings for optional vars (only in development)
  if (warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn(
      `⚠️  Optional environment variables not set:\n${warnings.map((v) => `  - ${v}`).join("\n")}`,
    );
  }

  // Validate variable formats
  validateFormats();

  if (process.env.NODE_ENV === "development") {
  }
}

/**
 * Validate environment variable formats
 */
function validateFormats(): void {
  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must start with https://");
  }

  // Validate API keys are not empty strings
  const apiKeys = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
  ];

  for (const key of apiKeys) {
    const value = process.env[key];
    if (value === "") {
      throw new Error(`${key} cannot be an empty string`);
    }
  }
}

/**
 * Type-safe environment variable getter
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];

  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value;
}

/**
 * Check if we're in production
 */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Check if we're in development
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Get the site URL
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_URL ||
  "http://localhost:3000";
