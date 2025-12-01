import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrgs() {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            processes: true,
          },
        },
      },
    });

    console.log('🏢 Organizations in database:\n');

    if (organizations.length === 0) {
      console.log('❌ No organizations found!\n');
    } else {
      let num = 1;
      for (const org of organizations) {
        console.log(`${num}. ${org.name}`);
        console.log(`   ID: ${org.id}`);
        console.log(`   Users: ${org._count.users}`);
        console.log(`   Processes: ${org._count.processes}`);
        console.log('');
        num++;
      }
    }

    console.log(`Total: ${organizations.length} organizations\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrgs();
