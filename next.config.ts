import type { NextConfig } from "next";

// Bundle analyzer (run with: ANALYZE=true npm run build)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Increase max listeners to prevent warnings
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yachtclub.boats',
      },
      {
        protocol: 'https',
        hostname: 'uaednwpxursknmwdeejn.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 90, 95, 100],
    minimumCacheTTL: 60,
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Compress output
  compress: true,
  
  // PoweredBy header removal
  poweredByHeader: false,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Enable React strict mode (temporarily disabled for debugging)
  reactStrictMode: false,
  
  // Optimize chunks
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', '@supabase/supabase-js', 'react-window'],
    optimizeCss: true,
    // Turbo disabled for stability - use webpack instead
    // turbo: {
    //   rules: {
    //     '*.svg': {
    //       loaders: ['@svgr/webpack'],
    //       as: '*.js',
    //     },
    //   },
    // },
  },
  
  // Webpack optimization for production
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'async',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Heavy libraries get their own chunks
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30,
            },
            three: {
              test: /[\\/]node_modules[\\/](@react-three|three)[\\/]/,
              name: 'three',
              chunks: 'async',
              priority: 25,
            },
            charts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'charts',
              chunks: 'async',
              priority: 25,
            },
            // Admin dashboard routes
            adminRoutes: {
              test: /[\\/]app[\\/]admin[\\/]/,
              name: 'admin-dashboard',
              chunks: 'async',
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            // Vendor dashboard routes
            vendorRoutes: {
              test: /[\\/]app[\\/]vendor[\\/]/,
              name: 'vendor-dashboard',
              chunks: 'async',
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            // Storefront routes
            storefrontRoutes: {
              test: /[\\/]app[\\/]\(storefront\)[\\/]/,
              name: 'storefront',
              chunks: 'async',
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            // POS routes
            posRoutes: {
              test: /[\\/]app[\\/]pos[\\/]/,
              name: 'pos',
              chunks: 'async',
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
  
  // Headers for caching and performance
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          ...(isDev ? [{
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          }] : []),
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev 
              ? 'no-store, no-cache, must-revalidate, max-age=0'
              : 'public, s-maxage=60, stale-while-revalidate=30',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev
              ? 'no-store, must-revalidate, max-age=0'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack optimizations disabled for build stability
  // webpack: (config, { isServer }) => {
  //   return config;
  // },
};

export default withBundleAnalyzer(nextConfig);
