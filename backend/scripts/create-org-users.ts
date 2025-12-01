import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOrgUsers() {
  try {
    console.log('Creating users in Hello Inc. organization...\n');

    const tiziana = await prisma.user.findUnique({
      where: { email: 'tiziana@ballester.de' },
      select: { organizationId: true },
    });

    if (!tiziana) {
      console.log('Tiziana not found!');
      return;
    }

    const orgId = tiziana.organizationId;
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const users = [
      { email: 'user1@ballester.de', firstName: 'User', lastName: 'One', role: 'user' },
      { email: 'user2@ballester.de', firstName: 'User', lastName: 'Two', role: 'user' },
      { email: 'manager@ballester.de', firstName: 'Manager', lastName: 'One', role: 'admin' },
    ];

    for (const userData of users) {
      try {
        const user = await prisma.user.create({
          data: {
            ...userData,
            passwordHash,
            organizationId: orgId,
          },
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });
        console.log(`Created: ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`Already exists: ${userData.email}`);
        } else {
          console.error(`Error creating ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\nAll users created successfully!');
    console.log('Password for all: TestPassword123!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOrgUsers();
