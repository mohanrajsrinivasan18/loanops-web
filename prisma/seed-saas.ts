import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ No DATABASE_URL or DIRECT_URL found in environment');
  process.exit(1);
}
console.log('🔗 Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedSaaS() {
  console.log('🌱 Seeding complete SaaS data...\n');

  // ── 1. Subscription Plans ──
  console.log('📋 Step 1: Subscription Plans');
  const plans = [
    {
      name: 'Free Trial',
      description: '14-day free trial with basic features',
      price: 0,
      billingCycle: 'monthly',
      sortOrder: 1,
      features: { sms: false, whatsapp: false, mapAnalytics: false, advancedReports: false, customBranding: false, apiAccess: false, prioritySupport: false },
      limits: { maxUsers: 1, maxCustomers: 50, maxLoansPerMonth: 100, storageLimit: 512, apiCallsPerDay: 1000, smsCredits: 0, whatsappCredits: 0 },
    },
    {
      name: 'Starter',
      description: 'Perfect for small businesses',
      price: 999,
      billingCycle: 'monthly',
      sortOrder: 2,
      features: { sms: true, whatsapp: false, mapAnalytics: false, advancedReports: true, customBranding: false, apiAccess: false, prioritySupport: false },
      limits: { maxUsers: 3, maxCustomers: 500, maxLoansPerMonth: 1000, storageLimit: 2048, apiCallsPerDay: 5000, smsCredits: 500, whatsappCredits: 0 },
    },
    {
      name: 'Professional',
      description: 'For growing businesses',
      price: 2999,
      billingCycle: 'monthly',
      sortOrder: 3,
      features: { sms: true, whatsapp: true, mapAnalytics: true, advancedReports: true, customBranding: true, apiAccess: true, prioritySupport: false },
      limits: { maxUsers: 10, maxCustomers: 2000, maxLoansPerMonth: 5000, storageLimit: 10240, apiCallsPerDay: 20000, smsCredits: 2000, whatsappCredits: 1000 },
    },
    {
      name: 'Enterprise',
      description: 'Unlimited everything',
      price: 9999,
      billingCycle: 'monthly',
      sortOrder: 4,
      features: { sms: true, whatsapp: true, mapAnalytics: true, advancedReports: true, customBranding: true, apiAccess: true, prioritySupport: true },
      limits: { maxUsers: -1, maxCustomers: -1, maxLoansPerMonth: -1, storageLimit: -1, apiCallsPerDay: -1, smsCredits: -1, whatsappCredits: -1 },
    },
  ];

  const createdPlans: any[] = [];
  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } });
    if (existing) {
      console.log(`  ⏭️  "${plan.name}" exists`);
      createdPlans.push(existing);
    } else {
      const created = await prisma.subscriptionPlan.create({ data: plan });
      console.log(`  ✅ Created "${plan.name}" (₹${plan.price}/mo)`);
      createdPlans.push(created);
    }
  }

  const starterPlan = createdPlans.find(p => p.name === 'Starter');

  // ── 2. Super Admin User ──
  console.log('\n👤 Step 2: Super Admin User');
  let superAdmin = await prisma.user.findFirst({ where: { phone: '9999999999' } });

  if (superAdmin) {
    if (superAdmin.role !== 'super_admin') {
      await prisma.user.update({ where: { id: superAdmin.id }, data: { role: 'super_admin' } });
      console.log(`  ✅ Updated ${superAdmin.name} to super_admin`);
    } else {
      console.log(`  ⏭️  Super admin already exists: ${superAdmin.name}`);
    }
  } else {
    const hashedPassword = await bcrypt.hash('super123', 10);
    superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@loanops.com',
        phone: '9999999999',
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
      },
    });
    console.log(`  ✅ Created super admin user (phone: 9999999999, password: super123)`);
  }

  // ── 3. Assign Subscriptions to Tenants ──
  console.log('\n📦 Step 3: Tenant Subscriptions');
  const tenants = await prisma.tenant.findMany();
  console.log(`  Found ${tenants.length} tenants`);

  for (const tenant of tenants) {
    const existingSub = await prisma.tenantSubscription.findFirst({
      where: { tenantId: tenant.id, status: 'active' },
    });

    if (existingSub) {
      console.log(`  ⏭️  ${tenant.name} already has active subscription`);
      continue;
    }

    if (starterPlan) {
      await prisma.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: 'active',
          startDate: new Date(),
          autoRenew: true,
        },
      });
      console.log(`  ✅ Assigned Starter plan to ${tenant.name}`);
    }
  }

  // ── 4. Create Limits for Tenants ──
  console.log('\n📊 Step 4: Tenant Limits');
  for (const tenant of tenants) {
    const existingLimit = await prisma.tenantLimit.findUnique({ where: { tenantId: tenant.id } });
    if (existingLimit) {
      console.log(`  ⏭️  ${tenant.name} already has limits`);
      continue;
    }

    await prisma.tenantLimit.create({
      data: {
        tenantId: tenant.id,
        maxUsers: 3,
        maxCustomers: 500,
        maxLoansPerMonth: 1000,
        storageLimit: 2048,
        apiCallsPerDay: 5000,
        smsCredits: 500,
        whatsappCredits: 0,
      },
    });
    console.log(`  ✅ Created limits for ${tenant.name}`);
  }

  // ── 5. Enable Features for Tenants ──
  console.log('\n🔧 Step 5: Tenant Features');
  const featureNames = ['sms', 'whatsapp', 'mapAnalytics', 'advancedReports', 'customBranding', 'apiAccess', 'prioritySupport'];
  const starterFeatures: Record<string, boolean> = { sms: true, whatsapp: false, mapAnalytics: false, advancedReports: true, customBranding: false, apiAccess: false, prioritySupport: false };

  for (const tenant of tenants) {
    for (const featureName of featureNames) {
      const existing = await prisma.tenantFeature.findUnique({
        where: { tenantId_featureName: { tenantId: tenant.id, featureName } },
      });

      if (existing) continue;

      await prisma.tenantFeature.create({
        data: {
          tenantId: tenant.id,
          featureName,
          enabled: starterFeatures[featureName] || false,
        },
      });
    }
    console.log(`  ✅ Features set for ${tenant.name}`);
  }

  // ── 6. Create Invoices ──
  console.log('\n💰 Step 6: Invoices');
  let invoiceCounter = 1;
  for (const tenant of tenants) {
    const existingInvoice = await prisma.invoice.findFirst({ where: { tenantId: tenant.id } });
    if (existingInvoice) {
      console.log(`  ⏭️  ${tenant.name} already has invoices`);
      continue;
    }

    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId: tenant.id, status: 'active' },
    });

    if (!sub) continue;

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(invoiceCounter++).padStart(4, '0')}`;

    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        subscriptionId: sub.id,
        invoiceNumber,
        amount: 999,
        tax: 179.82,
        totalAmount: 1178.82,
        status: 'paid',
        dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        paidDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        paymentMethod: 'razorpay',
      },
    });
    console.log(`  ✅ Created invoice ${invoiceNumber} for ${tenant.name}`);
  }

  // ── Summary ──
  console.log('\n' + '='.repeat(50));
  console.log('✨ SaaS seed complete!\n');

  const planCount = await prisma.subscriptionPlan.count();
  const subCount = await prisma.tenantSubscription.count({ where: { status: 'active' } });
  const limitCount = await prisma.tenantLimit.count();
  const featureCount = await prisma.tenantFeature.count();
  const invoiceCount = await prisma.invoice.count();
  const saUser = await prisma.user.findFirst({ where: { role: 'super_admin' } });

  console.log(`  Plans:         ${planCount}`);
  console.log(`  Subscriptions: ${subCount}`);
  console.log(`  Limits:        ${limitCount}`);
  console.log(`  Features:      ${featureCount}`);
  console.log(`  Invoices:      ${invoiceCount}`);
  console.log(`  Super Admin:   ${saUser?.name} (${saUser?.phone})`);
  console.log('\n🚀 Login with phone 9999999999 or email superadmin@loanops.com / super123');
}

seedSaaS()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
