import { Queue, Worker, Job } from 'bullmq';
import { getRedis } from '../redis';
import { pixelSender } from '../services/pixel-sender';
import prisma from '../prisma';
import type { TrackingEventJob } from '../types';

/**
 * BullMQ Queue for processing tracking events
 * Handles retries, failures, and concurrent processing
 */

const QUEUE_NAME = 'tracking-events';

// Create queue instance
let eventQueue: Queue<TrackingEventJob> | null = null;

/**
 * Redis connection configuration for BullMQ
 * BullMQ requires maxRetriesPerRequest: null for blocking operations
 */
function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  // Parse Redis URL
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
    enableReadyCheck: false,
    tls: redisUrl.startsWith('rediss://') ? {
      rejectUnauthorized: false,
    } : undefined,
  };
}

/**
 * Get or create event queue
 */
export function getEventQueue(): Queue<TrackingEventJob> {
  if (!eventQueue) {
    eventQueue = new Queue<TrackingEventJob>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5s, then 25s, then 125s
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 5000, // Keep max 5000 failed jobs
        },
      },
    });

    eventQueue.on('error', (error) => {
      console.error('Queue error:', error);
    });

    console.log('✓ Event queue initialized');
  }

  return eventQueue;
}

/**
 * Add event to processing queue
 */
export async function queueEvent(data: TrackingEventJob): Promise<void> {
  const queue = getEventQueue();

  await queue.add('process-event', data, {
    jobId: data.trackingEventId, // Use event ID as job ID to prevent duplicates
  });

  console.log(`✓ Queued event ${data.trackingEventId} for processing`);
}

/**
 * Worker for processing tracking events
 * Should be run in a separate process or background job
 */
let worker: Worker<TrackingEventJob> | null = null;

export function startEventWorker(): Worker<TrackingEventJob> {
  if (worker) {
    console.log('Worker already running');
    return worker;
  }

  worker = new Worker<TrackingEventJob>(
    QUEUE_NAME,
    async (job: Job<TrackingEventJob>) => {
      const { trackingEventId, merchantId, retry } = job.data;

      console.log(`Processing event ${trackingEventId} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

      try {
        // Update event status to processing
        await prisma.trackingEvent.update({
          where: { id: trackingEventId },
          data: { status: 'processing' },
        });

        // Send to all configured platforms
        await pixelSender.sendToAllPlatforms({
          trackingEventId,
          merchantId,
        });

        // Update event status to completed
        await prisma.trackingEvent.update({
          where: { id: trackingEventId },
          data: {
            status: 'completed',
            processedAt: new Date(),
          },
        });

        console.log(`✓ Successfully processed event ${trackingEventId}`);
      } catch (error) {
        console.error(`✗ Error processing event ${trackingEventId}:`, error);

        // Update retry count
        await prisma.trackingEvent.update({
          where: { id: trackingEventId },
          data: {
            retryCount: {
              increment: 1,
            },
          },
        });

        // If this was the last attempt, mark as failed
        if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
          await prisma.trackingEvent.update({
            where: { id: trackingEventId },
            data: {
              status: 'failed',
              processedAt: new Date(),
            },
          });

          console.error(`✗ Event ${trackingEventId} failed after ${job.attemptsMade + 1} attempts`);
        }

        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 10, // Process up to 10 jobs simultaneously
      limiter: {
        max: 100, // Max 100 jobs
        duration: 1000, // per second
      },
    }
  );

  // Event listeners
  worker.on('completed', (job) => {
    console.log(`✓ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    if (job) {
      console.error(`✗ Job ${job.id} failed:`, err.message);
    }
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} stalled`);
  });

  console.log('✓ Event worker started');

  return worker;
}

/**
 * Stop the worker gracefully
 */
export async function stopEventWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('✓ Worker stopped');
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getEventQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

/**
 * Retry failed jobs
 */
export async function retryFailedJobs(): Promise<number> {
  const queue = getEventQueue();
  const failedJobs = await queue.getFailed();

  let retried = 0;
  for (const job of failedJobs) {
    await job.retry();
    retried++;
  }

  console.log(`✓ Retried ${retried} failed jobs`);
  return retried;
}

/**
 * Clean old jobs
 */
export async function cleanOldJobs(): Promise<void> {
  const queue = getEventQueue();

  // Clean completed jobs older than 1 hour
  await queue.clean(3600 * 1000, 1000, 'completed');

  // Clean failed jobs older than 24 hours
  await queue.clean(86400 * 1000, 5000, 'failed');

  console.log('✓ Cleaned old jobs');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await stopEventWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await stopEventWorker();
  process.exit(0);
});
