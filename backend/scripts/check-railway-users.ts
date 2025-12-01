import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking Railway database...\n');

    // Check tiziana
    const tiziana = await prisma.user.findUnique({
      where: { email: 'tiziana@ballester.de' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });

    if (tiziana) {
      console.log('✅ Tiziana found:');
      console.log(`   Name: ${tiziana.firstName} ${tiziana.lastName}`);
      console.log(`   Email: ${tiziana.email}`);
      console.log(`   Role: ${tiziana.role}`);
      console.log(`   Organization ID: ${tiziana.organizationId}\n`);
    } else {
      console.log('❌ Tiziana not found!\n');
    }

    // Count all users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}\n`);

    // List all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });

    console.log('👥 All users:');
    allUsers.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.firstName} ${u.lastName} (${u.email})`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Org ID: ${u.organizationId}`);
    });
    console.log('');

    // Count organizations
    const orgCount = await prisma.organization.count();
    console.log(`🏢 Total organizations: ${orgCount}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
