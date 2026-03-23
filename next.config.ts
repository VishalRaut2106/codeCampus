import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack configuration for Next.js 16
  turbopack: {},
  // ESLint configuration is now handled separately in Next.js 16
  // Enable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Improve performance and security
  poweredByHeader: false,
  compress: true,
  // Better error handling
  generateEtags: false,
};

export default nextConfig;
