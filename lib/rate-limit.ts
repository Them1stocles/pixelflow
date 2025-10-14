import { getRedis } from './redis';

/**
 * Rate limiting using Redis sliding window algorithm
 * More accurate than fixed window, prevents bursts at window boundaries
 */
export async function checkRateLimit(params: {
  identifier: string; // IP address or user ID
  limit: number; // Max requests
  window: number; // Time window in seconds
}): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const { identifier, limit, window } = params;
  const redis = getRedis();

  const key = `rate-limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  try {
    // Remove old entries outside the time window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await redis.zcard(key);

    if (count >= limit) {
      // Get the oldest request timestamp to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldest.length > 0 ? parseInt(oldest[1]) + window * 1000 : now + window * 1000;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry on the key
    await redis.expire(key, window);

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: now + window * 1000,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);

    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + window * 1000,
    };
  }
}

/**
 * Check if an event is a duplicate within the deduplication window
 * Returns true if the event is a duplicate (should be rejected)
 */
export async function checkDuplication(params: {
  eventId: string;
  windowSeconds?: number; // Default: 300 seconds (5 minutes)
}): Promise<{
  isDuplicate: boolean;
}> {
  const { eventId, windowSeconds = 300 } = params;
  const redis = getRedis();

  const key = `dedup:${eventId}`;

  try {
    // Try to set the key with NX (only if not exists)
    const wasSet = await redis.set(key, '1', 'EX', windowSeconds, 'NX');

    return {
      isDuplicate: wasSet !== 'OK',
    };
  } catch (error) {
    console.error('Deduplication check error:', error);

    // Fail open - allow event if Redis is down
    // Better to have duplicates than miss events
    return {
      isDuplicate: false,
    };
  }
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMITS = {
  track: {
    limit: 100, // 100 requests
    window: 60, // per minute
  },
  api: {
    limit: 60, // 60 requests
    window: 60, // per minute
  },
  webhook: {
    limit: 1000, // 1000 requests (trusted source)
    window: 60, // per minute
  },
} as const;
