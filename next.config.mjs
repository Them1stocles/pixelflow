/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma and other packages that should not be bundled
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'ioredis',
    'bullmq',
  ],
};

export default nextConfig;
