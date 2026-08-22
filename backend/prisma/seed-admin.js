import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = "admin@beeship.com";
  const mobile = "9999999999";
  const password = "admin123";
  
  try {
    // Check if the user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { mobile }
        ]
      }
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      // Update existing user to admin status
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'SUPER_ADMIN',
          kycStatus: 'APPROVED',
          password: hashedPassword
        }
      });
      console.log(`🟢 Super Admin account updated: ${email} / ${password}`);
    } else {
      // Create new admin user
      user = await prisma.user.create({
        data: {
          email,
          mobile,
          firstName: "Super",
          lastName: "Admin",
          companyName: "BeeShip Corp",
          shipmentsRange: "1000+",
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          kycStatus: 'APPROVED'
        }
      });
      console.log(`🟢 Super Admin account created successfully!`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
    }
  } catch (error) {
    console.error("❌ Failed to seed Super Admin:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
