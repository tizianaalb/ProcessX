import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDeleteCurl() {
  try {
    console.log('🧪 Testing deletion of curl master user...\n');

    // Get curl master user
    const curlUser = await prisma.user.findUnique({
      where: { email: 'curl@test.com' },
      include: {
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

    if (!curlUser) {
      console.error('❌ Curl master not found');
      process.exit(1);
    }

    console.log('📋 User to delete:');
    console.log(`   Email: ${curlUser.email}`);
    console.log(`   Name: ${curlUser.firstName} ${curlUser.lastName}`);
    console.log(`   Dependencies:`);
    console.log(`   - Processes: ${curlUser._count.createdProcesses}`);
    console.log(`   - Pain Points: ${curlUser._count.painPointsIdentified}`);
    console.log(`   - Target Processes: ${curlUser._count.targetProcesses}`);
    console.log(`   - Exports: ${curlUser._count.exports}`);
    console.log(`   - Audit Logs: ${curlUser._count.auditLogs}`);
    console.log(`   - AI Analyses: ${curlUser._count.initiatedAnalyses}\n`);

    // Get tiziana (to use as the admin doing the deletion)
    const tiziana = await prisma.user.findUnique({
      where: { email: 'tiziana@ballester.de' },
      select: { id: true },
    });

    if (!tiziana) {
      console.error('❌ Tiziana not found');
      process.exit(1);
    }

    console.log('🗑️  Attempting to delete user with cascading deletion...\n');

    // Delete with cascading
    await prisma.$transaction(async (tx) => {
      // Delete AI analyses initiated by this user
      const deletedAnalyses = await tx.aIAnalysis.deleteMany({
        where: { initiatedById: curlUser.id },
      });
      console.log(`   ✅ Deleted ${deletedAnalyses.count} AI analyses`);

      // Delete approved recommendations by this user
      const updatedRecs = await tx.processRecommendation.updateMany({
        where: { approvedById: curlUser.id },
        data: { approvedById: null },
      });
      console.log(`   ✅ Updated ${updatedRecs.count} approved recommendations`);

      // Delete audit logs
      const deletedLogs = await tx.auditLog.deleteMany({
        where: { userId: curlUser.id },
      });
      console.log(`   ✅ Deleted ${deletedLogs.count} audit logs`);

      // Delete exports
      const deletedExports = await tx.export.deleteMany({
        where: { userId: curlUser.id },
      });
      console.log(`   ✅ Deleted ${deletedExports.count} exports`);

      // Transfer pain points to tiziana
      const transferredPainPoints = await tx.painPoint.updateMany({
        where: { identifiedById: curlUser.id },
        data: { identifiedById: tiziana.id },
      });
      console.log(`   ✅ Transferred ${transferredPainPoints.count} pain points to tiziana`);

      // Delete target processes created by this user
      const deletedTargets = await tx.targetProcess.deleteMany({
        where: { createdById: curlUser.id },
      });
      console.log(`   ✅ Deleted ${deletedTargets.count} target processes`);

      // Delete processes created by this user (this will cascade to steps, connections, etc.)
      const deletedProcesses = await tx.process.deleteMany({
        where: { createdById: curlUser.id },
      });
      console.log(`   ✅ Deleted ${deletedProcesses.count} processes (with cascading steps/connections)`);

      // Finally, delete the user
      await tx.user.delete({
        where: { id: curlUser.id },
      });
      console.log(`   ✅ Deleted user: ${curlUser.email}`);
    });

    console.log('\n✅ Successfully deleted curl master user with all dependencies!\n');

    // Verify deletion
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'curl@test.com' },
    });

    if (verifyUser) {
      console.error('❌ User still exists!');
      process.exit(1);
    }

    console.log('✅ Verified: User no longer exists in database\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteCurl();
