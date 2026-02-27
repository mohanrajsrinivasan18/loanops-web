import { PrismaClient } from '../lib/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Create connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'loanops_db',
  user: 'postgres',
  password: 'Route@995272',
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting comprehensive database seed...');
  console.log('📦 This includes all data for production');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.collection.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.line.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Tenant
  console.log('🏢 Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant_001',
      name: 'Demo Business',
      code: 'DEMO',
      status: 'active',
      plan: 'professional',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create Tenant Settings
  console.log('⚙️  Creating tenant settings...');
  await prisma.tenantSettings.create({
    data: {
      id: `settings_${Date.now()}`,
      tenantId: tenant.id,
      brandName: 'Demo Business',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      defaultInterestRate: 12,
      defaultTenure: 12,
      minLoanAmount: 5000,
      maxLoanAmount: 500000,
      reminderDaysBefore: 3,
      overdueGraceDays: 3,
      smsEnabled: true,
      emailEnabled: true,
      whatsappEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create Users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const hashedAgentPassword = await bcrypt.hash('3210', 10);

  const adminUser = await prisma.user.create({
    data: {
      id: `user_${Date.now()}_1`,
      email: 'admin@loanops.com',
      name: 'Admin User',
      phone: '9999999999',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create Agents with Users
  console.log('👥 Creating agents...');
  
  const agent1User = await prisma.user.create({
    data: {
      id: `user_${Date.now()}_2`,
      email: 'rajesh.agent@loan.com',
      name: 'Rajesh Kumar',
      phone: '9876500001',
      password: hashedAgentPassword,
      role: 'agent',
      status: 'active',
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const agent1 = await prisma.agent.create({
    data: {
      id: `agent_${Date.now()}_1`,
      name: 'Rajesh Kumar',
      phone: '9876500001',
      email: 'rajesh.agent@loan.com',
      area: 'T Nagar & Adyar',
      status: 'active',
      targetCollection: 150000,
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Link user to agent
  await prisma.user.update({
    where: { id: agent1User.id },
    data: { agentId: agent1.id },
  });

  const agent2User = await prisma.user.create({
    data: {
      id: `user_${Date.now()}_3`,
      email: 'priya.agent@loan.com',
      name: 'Priya Sharma',
      phone: '9876500002',
      password: hashedAgentPassword,
      role: 'agent',
      status: 'active',
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const agent2 = await prisma.agent.create({
    data: {
      id: `agent_${Date.now()}_2`,
      name: 'Priya Sharma',
      phone: '9876500002',
      email: 'priya.agent@loan.com',
      area: 'Velachery & Anna Nagar',
      status: 'active',
      targetCollection: 120000,
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: agent2User.id },
    data: { agentId: agent2.id },
  });

  const agent3User = await prisma.user.create({
    data: {
      id: `user_${Date.now()}_4`,
      email: 'vijay.agent@loan.com',
      name: 'Vijay Anand',
      phone: '9876500003',
      password: hashedAgentPassword,
      role: 'agent',
      status: 'inactive',
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const agent3 = await prisma.agent.create({
    data: {
      id: `agent_${Date.now()}_3`,
      name: 'Vijay Anand',
      phone: '9876500003',
      email: 'vijay.agent@loan.com',
      area: 'Mylapore & Triplicane',
      status: 'inactive',
      targetCollection: 110000,
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: agent3User.id },
    data: { agentId: agent3.id },
  });

  // Create Lines
  console.log('📍 Creating lines...');
  const line1 = await prisma.line.create({
    data: {
      id: `line_${Date.now()}_1`,
      name: 'T Nagar Line',
      area: 'T Nagar',
      type: 'daily',
      interestRate: 2.5,
      agentId: agent1.id,
      tenantId: tenant.id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const line2 = await prisma.line.create({
    data: {
      id: `line_${Date.now()}_2`,
      name: 'Adyar Line',
      area: 'Adyar',
      type: 'weekly',
      interestRate: 10,
      agentId: agent1.id,
      tenantId: tenant.id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const line3 = await prisma.line.create({
    data: {
      id: `line_${Date.now()}_3`,
      name: 'Velachery Line',
      area: 'Velachery',
      type: 'monthly',
      interestRate: 20,
      agentId: agent2.id,
      tenantId: tenant.id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create Customers (from mock data)
  console.log('👨‍👩‍👧‍👦 Creating customers...');
  
  const customer1 = await prisma.customer.create({
    data: {
      id: `customer_${Date.now()}_1`,
      name: 'Ravi Kumar',
      phone: '9876543210',
      email: 'ravi@example.com',
      address: 'T Nagar, Chennai',
      area: 'T Nagar',
      aadhaar: '1234-5678-9012',
      pan: 'ABCDE1234F',
      lat: 13.0827,
      lng: 80.2707,
      status: 'active',
      agentId: agent1.id,
      lineId: line1.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      id: `customer_${Date.now()}_2`,
      name: 'Suresh Babu',
      phone: '9876543211',
      email: 'suresh@example.com',
      address: 'Adyar, Chennai',
      area: 'Adyar',
      aadhaar: '2345-6789-0123',
      pan: 'BCDEF2345G',
      lat: 13.0067,
      lng: 80.2571,
      status: 'active',
      agentId: agent1.id,
      lineId: line2.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date(),
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      id: `customer_${Date.now()}_3`,
      name: 'Mani Ratnam',
      phone: '9876543212',
      email: 'mani@example.com',
      address: 'Velachery, Chennai',
      area: 'Velachery',
      aadhaar: '3456-7890-1234',
      pan: 'CDEFG3456H',
      lat: 12.9750,
      lng: 80.2200,
      status: 'active',
      agentId: agent2.id,
      lineId: line3.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      id: `customer_${Date.now()}_4`,
      name: 'Lakshmi Devi',
      phone: '9876543213',
      email: 'lakshmi@example.com',
      address: 'Anna Nagar, Chennai',
      area: 'Anna Nagar',
      aadhaar: '4567-8901-2345',
      pan: 'DEFGH4567I',
      lat: 13.0850,
      lng: 80.2101,
      status: 'active',
      agentId: agent2.id,
      lineId: line3.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date(),
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      id: `customer_${Date.now()}_5`,
      name: 'Vikram Singh',
      phone: '9876543214',
      email: 'vikram@example.com',
      address: 'Mylapore, Chennai',
      area: 'Mylapore',
      aadhaar: '5678-9012-3456',
      pan: 'EFGHI5678J',
      lat: 13.0339,
      lng: 80.2619,
      status: 'active',
      agentId: agent1.id,
      lineId: line1.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date(),
    },
  });

  // Create Loans
  console.log('💰 Creating loans...');
  
  const loan1 = await prisma.loan.create({
    data: {
      id: `loan_${Date.now()}_1`,
      customerId: customer1.id,
      amount: 50000,
      interestRate: 12,
      tenure: 12,
      emi: 5500,
      outstanding: 35000,
      loanType: 'daily',
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-01-15'),
      agentId: agent1.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
    },
  });

  const loan2 = await prisma.loan.create({
    data: {
      id: `loan_${Date.now()}_2`,
      customerId: customer2.id,
      amount: 40000,
      interestRate: 12,
      tenure: 12,
      emi: 4200,
      outstanding: 28000,
      loanType: 'daily',
      status: 'active',
      startDate: new Date('2024-01-20'),
      endDate: new Date('2025-01-20'),
      agentId: agent1.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date(),
    },
  });

  const loan3 = await prisma.loan.create({
    data: {
      id: `loan_${Date.now()}_3`,
      customerId: customer3.id,
      amount: 35000,
      interestRate: 12,
      tenure: 12,
      emi: 3800,
      outstanding: 22000,
      loanType: 'weekly',
      status: 'active',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-02-01'),
      agentId: agent2.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
    },
  });

  const loan4 = await prisma.loan.create({
    data: {
      id: `loan_${Date.now()}_4`,
      customerId: customer4.id,
      amount: 60000,
      interestRate: 12,
      tenure: 12,
      emi: 6200,
      outstanding: 45000,
      loanType: 'daily',
      status: 'active',
      startDate: new Date('2024-02-10'),
      endDate: new Date('2025-02-10'),
      agentId: agent2.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date(),
    },
  });

  const loan5 = await prisma.loan.create({
    data: {
      id: `loan_${Date.now()}_5`,
      customerId: customer5.id,
      amount: 80000,
      interestRate: 12,
      tenure: 12,
      emi: 8500,
      outstanding: 70000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2025-02-15'),
      agentId: agent1.id,
      tenantId: tenant.id,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date(),
    },
  });

  // Create Collections for TODAY
  console.log('📋 Creating collections...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  console.log('Creating collections for date:', todayStr);

  await prisma.collection.create({
    data: {
      id: `collection_${Date.now()}_1`,
      loanId: loan1.id,
      customerId: customer1.id,
      amount: 5500,
      method: 'cash',
      status: 'pending',
      dueDate: today,
      agentId: agent1.id,
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.collection.create({
    data: {
      id: `collection_${Date.now()}_2`,
      loanId: loan2.id,
      customerId: customer2.id,
      amount: 4200,
      method: 'cash',
      status: 'pending',
      dueDate: today,
      agentId: agent1.id,
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.collection.create({
    data: {
      id: `collection_${Date.now()}_3`,
      loanId: loan3.id,
      customerId: customer3.id,
      amount: 3800,
      method: 'cash',
      status: 'pending',
      dueDate: today,
      agentId: agent2.id,
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.collection.create({
    data: {
      id: `collection_${Date.now()}_4`,
      loanId: loan4.id,
      customerId: customer4.id,
      amount: 6200,
      method: 'cash',
      status: 'pending',
      dueDate: today,
      agentId: agent2.id,
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - 1 Tenant: ${tenant.name}`);
  console.log(`  - 4 Users (1 admin, 3 agents)`);
  console.log(`  - 3 Agents (2 active, 1 inactive)`);
  console.log(`  - 3 Lines`);
  console.log(`  - 5 Customers`);
  console.log(`  - 5 Loans`);
  console.log(`  - 4 Collections for ${todayStr}`);
  console.log('\n🔑 Login Credentials:');
  console.log(`  Admin: admin@loanops.com / admin123`);
  console.log(`  Agent 1 (${agent1.name}): Phone ${agent1.phone} / Password 3210`);
  console.log(`  Agent 1 has agentId: ${agent1.id}`);
  console.log(`  Agent 2 (${agent2.name}): Phone ${agent2.phone} / Password 3210`);
  console.log(`  Agent 2 has agentId: ${agent2.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
