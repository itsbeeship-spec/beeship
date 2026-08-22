import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rates = [
    {
      courier: "Amazon Shipping",
      withinCity: 60,
      withinState: 60,
      metroToMetro: 60,
      restOfIndia: 60,
      northEastAndJk: 60,
      codCharges: 35,
      codPercent: 2,
    },
    {
      courier: "Delhivery Surface (DS)",
      withinCity: 60,
      withinState: 60,
      metroToMetro: 60,
      restOfIndia: 60,
      northEastAndJk: 60,
      codCharges: 35,
      codPercent: 2,
    },
    {
      courier: "Xpressbees Surface",
      withinCity: 60,
      withinState: 60,
      metroToMetro: 60,
      restOfIndia: 60,
      northEastAndJk: 60,
      codCharges: 35,
      codPercent: 2,
    },
    {
      courier: "Bluedart Surface (N)",
      withinCity: 75,
      withinState: 75,
      metroToMetro: 75,
      restOfIndia: 75,
      northEastAndJk: 75,
      codCharges: 35,
      codPercent: 2,
    },
  ];

  try {
    for (const rate of rates) {
      await prisma.billingRate.upsert({
        where: {
          courier_userId: {
            courier: rate.courier,
            userId: "GLOBAL",
          }
        },
        update: rate,
        create: {
          ...rate,
          userId: "GLOBAL",
        },
      });
    }
    console.log("🟢 Courier billing rates seeded/updated successfully!");
  } catch (error) {
    console.error("❌ Failed to seed billing rates:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
