/**
 * Reset user password - designed to run via Railway CLI
 * Usage: railway run npx tsx scripts/reset-password-railway.ts
 *
 * This script prompts for email and password when run, making it compatible
 * with railway run which doesn't support command-line arguments well.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Hardcoded for this specific use case
    const email = 'tiziana@ballester.de';
    const newPassword = 'ProcessX2024!';

    console.log('🔐 Resetting password for Railway deployment...\n');
    console.log(`   Target user: ${email}`);
    console.log(`   New password: ${newPassword}\n`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('👤 User found:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}\n`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    console.log('✅ Password reset successfully!\n');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);
    console.log('\n⚠️  Remember to change this password after logging in!\n');
    console.log('🌐 Login at: https://processx.up.railway.app\n');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
