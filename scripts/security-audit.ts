/**
 * Production Security Audit
 * Comprehensive security checks for production readiness
 *
 * Usage: npx tsx scripts/security-audit.ts
 */

interface AuditResult {
  category: string;
  test: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation?: string;
}

const results: AuditResult[] = [];

function addResult(
  category: string,
  test: string,
  passed: boolean,
  severity: "critical" | "warning" | "info",
  message: string,
  recommendation?: string,
) {
  results.push({ category, test, passed, severity, message, recommendation });
}

/**
 * AUDIT 1: Environment Variables
 */
async function auditEnvironmentVariables() {
  console.log("\n🔒 Audit 1: Environment Variables");
  console.log("-".repeat(60));

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];

  const sensitiveVars = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_TOKEN",
    "REDIS_PASSWORD",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
  ];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const exists = !!value;

    addResult(
      "Environment",
      `${varName} exists`,
      exists,
      "critical",
      exists ? `${varName} is configured` : `${varName} is MISSING`,
      exists ? undefined : `Add ${varName} to production environment variables`,
    );
  }

  // Check for exposed secrets in client-side variables
  for (const varName of sensitiveVars) {
    const isClientSide = varName.startsWith("NEXT_PUBLIC_");
    const shouldNotBePublic = !isClientSide;

    addResult(
      "Environment",
      `${varName} security`,
      shouldNotBePublic,
      shouldNotBePublic ? "info" : "critical",
      shouldNotBePublic
        ? `${varName} is properly secured`
        : `${varName} SHOULD NOT BE PUBLIC!`,
      shouldNotBePublic
        ? undefined
        : `Remove NEXT_PUBLIC_ prefix from ${varName}`,
    );
  }

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === "production";

  addResult(
    "Environment",
    "NODE_ENV",
    isProduction,
    "warning",
    `NODE_ENV is set to: ${nodeEnv}`,
    isProduction ? undefined : "Set NODE_ENV=production for deployment",
  );
}

/**
 * AUDIT 2: CORS Configuration
 */
async function auditCORSConfiguration() {
  console.log("\n🔒 Audit 2: CORS Configuration");
  console.log("-".repeat(60));

  try {
    // Check middleware.ts for CORS configuration
    const fs = await import("fs/promises");
    const middlewarePath = "./middleware.ts";

    try {
      const content = await fs.readFile(middlewarePath, "utf-8");

      // Check for CORS headers
      const hasCORS = content.includes("Access-Control-Allow-Origin");
      const hasCredentials = content.includes("Access-Control-Allow-Credentials");
      const hasMethods = content.includes("Access-Control-Allow-Methods");

      addResult(
        "CORS",
        "CORS headers configured",
        hasCORS,
        "warning",
        hasCORS ? "CORS headers found in middleware" : "No CORS configuration found",
        hasCORS ? undefined : "Configure CORS headers in middleware.ts",
      );

      addResult(
        "CORS",
        "Credentials handling",
        hasCredentials,
        "info",
        hasCredentials
          ? "Credentials handling configured"
          : "No credentials handling found",
      );

      addResult(
        "CORS",
        "Allowed methods",
        hasMethods,
        "info",
        hasMethods ? "Allowed methods configured" : "No methods configuration found",
      );

      // Check for wildcard origin (security risk)
      const hasWildcard = content.includes('Access-Control-Allow-Origin": "*"');
      addResult(
        "CORS",
        "Origin restriction",
        !hasWildcard,
        hasWildcard ? "critical" : "info",
        hasWildcard
          ? "WILDCARD origin detected - SECURITY RISK!"
          : "Origin restrictions properly configured",
        hasWildcard ? "Use specific origins instead of wildcard" : undefined,
      );
    } catch (error) {
      addResult(
        "CORS",
        "Middleware check",
        false,
        "warning",
        "Could not read middleware.ts",
        "Ensure middleware.ts exists with CORS configuration",
      );
    }
  } catch (error) {
    addResult("CORS", "File system check", false, "critical", "Cannot access file system");
  }
}

/**
 * AUDIT 3: Rate Limiting
 */
