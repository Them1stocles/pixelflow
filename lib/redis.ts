import Redis from 'ioredis';

// Singleton pattern for Redis connection
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect when Redis is in readonly mode
          return true;
        }
        return false;
      },
      // TLS configuration for rediss:// URLs (e.g., Upstash)
      tls: redisUrl.startsWith('rediss://') ? {
        rejectUnauthorized: false,
      } : undefined,
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  return redis;
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// Helper function to check Redis connection
export async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedis();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis ping failed:', error);
    return false;
  }
}
