/**
 * Reset user password
 * Usage:
 *   Local: npx tsx scripts/reset-password.ts <email> <new-password>
 *   Railway: railway run npx tsx scripts/reset-password.ts <email> <new-password>
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log('🔐 Resetting password...\n');

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

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('❌ Error: Missing required arguments\n');
  console.error('Usage:');
  console.error('  npx tsx scripts/reset-password.ts <email> <new-password>\n');
  console.error('Examples:');
  console.error('  npx tsx scripts/reset-password.ts user@example.com NewPass123!');
  console.error('  railway run npx tsx scripts/reset-password.ts user@example.com NewPass123!\n');
  process.exit(1);
}

// Validate password strength
if (newPassword.length < 8) {
  console.error('❌ Error: Password must be at least 8 characters long\n');
  process.exit(1);
}

resetPassword(email, newPassword);
