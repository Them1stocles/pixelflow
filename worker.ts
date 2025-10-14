/**
 * BullMQ Worker Script
 * Run this script separately to process tracking events in the background
 *
 * Usage:
 *   npm run worker
 *
 * Or for production:
 *   node dist/worker.js
 */

import { startEventWorker } from './lib/queue/event-queue';
import { pingRedis } from './lib/redis';

async function main() {
  console.log('Starting PixelFlow Event Worker...');

  // Debug: Check environment variables
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- REDIS_URL exists:', !!process.env.REDIS_URL);
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('- WHOP_API_KEY exists:', !!process.env.WHOP_API_KEY);

  // Check Redis connection
  const redisOk = await pingRedis();

  if (!redisOk) {
    console.error('❌ Failed to connect to Redis');
    console.error('   Please check your REDIS_URL environment variable');
    process.exit(1);
  }

  console.log('✓ Redis connection established');

  // Start the worker
  const worker = startEventWorker();

  console.log('✓ Event worker started');
  console.log('   Waiting for events to process...');
  console.log('   Press Ctrl+C to stop');

  // Keep process alive
  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await worker.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
