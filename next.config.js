/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in production (prevents source code exposure)
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
    // Only allow images from trusted domains
    domains: ['localhost'],
  },

  // Add security headers for production
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
      // Prevent uploads from being executed as scripts
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Disposition', value: 'inline' },
        ],
      },
    ];
  },

  // Disable powered-by header
  poweredByHeader: false,
}

module.exports = nextConfig
