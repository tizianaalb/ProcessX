/**
 * Import data from JSON file to PostgreSQL database
 * Usage: DATABASE_URL="postgresql://..." tsx scripts/import-data.ts <export-file.json>
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData(filepath: string) {
  try {
    console.log('📥 Importing data to database...\n');

    // Read the export file
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log('📊 Data to import:');
    console.log(`   Organizations: ${data.organizations.length}`);
    console.log(`   Users: ${data.users.length}`);
    console.log(`   API Configurations: ${data.apiConfigurations.length}`);
    console.log(`   Processes: ${data.processes.length}`);
    console.log(`   Process Steps: ${data.processSteps.length}`);
    console.log(`   Process Connections: ${data.processConnections.length}`);
    console.log(`   Pain Points: ${data.painPoints.length}`);
    console.log(`   Recommendations: ${data.recommendations.length}`);
    console.log(`   AI Analyses: ${data.aiAnalyses.length}`);
    console.log(`   Target Processes: ${data.targetProcesses.length}`);
    console.log(`   Process Templates: ${data.processTemplates.length}`);
    console.log(`   Exports: ${data.exports?.length || 0}`);
    console.log(`   Audit Logs: ${data.auditLogs?.length || 0}\n`);

    // Confirm before importing
    console.log('⚠️  WARNING: This will add data to the target database.');
    console.log('   Make sure you are connected to the correct database!\n');
    console.log(`   Target DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...\n`);

    // Import data in order (respecting foreign key constraints)
    console.log('🔄 Starting import...\n');

    // 1. Organizations (no dependencies)
    if (data.organizations.length > 0) {
      console.log(`   Importing ${data.organizations.length} organizations...`);
      for (const org of data.organizations) {
        await prisma.organization.upsert({
          where: { id: org.id },
          update: {},
          create: org,
        });
      }
      console.log('   ✅ Organizations imported\n');
    }

    // 2. Users (depends on organizations)
    if (data.users.length > 0) {
      console.log(`   Importing ${data.users.length} users...`);
      for (const user of data.users) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: user,
        });
      }
      console.log('   ✅ Users imported\n');
    }

    // 3. API Configurations (depends on organizations and users)
    if (data.apiConfigurations.length > 0) {
      console.log(`   Importing ${data.apiConfigurations.length} API configurations...`);
      for (const config of data.apiConfigurations) {
        await prisma.aPIConfiguration.upsert({
          where: { id: config.id },
          update: {},
          create: config,
        });
      }
      console.log('   ✅ API Configurations imported\n');
    }

    // 4. Processes (depends on organizations and users)
    if (data.processes.length > 0) {
      console.log(`   Importing ${data.processes.length} processes...`);
      for (const process of data.processes) {
        await prisma.process.upsert({
          where: { id: process.id },
          update: {},
          create: process,
        });
      }
      console.log('   ✅ Processes imported\n');
    }

    // 5. Process Steps (depends on processes)
    if (data.processSteps.length > 0) {
      console.log(`   Importing ${data.processSteps.length} process steps...`);
      for (const step of data.processSteps) {
        await prisma.processStep.upsert({
          where: { id: step.id },
          update: {},
          create: step,
        });
      }
      console.log('   ✅ Process Steps imported\n');
    }

    // 6. Process Connections (depends on processes and steps)
    if (data.processConnections.length > 0) {
      console.log(`   Importing ${data.processConnections.length} process connections...`);
      for (const conn of data.processConnections) {
        await prisma.processConnection.upsert({
          where: { id: conn.id },
          update: {},
          create: conn,
        });
      }
      console.log('   ✅ Process Connections imported\n');
    }

    // 7. Pain Points (depends on processes and users)
    if (data.painPoints.length > 0) {
      console.log(`   Importing ${data.painPoints.length} pain points...`);
      for (const pp of data.painPoints) {
        await prisma.painPoint.upsert({
          where: { id: pp.id },
          update: {},
          create: pp,
        });
      }
      console.log('   ✅ Pain Points imported\n');
    }

    // 8. Recommendations (depends on processes, users, and pain points)
    if (data.recommendations.length > 0) {
      console.log(`   Importing ${data.recommendations.length} recommendations...`);
      for (const rec of data.recommendations) {
        await prisma.recommendation.upsert({
          where: { id: rec.id },
          update: {},
          create: rec,
        });
      }
      console.log('   ✅ Recommendations imported\n');
    }

    // 9. AI Analyses (depends on processes and users)
    if (data.aiAnalyses.length > 0) {
      console.log(`   Importing ${data.aiAnalyses.length} AI analyses...`);
      for (const analysis of data.aiAnalyses) {
        await prisma.aIAnalysis.upsert({
          where: { id: analysis.id },
          update: {},
          create: analysis,
        });
      }
      console.log('   ✅ AI Analyses imported\n');
    }

    // 10. Target Processes (depends on processes)
    if (data.targetProcesses.length > 0) {
      console.log(`   Importing ${data.targetProcesses.length} target processes...`);
      for (const target of data.targetProcesses) {
        await prisma.targetProcess.upsert({
          where: { id: target.id },
          update: {},
          create: target,
        });
      }
      console.log('   ✅ Target Processes imported\n');
    }

    // 11. Process Templates (depends on organizations)
    if (data.processTemplates.length > 0) {
      console.log(`   Importing ${data.processTemplates.length} process templates...`);
      for (const template of data.processTemplates) {
        await prisma.processTemplate.upsert({
          where: { id: template.id },
          update: {},
          create: template,
        });
      }
      console.log('   ✅ Process Templates imported\n');
    }

    // 12. Exports (depends on processes and users)
    if (data.exports && data.exports.length > 0) {
      console.log(`   Importing ${data.exports.length} exports...`);
      for (const exp of data.exports) {
        await prisma.export.upsert({
          where: { id: exp.id },
          update: {},
          create: exp,
        });
      }
      console.log('   ✅ Exports imported\n');
    }

    // 13. Audit Logs (depends on users and organizations)
    if (data.auditLogs && data.auditLogs.length > 0) {
      console.log(`   Importing ${data.auditLogs.length} audit logs...`);
      for (const log of data.auditLogs) {
        await prisma.auditLog.upsert({
          where: { id: log.id },
          update: {},
          create: log,
        });
      }
      console.log('   ✅ Audit Logs imported\n');
    }

    console.log('✅ All data imported successfully!\n');

  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get filename from command line argument
const filename = process.argv[2];
if (!filename) {
  console.error('❌ Error: Please provide the export file path');
  console.error('   Usage: DATABASE_URL="postgresql://..." tsx scripts/import-data.ts <export-file.json>');
  process.exit(1);
}

importData(filename);
