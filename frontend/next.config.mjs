/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    // Allow script-src self/unsafe-inline for Next.js hot-reload dev support; frame-ancestors deny blocks Clickjacking
    value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.amazonaws.com; connect-src 'self' ${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;`,
  },

  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
