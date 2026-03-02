import prisma from '../lib/prisma';

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking for super admin...\n');

    const superAdmins = await prisma.user.findMany({
      where: { role: 'super_admin' },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (superAdmins.length === 0) {
      console.log('❌ No super admin found!');
      console.log('\nRun: npm run db:reset');
      return;
    }

    console.log(`✅ Found ${superAdmins.length} super admin(s):\n`);
    
    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Phone: ${admin.phone || '❌ NOT SET'}`);
      console.log(`   Status: ${admin.status}`);
      console.log(`   Created: ${admin.createdAt.toISOString()}`);
      console.log('');
    });

    // Check if phone is missing
    const missingPhone = superAdmins.filter(a => !a.phone);
    if (missingPhone.length > 0) {
      console.log('⚠️  Some super admins are missing phone numbers!');
      console.log('   Run: npm run db:reset to recreate with phone numbers');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
