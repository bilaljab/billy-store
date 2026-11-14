const isDev = process.env.NODE_ENV !== 'production';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`, // unsafe-eval only in dev (webpack HMR)
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

  images: {
    unoptimized: false,
    // Allow-list (not '**'): otherwise anyone can use /_next/image as an open proxy on our Vercel bill.
    // Hosts: Cloudinary uploads, PSN Store covers (findGameInfo), RAWG covers (legacy source).
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'image.api.playstation.com' },
      { protocol: 'https', hostname: 'media.rawg.io' },
    ],
    minimumCacheTTL: 31536000,
    formats: ['image/webp', 'image/avif'],
  },

  // crawlers request /favicon.ico directly; serve the existing icon instead of a 404
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/logos/billy-store-icon.png' }];
  },

  // Old *.vercel.app host -> canonical domain (Vercel can't redirect its own auto-domain from settings)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'billy-store.vercel.app' }],
        destination: 'https://billystoreksa.com/:path*',
        permanent: true,
      },
    ];
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
          // CSP lives here (static, no nonce) so public pages don't need a middleware invocation.
          { key: 'Content-Security-Policy', value: csp },
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
    optimizePackageImports: ['lucide-react', 'motion'],
  },
}

module.exports = nextConfig
