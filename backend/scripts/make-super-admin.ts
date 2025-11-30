/**
 * Upgrade a user to super_admin role
 * Usage: npx tsx scripts/make-super-admin.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeSuperAdmin(email: string) {
  try {
    console.log('🔐 Upgrading user to super_admin...\n');

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
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
    console.log(`   Current Role: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);

    if (user.role === 'super_admin') {
      console.log('✅ User is already a super_admin!\n');
      process.exit(0);
    }

    // Update role to super_admin
    await prisma.user.update({
      where: { email },
      data: { role: 'super_admin' },
    });

    console.log('✅ User upgraded to super_admin successfully!\n');
    console.log('📧 Email:', email);
    console.log('👑 New Role: super_admin');
    console.log('\n⚠️  Super admins can manage users across ALL organizations!\n');

  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.error('   Usage: npx tsx scripts/make-super-admin.ts <email>');
  console.error('   Example: npx tsx scripts/make-super-admin.ts user@example.com\n');
  process.exit(1);
}

makeSuperAdmin(email);
