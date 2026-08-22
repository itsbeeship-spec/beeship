import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emailOrMobile = process.argv[2];
  if (!emailOrMobile) {
    console.error("❌ Usage: node prisma/make-admin.js <email_or_mobile_number>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrMobile },
          { mobile: emailOrMobile }
        ]
      }
    });

    if (!user) {
      console.error(`❌ Error: User with email/mobile '${emailOrMobile}' not found.`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });

    console.log(`🟢 Success! User ${updated.firstName} ${updated.lastName} (${updated.email}) is now a SUPER ADMIN.`);
  } catch (error) {
    console.error("❌ Failed to make user admin:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
