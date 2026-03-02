import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma';

// Use direct connection for seeding (not pooled)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedPlans() {
  console.log('🌱 Seeding subscription plans...\n');

  const plans = [
    {
      name: 'Free Trial',
      description: '14-day free trial with basic features to get started',
      price: 0,
      billingCycle: 'monthly',
      sortOrder: 1,
      features: {
        sms: false,
        whatsapp: false,
        mapAnalytics: false,
        advancedReports: false,
        customBranding: false,
        apiAccess: false,
        prioritySupport: false,
        mobileApp: true,
        webDashboard: true,
        basicReports: true,
      },
      limits: {
        maxUsers: 1,
        maxCustomers: 50,
        maxLoansPerMonth: 100,
        storageLimit: 512, // MB
        apiCallsPerDay: 1000,
        smsCredits: 0,
        whatsappCredits: 0,
      },
    },
    {
      name: 'Starter',
      description: 'Perfect for small businesses and solo entrepreneurs',
      price: 999,
      billingCycle: 'monthly',
      sortOrder: 2,
      features: {
        sms: true,
        whatsapp: false,
        mapAnalytics: false,
        advancedReports: true,
        customBranding: false,
        apiAccess: false,
        prioritySupport: false,
        mobileApp: true,
        webDashboard: true,
        basicReports: true,
        exportData: true,
      },
      limits: {
        maxUsers: 3,
        maxCustomers: 500,
        maxLoansPerMonth: 1000,
        storageLimit: 2048, // 2GB
        apiCallsPerDay: 5000,
        smsCredits: 500,
        whatsappCredits: 0,
      },
    },
    {
      name: 'Professional',
      description: 'For growing businesses with advanced needs',
      price: 2999,
      billingCycle: 'monthly',
      sortOrder: 3,
      features: {
        sms: true,
        whatsapp: true,
        mapAnalytics: true,
        advancedReports: true,
        customBranding: true,
        apiAccess: true,
        prioritySupport: false,
        mobileApp: true,
        webDashboard: true,
        basicReports: true,
        exportData: true,
        bulkOperations: true,
        automatedReminders: true,
      },
      limits: {
        maxUsers: 10,
        maxCustomers: 2000,
        maxLoansPerMonth: 5000,
        storageLimit: 10240, // 10GB
        apiCallsPerDay: 20000,
        smsCredits: 2000,
        whatsappCredits: 1000,
      },
    },
    {
      name: 'Enterprise',
      description: 'Unlimited everything with dedicated support',
      price: 9999,
      billingCycle: 'monthly',
      sortOrder: 4,
      features: {
        sms: true,
        whatsapp: true,
        mapAnalytics: true,
        advancedReports: true,
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
        mobileApp: true,
        webDashboard: true,
        basicReports: true,
        exportData: true,
        bulkOperations: true,
        automatedReminders: true,
        dedicatedSupport: true,
        customIntegrations: true,
        whiteLabel: true,
      },
      limits: {
        maxUsers: -1, // unlimited
        maxCustomers: -1,
        maxLoansPerMonth: -1,
        storageLimit: -1,
        apiCallsPerDay: -1,
        smsCredits: -1,
        whatsappCredits: -1,
      },
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
    });

    if (existing) {
      console.log(`⏭️  Plan "${plan.name}" already exists, skipping...`);
      continue;
    }

    await prisma.subscriptionPlan.create({ data: plan });
    console.log(`✅ Created plan: ${plan.name} (₹${plan.price}/month)`);
  }

  console.log('\n✨ Plans seeded successfully!');
  console.log('\nAvailable Plans:');
  console.log('1. Free Trial - ₹0/month (14-day trial)');
  console.log('2. Starter - ₹999/month');
  console.log('3. Professional - ₹2,999/month');
  console.log('4. Enterprise - ₹9,999/month\n');
}

seedPlans()
  .catch((error) => {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
