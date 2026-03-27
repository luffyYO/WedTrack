import { Redis } from 'https://esm.sh/@upstash/redis'

const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') || '';
const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '';

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

/**
 * Validates and increments a rate-limit counter in Redis.
 * If Redis is unavailable or misconfigured, it fails gracefully (allows the request).
 */
export const checkRateLimit = async (key: string, limit: number, windowSeconds: number) => {
  if (!redisUrl || !redisToken) {
    console.error('[Redis Error] Upstash credentials missing. Rate limiting is currently bypassed.');
    return { success: true, bypassed: true };
  }

  try {
    const current = await redis.incr(key);
    
    // Set expiry only on first hit
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
      console.warn(`[Rate Limit] Blocking request for key: ${key}. Count: ${current}/${limit}`);
      return { success: false, current, limit };
    }

    return { success: true, current, limit };
  } catch (error: any) {
    // Graceful failure: if Redis is down, we allow the request but log the error
    console.error('[Redis Connection Error] Failed to connect to Upstash:', error.message);
    return { success: true, error: error.message, bypassed: true };
  }
};

/**
 * Direct access to Redis for validation/testing purposes.
 */
export const getRedisClient = () => redis;
