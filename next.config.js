/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  serverExternalPackages: ['firebase-admin'],
  
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: false,
  },

  // Configuration for Firebase App Hosting
  poweredByHeader: false,
  
  // Ensure proper build output structure for Firebase App Hosting
  outputFileTracingRoot: process.cwd(),
};

module.exports = nextConfig; 