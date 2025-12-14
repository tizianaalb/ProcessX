import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function examinePositions() {
  const templates = await prisma.processTemplate.findMany({
    select: { name: true, templateData: true },
    take: 3, // Just examine a few templates
  });

  console.log('\n📐 Template Position Analysis\n');

  for (const template of templates) {
    const templateData = template.templateData as any;
    console.log(`\n${template.name}:`);
    console.log(`  Total steps: ${templateData.steps.length}`);

    // Analyze position spread
    const xPositions = templateData.steps.map((s: any) => s.position?.x || s.positionX || 0);
    const yPositions = templateData.steps.map((s: any) => s.position?.y || s.positionY || 0);

    const xRange = Math.max(...xPositions) - Math.min(...xPositions);
    const yRange = Math.max(...yPositions) - Math.min(...yPositions);

    console.log(`  X range: ${Math.min(...xPositions)} to ${Math.max(...xPositions)} (spread: ${xRange})`);
    console.log(`  Y range: ${Math.min(...yPositions)} to ${Math.max(...yPositions)} (spread: ${yRange})`);
    console.log(`  Layout orientation: ${xRange > yRange ? 'HORIZONTAL' : 'VERTICAL'}`);

    // Show first 5 step positions
    console.log('  First 5 steps:');
    templateData.steps.slice(0, 5).forEach((step: any, i: number) => {
      const x = step.position?.x || step.positionX || 0;
      const y = step.position?.y || step.positionY || 0;
      console.log(`    ${i + 1}. ${step.name}: (x: ${x}, y: ${y})`);
    });
  }

  await prisma.$disconnect();
}

examinePositions().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
