import redis from '../config/redis.js';

/**
 * Caches API GET requests in Redis.
 * Falls back to database/controller if Redis is offline or not configured.
 * @param {number} durationInSeconds Time to live (TTL) in seconds.
 */
export const cacheMiddleware = (durationInSeconds = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if Redis client is not initialized or not fully connected
    if (!redis || redis.status !== 'ready') {
      return next();
    }

    const key = `beeship:cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redis.get(key);

      if (cachedResponse) {
        const { data, contentType } = JSON.parse(cachedResponse);
        console.log(`[Cache] HIT - Key: ${key}`);
        
        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }
        res.setHeader('X-Cache', 'HIT');
        return res.send(data);
      }

      console.log(`[Cache] MISS - Key: ${key}`);

      // Intercept response to store cache before sending to client
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const contentType = res.get('Content-Type');
          const cachePayload = JSON.stringify({
            data: typeof body === 'string' ? body : JSON.stringify(body),
            contentType,
          });

          redis.set(key, cachePayload, 'EX', durationInSeconds)
            .then(() => {
              console.log(`[Cache] Saved - Key: ${key} for ${durationInSeconds}s`);
            })
            .catch((err) => {
              console.error('[Cache] Save failed:', err.message);
            });
        }
        
        res.setHeader('X-Cache', 'MISS');
        return originalSend.apply(res, arguments);
      };

      next();
    } catch (error) {
      console.error('[Cache] Middleware warning:', error.message);
      next();
    }
  };
};

/**
 * Helper to clear cache items starting with a specific prefix or key pattern
 * @param {string} pattern
 */
export const clearCache = async (pattern) => {
  if (!redis || redis.status !== 'ready') return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`[Cache] Cleared keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('[Cache] Clear error:', error.message);
  }
};
