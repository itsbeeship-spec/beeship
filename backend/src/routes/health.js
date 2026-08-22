import express from 'express';
import prisma from '../config/db.js';
import redis from '../config/redis.js';

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  // Test PostgreSQL via Prisma Client
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = `error (${error.message})`;
  }

  // Test Redis connection
  if (redis && redis.status === 'ready') {
    redisStatus = 'connected';
  } else if (redis) {
    redisStatus = `offline (status: ${redis.status})`;
  }

  res.json({
    success: true,
    timestamp: new Date(),
    uptime: process.uptime(),
    services: {
      server: 'healthy',
      database: dbStatus,
      cache: redisStatus,
    },
  });
});

export default router;
