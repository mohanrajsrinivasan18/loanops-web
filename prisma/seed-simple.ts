import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting simple database seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.collection.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Tenant
  console.log('Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant_001',
      name: 'Demo Business',
      code: 'DEMO',
      plan: 'professional',
      updatedAt: new Date(),
    }
  });

  // Create Tenant Settings
  await prisma.tenantSettings.create({
    data: {
      id: 'settings_001',
      tenantId: tenant.id,
      brandName: 'LoanOps Demo',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      defaultInterestRate: 12,
      defaultTenure: 12,
      minLoanAmount: 5000,
      maxLoanAmount: 500000,
      updatedAt: new Date(),
    }
  });

  // Create Admin User
  console.log('Creating admin user...');
  await prisma.user.create({
    data: {
      id: 'user_admin_001',
      email: 'admin@loanops.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      status: 'active',
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  // Create Agents
  console.log('Creating agents...');
  const agent1 = await prisma.agent.create({
    data: {
      id: 'agent_001',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.agent@example.com',
      area: 'T Nagar',
      targetCollection: 500000,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  const agent2 = await prisma.agent.create({
    data: {
      id: 'agent_002',
      name: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya.agent@example.com',
      area: 'Mylapore',
      targetCollection: 450000,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  // Create Agent Users
  await prisma.user.create({
    data: {
      id: 'user_agent_001',
      email: 'rajesh.agent@example.com',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      password: await bcrypt.hash('3210', 10),
      role: 'agent',
      status: 'active',
      tenantId: tenant.id,
      agentId: agent1.id,
      updatedAt: new Date(),
    }
  });

  await prisma.user.create({
    data: {
      id: 'user_agent_002',
      email: 'priya.agent@example.com',
      name: 'Priya Sharma',
      phone: '9876543211',
      password: await bcrypt.hash('3211', 10),
      role: 'agent',
      status: 'active',
      tenantId: tenant.id,
      agentId: agent2.id,
      updatedAt: new Date(),
    }
  });

  // Create Customers
  console.log('Creating customers...');
  const customer1 = await prisma.customer.create({
    data: {
      id: 'customer_001',
      name: 'John Doe',
      phone: '9999999991',
      address: '123 Main Street, T Nagar',
      area: 'T Nagar',
      status: 'active',
      agentId: agent1.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      id: 'customer_002',
      name: 'Jane Smith',
      phone: '9999999992',
      address: '456 Park Avenue, T Nagar',
      area: 'T Nagar',
      status: 'active',
      agentId: agent1.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      id: 'customer_003',
      name: 'Bob Johnson',
      phone: '9999999993',
      address: '789 Lake Road, Mylapore',
      area: 'Mylapore',
      status: 'active',
      agentId: agent2.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  // Create Loans
  console.log('Creating loans...');
  const loan1 = await prisma.loan.create({
    data: {
      id: 'loan_001',
      customerId: customer1.id,
      amount: 50000,
      interestRate: 12,
      tenure: 12,
      emi: 5000,
      outstanding: 35000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-01-01'),
      agentId: agent1.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  const loan2 = await prisma.loan.create({
    data: {
      id: 'loan_002',
      customerId: customer2.id,
      amount: 30000,
      interestRate: 12,
      tenure: 12,
      emi: 3000,
      outstanding: 20000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-01-15'),
      agentId: agent1.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  const loan3 = await prisma.loan.create({
    data: {
      id: 'loan_003',
      customerId: customer3.id,
      amount: 40000,
      interestRate: 12,
      tenure: 12,
      emi: 4000,
      outstanding: 28000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-02-01'),
      agentId: agent2.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  // Create Collections
  console.log('Creating collections...');
  const today = new Date();
  
  await prisma.collection.create({
    data: {
      id: 'collection_001',
      loanId: loan1.id,
      customerId: customer1.id,
      amount: 5000,
      method: 'cash',
      status: 'pending',
      dueDate: today,
      agentId: agent1.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  await prisma.collection.create({
    data: {
      id: 'collection_002',
      loanId: loan2.id,
      customerId: customer2.id,
      amount: 3000,
      method: 'upi',
      status: 'collected',
      dueDate: today,
      collectedDate: today,
      collectedAmount: 3000,
      agentId: agent1.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  await prisma.collection.create({
    data: {
      id: 'collection_003',
      loanId: loan3.id,
      customerId: customer3.id,
      amount: 4000,
      method: 'cash',
      status: 'pending',
      dueDate: today,
      agentId: agent2.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    }
  });

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Tenant: 1 (Demo Business)`);
  console.log(`- Users: 3 (1 Admin, 2 Agents)`);
  console.log(`- Agents: 2`);
  console.log(`- Customers: 3`);
  console.log(`- Loans: 3`);
  console.log(`- Collections: 3`);
  
  console.log('\n🔐 Login Credentials:');
  console.log('\n👑 Admin:');
  console.log('   Email: admin@loanops.com');
  console.log('   Password: admin123');
  
  console.log('\n🚴 Agents:');
  console.log('   Phone: 9876543210 / Password: 3210 (Rajesh Kumar)');
  console.log('   Phone: 9876543211 / Password: 3211 (Priya Sharma)');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
