import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

// Configure the rate limit store dynamically based on Redis status
let rateLimitStore = undefined;

if (redisClient && redisClient.status === 'ready') {
  try {
    rateLimitStore = new RedisStore({
      // Wrapper to direct commands to the ioredis instance
      sendCommand: (...args) => redisClient.call(...args),
    });
    console.log('[RateLimiter] Configured with Redis store');
  } catch (err) {
    console.error('[RateLimiter] Failed to bind Redis store:', err.message);
  }
}

if (!rateLimitStore) {
  console.warn('[RateLimiter] Redis is offline. Initializing with in-memory store.');
}

// Global API Limiter (2000 requests per 15 minutes per IP)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  standardHeaders: true, 
  legacyHeaders: false,
  store: rateLimitStore, // Defaults to in-memory if undefined
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again after 15 minutes.',
      statusCode: 429,
    },
  },
});

// Strict authentication endpoints limiter (100 attempts per 15 minutes per IP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore,
  message: {
    success: false,
    error: {
      message: 'Too many login or registration attempts. Please try again after 15 minutes.',
      statusCode: 429,
    },
  },
});
