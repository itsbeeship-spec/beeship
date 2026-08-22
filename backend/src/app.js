// Server reload: Support DB models & real backend APIs connected
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import configurations, middlewares and routes
import { errorHandler } from './middlewares/error.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { corsOptions } from './config/cors.js';
import { connectDB, disconnectDB } from './config/db.js';
import { disconnectRedis } from './config/redis.js';
import apiRouter from './routes/index.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// 1. Base Security & Optimization Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "*.amazonaws.com"],
      connectSrc: ["'self'", process.env.CLIENT_ORIGIN || "http://localhost:3000"],

    },
  },
  crossOriginEmbedderPolicy: true,
}));

app.use(cors(corsOptions));
app.use(compression()); // Gzip compression

// 2. API Rate Limiting (Prevents DDoS and abuse)
app.use('/api', globalLimiter);

// 3. Request parsing configurations (Restricted to 1MB to prevent large request buffers)
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend static build files from 'public' folder inside backend with proper browser cache
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath, { 
  extensions: ['html', 'htm'],
  setHeaders: (res, filePath) => {
    if (filePath.includes('_next') || filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// 4. Central Route Mount (Bundles health, auth, documents, etc.)
app.use('/api', apiRouter);

// Fallback all non-API GET requests to index.html / html files for smooth SPA routing
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }

  const cleanPath = req.path;
  const htmlFilePath = path.join(publicPath, cleanPath.endsWith('.html') ? cleanPath : `${cleanPath}.html`);
  const htmlIndexPath = path.join(publicPath, cleanPath, 'index.html');

  // If exact HTML page exists (e.g. /label.html or /invoice.html), serve it
  if (fs.existsSync(htmlFilePath)) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.sendFile(htmlFilePath);
  }

  // If index.html exists inside subdirectory (e.g. /label/index.html)
  if (fs.existsSync(htmlIndexPath)) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.sendFile(htmlIndexPath);
  }

  // Fallback to main index.html for client-side React routes
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Catch 404
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Central Error Handler Middleware
app.use(errorHandler);

// Server startup
const server = app.listen(PORT, async () => {
  const serverUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  console.log(`=================================`);
  console.log(`🚀 Secure Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔊 Server ready on ${serverUrl} (Port ${PORT})`);
  
  // Verify Database Connection on Startup
  await connectDB();
  
  console.log(`=================================`);
});

// Handle port already in use error gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port and restart.`);
    process.exit(1);
  } else {
    throw err;
  }
});

// Graceful shutdown handler for production process managers
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
  
  const forceTimeout = setTimeout(() => {
    console.error('🔴 Graceful shutdown timed out. Forcing termination.');
    process.exit(1);
  }, 10000); // 10 seconds timeout

  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          console.log('🟢 HTTP server closed successfully.');
          resolve();
        });
      });
    }
    
    await disconnectDB();
    await disconnectRedis();
    
    console.log('🟢 Graceful shutdown completed. Exiting.');
    clearTimeout(forceTimeout);
    process.exit(0);
  } catch (error) {
    console.error('🔴 Error during graceful shutdown:', error.message);
    clearTimeout(forceTimeout);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
