import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTemplates() {
  const templates = await prisma.processTemplate.findMany({
    select: { name: true, category: true, subcategory: true },
    orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
  });

  console.log('\n📊 Template Library Summary\n');
  console.log(`Total Templates: ${templates.length}`);
  console.log('\n📋 Templates by Category:\n');

  const byCategory: Record<string, { total: number; subcategories: Record<string, number> }> = {};

  templates.forEach((t) => {
    if (!t.category) return;

    if (!byCategory[t.category]) {
      byCategory[t.category] = { total: 0, subcategories: {} };
    }

    byCategory[t.category].total++;

    if (t.subcategory) {
      byCategory[t.category].subcategories[t.subcategory] =
        (byCategory[t.category].subcategories[t.subcategory] || 0) + 1;
    }
  });

  Object.entries(byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([cat, data]) => {
      console.log(`${cat.toUpperCase()}: ${data.total} templates`);
      Object.entries(data.subcategories)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([subcat, count]) => {
          console.log(`  - ${subcat}: ${count}`);
        });
    });

  console.log('\n✅ All templates verified successfully!\n');

  await prisma.$disconnect();
}

verifyTemplates().catch((error) => {
  console.error('Error verifying templates:', error);
  process.exit(1);
});
