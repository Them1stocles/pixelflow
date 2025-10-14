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
};

export default nextConfig;
