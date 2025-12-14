import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeUserSuperAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    if (user.role === 'super_admin') {
      console.log('✅ User is already a super_admin');
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'super_admin' },
    });

    console.log('✅ User upgraded to super_admin successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: tsx make-user-super-admin.ts <email>');
  process.exit(1);
}

makeUserSuperAdmin(email);
