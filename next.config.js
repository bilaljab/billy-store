/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

  images: {
    // Enable Next.js image optimization instead of unoptimized
    // This auto-converts to WebP and resizes for faster loading
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
    formats: ['image/webp', 'image/avif'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache public images for 7 days
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/:file(.*\\.(?:jpg|jpeg|png|webp|svg|ico))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ];
  },

  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Experimental: faster builds and smaller bundles
  experimental: {
    optimizePackageImports: ['@libsql/client'],
  },
}

module.exports = nextConfig
