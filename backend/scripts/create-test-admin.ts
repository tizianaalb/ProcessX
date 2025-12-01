import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    console.log('Creating test admin user...\n');

    // Get Tiziana's organization
    const tiziana = await prisma.user.findUnique({
      where: { email: 'tiziana@ballester.de' },
      select: { organizationId: true, organization: { select: { name: true } } },
    });

    if (!tiziana) {
      console.log('Tiziana not found!');
      return;
    }

    console.log('Organization:', tiziana.organization.name);
    console.log('Organization ID:', tiziana.organizationId);
    console.log('');

    // Create test admin user
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const testAdmin = await prisma.user.create({
      data: {
        email: 'admin@ballester.de',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        passwordHash,
        organizationId: tiziana.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    console.log('Test admin created successfully!');
    console.log('Email:', testAdmin.email);
    console.log('Password: TestPassword123!');
    console.log('Role:', testAdmin.role);
    console.log('');

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('User already exists!');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();
