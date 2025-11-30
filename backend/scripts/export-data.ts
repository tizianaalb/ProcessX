/**
 * Export all data from local PostgreSQL database to JSON file
 * Usage: tsx scripts/export-data.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('📦 Exporting data from local database...\n');

    // Export all tables in order (respecting foreign key constraints)
    const data = {
      organizations: await prisma.organization.findMany(),
      users: await prisma.user.findMany(),
      apiConfigurations: await prisma.aPIConfiguration.findMany(),
      processes: await prisma.process.findMany(),
      processSteps: await prisma.processStep.findMany(),
      processConnections: await prisma.processConnection.findMany(),
      painPoints: await prisma.painPoint.findMany(),
      recommendations: await prisma.recommendation.findMany(),
      aiAnalyses: await prisma.aIAnalysis.findMany(),
      targetProcesses: await prisma.targetProcess.findMany(),
      processTemplates: await prisma.processTemplate.findMany(),
      exports: await prisma.export.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
    };

    // Print counts
    console.log('📊 Data counts:');
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
    console.log(`   Exports: ${data.exports.length}`);
    console.log(`   Audit Logs: ${data.auditLogs.length}\n`);

    // Save to file
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `data-export-${timestamp}.json`;
    const filepath = path.join(exportDir, filename);

    // Convert BigInt to string for JSON serialization
    const jsonData = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2);

    fs.writeFileSync(filepath, jsonData);

    console.log(`✅ Data exported successfully to: ${filepath}`);
    console.log(`📦 File size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB\n`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