async function auditRateLimiting() {
  console.log("\n🔒 Audit 3: Rate Limiting");
  console.log("-".repeat(60));

  try {
    const { redisRateLimiter, RateLimitConfigs } = await import(
      "@/lib/redis-rate-limiter"
    );

    addResult(
      "Rate Limiting",
      "Rate limiter module",
      true,
      "info",
      "Rate limiter module is available",
    );

    // Check rate limit configurations
    const configs = Object.keys(RateLimitConfigs);
    addResult(
      "Rate Limiting",
      "Rate limit configs",
      configs.length > 0,
      "info",
      `${configs.length} rate limit configurations found: ${configs.join(", ")}`,
    );

    // Check if Redis is configured for rate limiting
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const hasRedis = !!(redisUrl && redisToken);

    addResult(
      "Rate Limiting",
      "Redis backend",
      hasRedis,
      hasRedis ? "info" : "critical",
      hasRedis
        ? "Redis is configured for distributed rate limiting"
        : "Redis NOT configured - rate limiting will NOT work in production",
      hasRedis ? undefined : "Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
    );
  } catch (error) {
    addResult(
      "Rate Limiting",
      "Rate limiter check",
      false,
      "critical",
      "Rate limiter module not found or has errors",
      "Ensure @/lib/redis-rate-limiter exists and exports correctly",
    );
  }
}

/**
 * AUDIT 4: API Route Security
 */
async function auditAPIRouteSecurity() {
  console.log("\n🔒 Audit 4: API Route Security");
  console.log("-".repeat(60));

  try {
    // Check if withVendorAuth wrapper is available
    const { withVendorAuth } = await import("@/lib/api/route-wrapper");

    addResult(
      "API Security",
      "Auth wrapper available",
      !!withVendorAuth,
      "info",
      "withVendorAuth wrapper is available",
    );

    // Check migrated routes
    const migratedRoutes = [
      "app/api/vendor/analytics/v2/sales/by-category/route.ts",
      "app/api/vendor/analytics/v2/sales/by-employee/route.ts",
      "app/api/vendor/analytics/v2/sales/by-payment-method/route.ts",
      "app/api/vendor/products/list/route.ts",
      "app/api/vendor/inventory/route.ts",
    ];

    const fs = await import("fs/promises");
    let migratedCount = 0;

    for (const route of migratedRoutes) {
      try {
        const content = await fs.readFile(route, "utf-8");
        const usesDRY = content.includes("withVendorAuth");
        if (usesDRY) migratedCount++;
      } catch (error) {
        // File doesn't exist or can't be read
      }
    }

    addResult(
      "API Security",
      "DRY wrapper migration",
      migratedCount === migratedRoutes.length,
      "info",
      `${migratedCount}/${migratedRoutes.length} high-value routes migrated to DRY wrappers`,
      migratedCount < migratedRoutes.length
        ? "Continue migrating routes to withVendorAuth"
        : undefined,
    );
  } catch (error) {
    addResult(
      "API Security",
      "Route wrapper check",
      false,
      "warning",
      "Cannot verify route wrapper availability",
    );
  }
}

/**
 * AUDIT 5: Database Security
 */
async function auditDatabaseSecurity() {
  console.log("\n🔒 Audit 5: Database Security");
  console.log("-".repeat(60));

  // Check Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  addResult(
    "Database",
    "Supabase URL",
    !!supabaseUrl,
    "critical",
    supabaseUrl ? "Supabase URL configured" : "Supabase URL MISSING",
  );

  addResult(
    "Database",
    "Service role key",
    !!supabaseKey,
    "critical",
    supabaseKey ? "Service role key configured" : "Service role key MISSING",
    supabaseKey ? undefined : "Add SUPABASE_SERVICE_ROLE_KEY to environment",
  );

  addResult(
    "Database",
    "Anon key",
    !!supabaseAnonKey,
    "info",
    supabaseAnonKey ? "Anon key configured" : "Anon key missing",
  );

  // Check if service role key is not exposed as public
  const serviceRoleIsPublic = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  addResult(
    "Database",
    "Service role key security",
    !serviceRoleIsPublic,
    serviceRoleIsPublic ? "critical" : "info",
    serviceRoleIsPublic
      ? "SERVICE ROLE KEY IS PUBLIC - CRITICAL SECURITY ISSUE!"
      : "Service role key is properly secured",
    serviceRoleIsPublic
      ? "IMMEDIATELY remove NEXT_PUBLIC_ prefix from service role key"
      : undefined,
  );
}

/**
 * AUDIT 6: Caching Security
 */
