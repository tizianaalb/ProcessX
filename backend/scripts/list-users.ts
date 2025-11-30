/**
 * List all users in the database
 * Usage: DATABASE_URL="postgresql://..." npx tsx scripts/list-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('👥 Fetching all users...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database\n');
      process.exit(0);
    }

    console.log(`✅ Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Organization ID: ${user.organizationId}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log(`   ID: ${user.id}\n`);
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
