import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    console.log('🔐 Checking passwords in Railway database...\n');

    // Get tiziana's hash
    const tiziana = await prisma.user.findUnique({
      where: { email: 'tiziana@ballester.de' },
      select: {
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    if (tiziana) {
      console.log('✅ Tiziana found:');
      console.log(`   Email: ${tiziana.email}`);
      console.log(`   Role: ${tiziana.role}`);
      console.log(`   Hash: ${tiziana.passwordHash.substring(0, 30)}...`);
      
      // Test common passwords
      const testPasswords = [
        'TestPassword123!',
        'Password123!',
        'test123',
        'tiziana123',
      ];
      
      console.log('\n🧪 Testing passwords:');
      for (const pwd of testPasswords) {
        const isValid = await bcrypt.compare(pwd, tiziana.passwordHash);
        console.log(`   ${pwd}: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
      }
    }

    // Check test@test.com
    console.log('\n');
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@test.com' },
      select: {
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    if (testUser) {
      console.log('✅ test@test.com found:');
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Hash: ${testUser.passwordHash.substring(0, 30)}...`);
      
      const testPasswords = [
        'Password123!',
        'test123',
        'password',
      ];
      
      console.log('\n🧪 Testing passwords:');
      for (const pwd of testPasswords) {
        const isValid = await bcrypt.compare(pwd, testUser.passwordHash);
        console.log(`   ${pwd}: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();
