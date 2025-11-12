import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Only load bundle analyzer when actually analyzing
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Increase max listeners to prevent warnings
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yachtclub.boats",
      },
      {
        protocol: "https",
        hostname: "uaednwpxursknmwdeejn.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 90, 95, 100],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Compress output
  compress: true,

  // PoweredBy header removal
  poweredByHeader: false,

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Skip ESLint during builds (run separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip TypeScript checking during builds (run separately in CI)
  typescript: {
    ignoreBuildErrors: true,
  },

  // FIX #1: Disable React Strict Mode in dev (causes double renders)
  reactStrictMode: !isDev,

  // Optimize chunks
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "@supabase/supabase-js",
      "react-window",
    ],
    optimizeCss: true,
  },

  // FIX #5: Only apply webpack chunk splitting in production
  webpack: (config, { isServer }) => {
    if (!isServer && !isDev) {
      // Split chunks for better caching (PRODUCTION ONLY)
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "async",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: "react",
              chunks: "all",
              priority: 30,
            },
            three: {
              test: /[\\/]node_modules[\\/](@react-three|three)[\\/]/,
              name: "three",
              chunks: "async",
              priority: 25,
            },
            charts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: "charts",
              chunks: "async",
              priority: 25,
            },
            adminRoutes: {
              test: /[\\/]app[\\/]admin[\\/]/,
              name: "admin-dashboard",
              chunks: "async",
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            vendorRoutes: {
              test: /[\\/]app[\\/]vendor[\\/]/,
              name: "vendor-dashboard",
              chunks: "async",
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            storefrontRoutes: {
              test: /[\\/]app[\\/]\(storefront\)[\\/]/,
              name: "storefront",
              chunks: "async",
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            posRoutes: {
              test: /[\\/]app[\\/]pos[\\/]/,
              name: "pos",
              chunks: "async",
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // FIX #6: Memoize headers to avoid recomputing on every request
  async headers() {
    // Simplified dev headers (no CSP, basic caching)
    if (isDev) {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-DNS-Prefetch-Control", value: "on" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            {
              key: "Permissions-Policy",
              value: "camera=(self), microphone=(), geolocation=(self)",
            },
          ],
        },
        {
          source: "/api/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            },
            {
              key: "Pragma",
              value: "no-cache",
            },
            {
              key: "Expires",
              value: "0",
            },
          ],
        },
        // FIX #7: Allow caching of static assets in dev
        {
          source: "/_next/static/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, immutable", // 1 hour cache in dev
            },
          ],
        },
      ];
    }

    // Full production headers with CSP
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https: mediastream:;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
      frame-src 'self' https://accept.authorize.net https://test.authorize.net https://vercel.live;
      connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com wss://*.supabase.co;
      worker-src 'self' blob:;
      media-src 'self' blob: data: mediastream:;
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self), payment=(self)",
          },
          { key: "Content-Security-Policy", value: ContentSecurityPolicy },
          // CRITICAL: Prevent aggressive caching of HTML pages (fixes navbar caching bug)
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

// FIX #4: Only wrap with Sentry in production AND if auth token is available
const configWithAnalyzer = withBundleAnalyzer(nextConfig);

// Skip Sentry entirely if no auth token (prevents build retries)
const hasSentryAuth = process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT;

export default isDev || !hasSentryAuth
  ? configWithAnalyzer
  : withSentryConfig(configWithAnalyzer, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    });
