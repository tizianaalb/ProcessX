import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const allTemplates = await prisma.processTemplate.findMany({
    select: { name: true, category: true, subcategory: true }
  });

  console.log('Total templates:', allTemplates.length);
  console.log('\nTemplates by category:');

  const byCategory: Record<string, number> = {};
  allTemplates.forEach((t) => {
    if (!t.category) {
      console.log('Found template without category:', t.name);
      return;
    }
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  });

  Object.entries(byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  const totalByCat = Object.values(byCategory).reduce((sum, count) => sum + count, 0);
  console.log('\nTotal by category sum:', totalByCat);

  // Check which categories are in our config
  const configCategories = [
    'underwriting',
    'claims',
    'reinsurance',
    'customer_service',
    'financial',
    'compliance',
    'marketing',
    'it_data',
    'hr'
  ];

  console.log('\nCategories NOT in config:');
  for (const cat of Object.keys(byCategory)) {
    if (!configCategories.includes(cat)) {
      console.log(`  - ${cat}`);
      const templates = await prisma.processTemplate.findMany({
        where: { category: cat },
        select: { name: true, subcategory: true }
      });
      templates.forEach(t => {
        console.log(`    * ${t.name} (subcategory: ${t.subcategory || 'none'})`);
      });
    }
  }

  await prisma.$disconnect();
}

check().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
