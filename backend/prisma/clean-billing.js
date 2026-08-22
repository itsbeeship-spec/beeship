import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete all records in BillingRate
    const result = await prisma.$executeRawUnsafe('DELETE FROM "BillingRate";');
    console.log("🟢 Deleted all rows in BillingRate:", result);
  } catch (error) {
    console.error("❌ Failed to clean BillingRate:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
