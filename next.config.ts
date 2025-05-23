import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.*.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://misshientest.com/backend-api/:path*'
          : 'http://localhost:8000/backend-api/:path*',
      },
    ];
  },
  headers: async () => {
    return [
      {
        // Chỉ cache các tài nguyên tĩnh
        source: '/(_next/static|_next/image|favicon.ico|apple-touch-icon.png|favicon-32x32.png|favicon-16x16.png|android-chrome-192x192.png|android-chrome-512x512.png|site.webmanifest)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Không cache các trang động
        source: '/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|favicon-32x32.png|favicon-16x16.png|android-chrome-192x192.png|android-chrome-512x512.png|site.webmanifest).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            key: 'Content-Security-Policy',
            value: "default-src 'self' https: http: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://misshientest.com http://localhost:8000; img-src 'self' https: http: data: blob:;",
          },
        ],
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig; 