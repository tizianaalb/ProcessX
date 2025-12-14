import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function backupTemplates() {
  try {
    console.log('📦 Backing up templates from Railway database...\n');

    const templates = await prisma.processTemplate.findMany({
      include: {
        organization: true,
      },
    });

    const backup = {
      backupDate: new Date().toISOString(),
      totalTemplates: templates.length,
      templates,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backups/templates-backup-${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup created: ${filename}`);
    console.log(`📊 Total templates backed up: ${templates.length}\n`);

  } catch (error) {
    console.error('❌ Error creating backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupTemplates();
