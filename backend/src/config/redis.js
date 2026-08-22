import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redis = null;

try {
const options = {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn(`[Redis] Connection failed after ${times} retries. Running without cache.`);
        return null; // Stop retrying and fail gracefully
      }
      return Math.min(times * 1000, 3000);
    },
  };

  if (redisUrl.startsWith('rediss://')) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  redis = new Redis(redisUrl, options);

  redis.on('error', () => {
    // Gracefully handle errors silently
  });

  redis.on('connect', () => {
    // Connected
  });
} catch (error) {
  // Gracefully handle initialization error
}

/**
 * Closes the Redis client cleanly during graceful shutdown
 */
export const disconnectRedis = async () => {
  if (redis) {
    try {
      await redis.quit();
      console.log(`🟢 Redis connection closed cleanly.`);
    } catch (error) {
      console.error(`🔴 Error during Redis disconnect:`, error.message);
    }
  }
};

export default redis;
