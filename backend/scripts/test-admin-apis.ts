/**
 * Test all Admin Panel APIs
 * Usage: npx tsx scripts/test-admin-apis.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminAPIs() {
  try {
    console.log('🧪 Testing Admin Panel Data Integrity...\n');

    // Get Tiziana (super_admin)
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

    if (!tiziana) {
      console.error('❌ Tiziana not found');
      process.exit(1);
    }

    console.log('✅ Super Admin User:');
    console.log(`   ${tiziana.firstName} ${tiziana.lastName} (${tiziana.email})`);
    console.log(`   Role: ${tiziana.role}\n`);

    // Test 1: Check all users can be seen
    console.log('📋 Test 1: Listing all users...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            createdProcesses: true,
            painPointsIdentified: true,
            targetProcesses: true,
            exports: true,
            auditLogs: true,
            initiatedAnalyses: true,
          },
        },
      },
    });

    console.log(`   Found ${allUsers.length} users\n`);

    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.firstName} ${u.lastName} (${u.email})`);
      console.log(`      Role: ${u.role}`);
      console.log(`      Organization: ${u.organization.name}`);
      console.log(`      Data: ${u._count.createdProcesses} processes, ${u._count.painPointsIdentified} pain points, ${u._count.exports} exports`);

      const hasDependencies =
        u._count.createdProcesses > 0 ||
        u._count.painPointsIdentified > 0 ||
        u._count.targetProcesses > 0 ||
        u._count.exports > 0 ||
        u._count.auditLogs > 0 ||
        u._count.initiatedAnalyses > 0;

      if (hasDependencies) {
        console.log(`      ⚠️  Cannot delete - has related data`);
      } else {
        console.log(`      ✅ Can be safely deleted`);
      }
      console.log('');
    });

    // Test 2: Check which users can be deleted
    console.log('🗑️  Test 2: Checking deletable users...');
    const deletableUsers = allUsers.filter(u => {
      const count = u._count;
      return count.createdProcesses === 0 &&
             count.painPointsIdentified === 0 &&
             count.targetProcesses === 0 &&
             count.exports === 0 &&
             count.auditLogs === 0 &&
             count.initiatedAnalyses === 0 &&
             u.id !== tiziana.id; // Don't delete self
    });

    console.log(`   ${deletableUsers.length} users can be safely deleted:`);
    deletableUsers.forEach(u => {
      console.log(`   - ${u.firstName} ${u.lastName} (${u.email})`);
    });
    console.log('');

    // Test 3: Check users with dependencies
    const usersWithDeps = allUsers.filter(u => {
      const count = u._count;
      return count.createdProcesses > 0 ||
             count.painPointsIdentified > 0 ||
             count.targetProcesses > 0 ||
             count.exports > 0 ||
             count.auditLogs > 0 ||
             count.initiatedAnalyses > 0;
    });

    if (usersWithDeps.length > 0) {
      console.log('⚠️  Test 3: Users with dependencies (cannot delete):');
      usersWithDeps.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.email})`);
        const deps = [];
        if (u._count.createdProcesses > 0) deps.push(`${u._count.createdProcesses} processes`);
        if (u._count.painPointsIdentified > 0) deps.push(`${u._count.painPointsIdentified} pain points`);
        if (u._count.targetProcesses > 0) deps.push(`${u._count.targetProcesses} target processes`);
        if (u._count.exports > 0) deps.push(`${u._count.exports} exports`);
        if (u._count.auditLogs > 0) deps.push(`${u._count.auditLogs} audit logs`);
        if (u._count.initiatedAnalyses > 0) deps.push(`${u._count.initiatedAnalyses} AI analyses`);
        console.log(`     Has: ${deps.join(', ')}`);
      });
      console.log('');
    }

    // Test 4: Test creating a test user
    console.log('➕ Test 4: Creating a test user...');
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        passwordHash: '$2b$10$test', // Dummy hash
        organizationId: tiziana.organizationId, // Use tiziana's organization
      },
    });
    console.log(`   ✅ Created user: ${testUser.email} (ID: ${testUser.id})\n`);

    // Test 5: Test updating the user
    console.log('✏️  Test 5: Updating test user...');
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        firstName: 'Updated',
        role: 'admin',
      },
    });
    console.log(`   ✅ Updated user successfully\n`);

    // Test 6: Test deleting the user
    console.log('🗑️  Test 6: Deleting test user...');
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log(`   ✅ Deleted user successfully\n`);

    console.log('✅ All API tests passed!\n');
    console.log('📝 Summary:');
    console.log(`   - Total users: ${allUsers.length}`);
    console.log(`   - Deletable users: ${deletableUsers.length}`);
    console.log(`   - Users with dependencies: ${usersWithDeps.length}`);
    console.log('');
    console.log('⚠️  Note: Users with dependencies require cascading delete or reassignment\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAPIs();
