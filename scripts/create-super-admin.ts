import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function createSuperAdmin() {
  try {
    console.log('🔍 Checking for existing super admin...');

    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'super_admin' },
    });

    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Phone: ${existingSuperAdmin.phone || 'Not set'}`);
      console.log(`   Name: ${existingSuperAdmin.name}`);
      
      // Update phone if not set
      if (!existingSuperAdmin.phone) {
        console.log('\n📱 Adding phone number to super admin...');
        await prisma.user.update({
          where: { id: existingSuperAdmin.id },
          data: { phone: '9999999999' },
        });
        console.log('✅ Phone number added: 9999999999');
      }
      
      return;
    }

    console.log('📝 Creating new super admin...');

    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@loanops.com',
        phone: '9999999999',
        name: 'Super Admin',
        password: await bcrypt.hash('super123', 10),
        role: 'super_admin',
        status: 'active',
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: superadmin@loanops.com');
    console.log('   Phone: 9999999999');
    console.log('   Password: super123');
    console.log('\n💡 You can login using either:');
    console.log('   1. Email/Password login');
    console.log('   2. Phone OTP login (use phone: 9999999999)');
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
}

createSuperAdmin()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
