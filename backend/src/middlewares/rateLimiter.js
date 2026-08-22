import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

// Configure the rate limit store dynamically using Redis if available
let rateLimitStore = undefined;

if (redisClient) {
  try {
    rateLimitStore = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });
  } catch (err) {
    console.warn('[RateLimiter] Redis store binding failed:', err.message);
  }
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
