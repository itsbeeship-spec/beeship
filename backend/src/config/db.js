
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let prisma;

try {
  let connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full').replace('sslmode=prefer', 'sslmode=verify-full');
  }
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });

  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

  if (!prisma.coupon || !prisma.globalNotificationSetting || !prisma.supportTicket) {
    console.log('🔄 Support & Notification models missing from Prisma Client. Auto-generating client...');
    try {
      execSync('npx prisma generate');
      prisma = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
      });
    } catch (err) {
      console.warn('Prisma auto-generate notice:', err.message);
    }
  }
} catch (e) {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });
}

/**
 * Validates database connectivity on server startup and auto-pushes missing tables
 */
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log(`🟢 PostgreSQL Database connected successfully via Prisma PG Adapter.`);

    // Auto-verify if support ticket table exists in DB, push schema if missing
    try {
      await prisma.supportTicket.findFirst().catch((err) => {
        if (err.message && err.message.includes('does not exist')) {
          console.log('⚡ Table public.SupportTicket missing in DB. Pushing Prisma schema to DB...');
          execSync('npx prisma db push --accept-data-loss');
          console.log('✅ Database schema pushed successfully!');
        }
      });
    } catch (tblErr) {
      console.warn('DB table auto-push notice:', tblErr.message);
    }
  } catch (error) {
    console.error(`🔴 PostgreSQL Database connection failed! Error:`, error.message);
  }
};

/**
 * Disconnects the Prisma client cleanly during graceful shutdown
 */
export const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log(`🟢 PostgreSQL Database disconnected cleanly.`);
  } catch (error) {
    console.error(`🔴 Error during PostgreSQL disconnect:`, error.message);
  }
};

export default prisma;