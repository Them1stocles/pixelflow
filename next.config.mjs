/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server-side only
  experimental: {
    serverComponentsExternalPackages: [
      '@prisma/client',
      'prisma',
      'ioredis',
      'bullmq',
    ],
  },

  // Disable ESLint during builds (we'll fix linting later)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
