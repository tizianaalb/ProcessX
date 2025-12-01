import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminView() {
  try {
    console.log('Testing admin user view...\n');

    // Find a regular admin user (not super_admin)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        organization: {
          select: { name: true }
        }
      },
    });

    if (!adminUser) {
      console.log('No admin user found!');
      return;
    }

    console.log('Testing as admin user:');
    console.log('Name:', adminUser.firstName, adminUser.lastName);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('Organization:', adminUser.organization.name);
    console.log('');

    // Simulate the whereClause for a regular admin
    const whereClause = {
      organizationId: adminUser.organizationId,
      role: { not: 'super_admin' }
    };

    console.log('Query whereClause:', JSON.stringify(whereClause, null, 2));
    console.log('');

    // Get users that this admin should see
    const visibleUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Users visible to this admin:', visibleUsers.length);
    console.log('');
    
    if (visibleUsers.length === 0) {
      console.log('No users found! Checking organization...\n');
      
      // Check how many users are actually in this org
      const allOrgUsers = await prisma.user.findMany({
        where: { organizationId: adminUser.organizationId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      
      console.log('Total users in organization:', allOrgUsers.length);
      allOrgUsers.forEach((u) => {
        console.log(`- ${u.firstName} ${u.lastName} (${u.email}) - Role: ${u.role}`);
      });
    } else {
      visibleUsers.forEach((u) => {
        console.log(`- ${u.firstName} ${u.lastName} (${u.email}) - Role: ${u.role}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminView();