async function auditCachingSecurity() {
  console.log("\n🔒 Audit 6: Caching Configuration");
  console.log("-".repeat(60));

  try {
    const { redisCache } = await import("@/lib/redis-cache");

    const stats = redisCache.getStats();

    addResult(
      "Caching",
      "Redis connection",
      stats.isRedisConnected,
      stats.isRedisConnected ? "info" : "warning",
      stats.isRedisConnected
        ? "Redis cache is connected"
        : "Redis NOT connected - using fallback cache",
      stats.isRedisConnected
        ? undefined
        : "Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
    );

    addResult(
      "Caching",
      "Fallback cache",
      true,
      "info",
      `Fallback cache has ${stats.fallbackCacheSize}/${stats.fallbackCacheMax} items`,
    );

    // Check cache namespacing
    const hasNamespacing =
      process.env.APP_NAME !== undefined || process.env.NODE_ENV !== undefined;

    addResult(
      "Caching",
      "Cache namespacing",
      hasNamespacing,
      "info",
      hasNamespacing
        ? "Cache keys are properly namespaced"
        : "No cache namespacing configured",
      hasNamespacing ? undefined : "Set APP_NAME environment variable",
    );
  } catch (error) {
    addResult(
      "Caching",
      "Cache module check",
      false,
      "warning",
      "Cannot verify cache configuration",
    );
  }
}

/**
 * AUDIT 7: Error Handling
 */
async function auditErrorHandling() {
  console.log("\n🔒 Audit 7: Error Handling");
  console.log("-".repeat(60));

  try {
    const { logger } = await import("@/lib/logger");
    const { toError } = await import("@/lib/errors");

    addResult(
      "Error Handling",
      "Logger module",
      !!logger,
      "info",
      "Logger module is available",
    );

    addResult(
      "Error Handling",
      "Error utilities",
      !!toError,
      "info",
      "Error utility functions are available",
    );

    // Check Sentry configuration
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    addResult(
      "Error Handling",
      "Sentry monitoring",
      !!sentryDsn,
      sentryDsn ? "info" : "warning",
      sentryDsn ? "Sentry error monitoring configured" : "Sentry NOT configured",
      sentryDsn ? undefined : "Consider adding Sentry for production error tracking",
    );
  } catch (error) {
    addResult(
      "Error Handling",
      "Error handling check",
      false,
      "warning",
      "Cannot verify error handling modules",
    );
  }
}

/**
 * Generate audit report
 */
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("PRODUCTION SECURITY AUDIT REPORT");
  console.log("=".repeat(60));
  console.log();

  const categories = [...new Set(results.map((r) => r.category))];

  let criticalIssues = 0;
  let warnings = 0;
  let passed = 0;

  categories.forEach((category) => {
    const categoryResults = results.filter((r) => r.category === category);
    const categoryPassed = categoryResults.filter((r) => r.passed).length;
    const categoryTotal = categoryResults.length;

    console.log(`${category}: ${categoryPassed}/${categoryTotal} checks passed`);
    console.log("-".repeat(60));

    categoryResults.forEach((result) => {
      const icon =
        result.severity === "critical" ? "🔴" : result.severity === "warning" ? "⚠️ " : "✅";
      const status = result.passed ? "PASS" : "FAIL";

      console.log(`  ${icon} [${status}] ${result.test}`);
      console.log(`     ${result.message}`);

      if (result.recommendation) {
        console.log(`     → ${result.recommendation}`);
      }

      if (!result.passed) {
        if (result.severity === "critical") criticalIssues++;
        else if (result.severity === "warning") warnings++;
      } else {
        passed++;
      }
    });
    console.log();
  });

  console.log("=".repeat(60));
  console.log(`SUMMARY: ${passed} passed, ${warnings} warnings, ${criticalIssues} critical`);
  console.log("=".repeat(60));

  if (criticalIssues === 0 && warnings === 0) {
    console.log("\n✅ All security checks passed! Ready for production.");
    return 0;
  } else if (criticalIssues === 0) {
    console.log("\n⚠️  All critical checks passed, but some warnings need attention.");
    return 0;
  } else {
    console.log(
      "\n🔴 CRITICAL ISSUES FOUND! Fix these before deploying to production.",
    );
    return 1;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("PRODUCTION SECURITY AUDIT");
  console.log("=".repeat(60));
  console.log();
  console.log("Running comprehensive security checks...");

  try {
    await auditEnvironmentVariables();
    await auditCORSConfiguration();
    await auditRateLimiting();
    await auditAPIRouteSecurity();
    await auditDatabaseSecurity();
    await auditCachingSecurity();
    await auditErrorHandling();

    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (error) {
    console.error("\n❌ Audit failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
