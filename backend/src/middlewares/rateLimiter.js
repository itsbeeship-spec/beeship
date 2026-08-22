import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

// Helper to instantiate a dedicated RedisStore per rate limiter (prevents ERL_STORE_REUSE)
const createRedisStore = (prefix) => {
  if (!redisClient) return undefined;
  try {
    return new RedisStore({
      prefix,
      sendCommand: (...args) => redisClient.call(...args),
    });
  } catch (err) {
    return undefined;
  }
};

// Global API Limiter (2000 requests per 15 minutes per IP)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  standardHeaders: true, 
  legacyHeaders: false,
  store: createRedisStore('rl:global:'),
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
  store: createRedisStore('rl:auth:'),
  message: {
    success: false,
    error: {
      message: 'Too many login or registration attempts. Please try again after 15 minutes.',
      statusCode: 429,
    },
  },
});
