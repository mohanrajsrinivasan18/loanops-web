import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting comprehensive database seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.collection.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Tenants
  console.log('Creating tenants...');
  const mumbaiTenant = await prisma.tenant.create({
    data: {
      id: 'tenant_mumbai_001',
      name: 'Mumbai Branch',
      code: 'MUM',
      plan: 'professional',
      updatedAt: new Date(),
      TenantSettings: {
        create: {
          id: 'settings_mumbai_001',
          brandName: 'LoanOps Mumbai',
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          defaultInterestRate: 12,
          defaultTenure: 12,
          minLoanAmount: 5000,
          maxLoanAmount: 500000,
          updatedAt: new Date(),
        }
      }
    }
  });

  const delhiTenant = await prisma.tenant.create({
    data: {
      name: 'Delhi Branch',
      code: 'DEL',
      plan: 'professional',
    }
  });

  const bangaloreTenant = await prisma.tenant.create({
    data: {
      name: 'Bangalore Branch',
      code: 'BLR',
      plan: 'starter',
    }
  });

  const chennaiTenant = await prisma.tenant.create({
    data: {
      name: 'Chennai Branch',
      code: 'CHE',
      plan: 'professional',
    }
  });

  const kolkataTenant = await prisma.tenant.create({
    data: {
      name: 'Kolkata Branch',
      code: 'KOL',
      plan: 'starter',
    }
  });

  console.log('Tenants created successfully');

  // Create Tenant Settings for all tenants
  console.log('Creating tenant settings...');
  await prisma.tenantSettings.create({
    data: {
      tenantId: delhiTenant.id,
      brandName: 'LoanOps Delhi',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
    }
  });

  await prisma.tenantSettings.create({
    data: {
      tenantId: bangaloreTenant.id,
      brandName: 'LoanOps Bangalore',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
    }
  });

  await prisma.tenantSettings.create({
    data: {
      tenantId: chennaiTenant.id,
      brandName: 'LoanOps Chennai',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
    }
  });

  await prisma.tenantSettings.create({
    data: {
      tenantId: kolkataTenant.id,
      brandName: 'LoanOps Kolkata',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
    }
  });

  console.log('Tenant settings created successfully');

  // Create Super Admin
  console.log('Creating super admin...');
  await prisma.user.create({
    data: {
      email: 'admin@loanops.com',
      phone: '9999999999', // Super admin phone for OTP login
      name: 'Super Admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'super_admin',
      status: 'active',
    }
  });

  // Create Admin for Mumbai
  await prisma.user.create({
    data: {
      email: 'mumbai.admin@loanops.com',
      name: 'Mumbai Admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      status: 'active',
      tenantId: mumbaiTenant.id,
    }
  });

  console.log('Admins created successfully');

  // Create Agents for Mumbai (matching agents page mock data)
  console.log('Creating agents...');
  const agent1 = await prisma.agent.create({
    data: {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya@loan.com',
      area: 'MG Road',
      targetCollection: 500000,
      tenantId: mumbaiTenant.id,
    }
  });

  const agent2 = await prisma.agent.create({
    data: {
      name: 'Amit Patel',
      phone: '+91 98765 43211',
      email: 'amit@loan.com',
      area: 'Koramangala',
      targetCollection: 450000,
      tenantId: mumbaiTenant.id,
    }
  });

  const agent3 = await prisma.agent.create({
    data: {
      name: 'Rahul Verma',
      phone: '+91 98765 43212',
      email: 'rahul@loan.com',
      area: 'Indiranagar',
      targetCollection: 480000,
      tenantId: mumbaiTenant.id,
    }
  });

  const agent4 = await prisma.agent.create({
    data: {
      name: 'Neha Gupta',
      phone: '+91 98765 43213',
      email: 'neha@loan.com',
      area: 'Whitefield',
      targetCollection: 400000,
      tenantId: mumbaiTenant.id,
    }
  });

  const agent5 = await prisma.agent.create({
    data: {
      name: 'Ramesh Singh',
      phone: '+91 98765 00001',
      email: 'ramesh@loan.com',
      area: 'T Nagar & Adyar',
      targetCollection: 600000,
      tenantId: chennaiTenant.id,
    }
  });

  const agent6 = await prisma.agent.create({
    data: {
      name: 'Kavita Desai',
      phone: '+91 98765 00002',
      email: 'kavita@loan.com',
      area: 'Velachery & Anna Nagar',
      targetCollection: 500000,
      tenantId: chennaiTenant.id,
    }
  });

  const agent7 = await prisma.agent.create({
    data: {
      name: 'Suresh Rao',
      phone: '+91 98765 00003',
      email: 'suresh@loan.com',
      area: 'Mylapore & Triplicane',
      targetCollection: 650000,
      tenantId: chennaiTenant.id,
    }
  });

  // Create Agent Users
  await prisma.user.create({
    data: {
      email: 'priya@loan.com',
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      password: await bcrypt.hash('agent123', 10),
      role: 'agent',
      tenantId: mumbaiTenant.id,
      agentId: agent1.id,
    }
  });

  await prisma.user.create({
    data: {
      email: 'amit@loan.com',
      name: 'Amit Patel',
      phone: '+91 98765 43211',
      password: await bcrypt.hash('agent123', 10),
      role: 'agent',
      tenantId: mumbaiTenant.id,
      agentId: agent2.id,
    }
  });

  await prisma.user.create({
    data: {
      email: 'ramesh@loan.com',
      name: 'Ramesh Singh',
      phone: '+91 98765 00001',
      password: await bcrypt.hash('agent123', 10),
      role: 'agent',
      tenantId: chennaiTenant.id,
      agentId: agent5.id,
    }
  });

  console.log('Agents created successfully');

  // Create Customers (matching collections page mock data)
  console.log('Creating customers...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh@example.com',
      address: '123 MG Road, Near City Mall',
      aadhaar: '1234-5678-9012',
      pan: 'ABCDE1234F',
      lat: 12.9716,
      lng: 77.5946,
      status: 'active',
      agentId: agent1.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Sharma',
      phone: '+91 87654 32109',
      email: 'priya.s@example.com',
      address: '456 Brigade Road, Opposite Metro',
      aadhaar: '2345-6789-0123',
      pan: 'BCDEF2345G',
      lat: 12.9698,
      lng: 77.6025,
      status: 'active',
      agentId: agent1.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Mohammed Ali',
      phone: '+91 76543 21098',
      email: 'mohammed@example.com',
      address: '789 Commercial Street, 3rd Floor',
      aadhaar: '3456-7890-1234',
      pan: 'CDEFG3456H',
      lat: 12.9833,
      lng: 77.6089,
      status: 'active',
      agentId: agent2.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Lakshmi Devi',
      phone: '+91 65432 10987',
      email: 'lakshmi@example.com',
      address: '321 Jayanagar, Near Temple',
      aadhaar: '4567-8901-2345',
      pan: 'DEFGH4567I',
      lat: 12.9250,
      lng: 77.5838,
      status: 'risk',
      agentId: agent3.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const customer5 = await prisma.customer.create({
    data: {
      name: 'Arjun Reddy',
      phone: '+91 54321 09876',
      email: 'arjun@example.com',
      address: '654 Koramangala, Tech Park Area',
      aadhaar: '5678-9012-3456',
      pan: 'EFGHI5678J',
      lat: 12.9352,
      lng: 77.6245,
      status: 'active',
      agentId: agent2.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const customer6 = await prisma.customer.create({
    data: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43214',
      email: 'ravi@example.com',
      address: 'T Nagar, Chennai',
      aadhaar: '6789-0123-4567',
      pan: 'FGHIJ6789K',
      lat: 13.0827,
      lng: 80.2707,
      status: 'active',
      agentId: agent5.id,
      tenantId: chennaiTenant.id,
    }
  });

  const customer7 = await prisma.customer.create({
    data: {
      name: 'Suresh Babu',
      phone: '+91 98765 43215',
      email: 'suresh@example.com',
      address: 'Adyar, Chennai',
      aadhaar: '7890-1234-5678',
      pan: 'GHIJK7890L',
      lat: 13.0067,
      lng: 80.2571,
      status: 'active',
      agentId: agent5.id,
      tenantId: chennaiTenant.id,
    }
  });

  const customer8 = await prisma.customer.create({
    data: {
      name: 'Mani Ratnam',
      phone: '+91 98765 43216',
      email: 'mani@example.com',
      address: 'Velachery, Chennai',
      aadhaar: '8901-2345-6789',
      pan: 'HIJKL8901M',
      lat: 12.9750,
      lng: 80.2200,
      status: 'active',
      agentId: agent6.id,
      tenantId: chennaiTenant.id,
    }
  });

  const customer9 = await prisma.customer.create({
    data: {
      name: 'Vikram Singh',
      phone: '+91 98765 43217',
      email: 'vikram@example.com',
      address: 'Mylapore, Chennai',
      aadhaar: '9012-3456-7890',
      pan: 'IJKLM9012N',
      lat: 13.0339,
      lng: 80.2619,
      status: 'default',
      agentId: agent7.id,
      tenantId: chennaiTenant.id,
    }
  });

  const customer10 = await prisma.customer.create({
    data: {
      name: 'Anita Desai',
      phone: '+91 98765 43218',
      email: 'anita@example.com',
      address: 'Anna Nagar, Chennai',
      aadhaar: '0123-4567-8901',
      pan: 'JKLMN0123O',
      lat: 13.0850,
      lng: 80.2101,
      status: 'active',
      agentId: agent6.id,
      tenantId: chennaiTenant.id,
    }
  });

  console.log('Customers created successfully');

  // Create Loans
  console.log('Creating loans...');
  const loan1 = await prisma.loan.create({
    data: {
      customerId: customer1.id,
      amount: 50000,
      interestRate: 12,
      tenure: 12,
      emi: 5000,
      outstanding: 35000,
      loanType: 'daily',
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-01-15'),
      agentId: agent1.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const loan2 = await prisma.loan.create({
    data: {
      customerId: customer2.id,
      amount: 120000,
      interestRate: 12,
      tenure: 12,
      emi: 12000,
      outstanding: 96000,
      loanType: 'weekly',
      status: 'active',
      startDate: new Date('2024-01-20'),
      endDate: new Date('2025-01-20'),
      agentId: agent1.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const loan3 = await prisma.loan.create({
    data: {
      customerId: customer3.id,
      amount: 85000,
      interestRate: 12,
      tenure: 12,
      emi: 8500,
      outstanding: 68000,
      loanType: 'daily',
      status: 'active',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-02-01'),
      agentId: agent2.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const loan4 = await prisma.loan.create({
    data: {
      customerId: customer4.id,
      amount: 150000,
      interestRate: 12,
      tenure: 12,
      emi: 15000,
      outstanding: 120000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-02-10'),
      endDate: new Date('2025-02-10'),
      agentId: agent3.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const loan5 = await prisma.loan.create({
    data: {
      customerId: customer5.id,
      amount: 250000,
      interestRate: 12,
      tenure: 12,
      emi: 25000,
      outstanding: 200000,
      loanType: 'weekly',
      status: 'active',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2025-02-15'),
      agentId: agent2.id,
      tenantId: mumbaiTenant.id,
    }
  });

  const loan6 = await prisma.loan.create({
    data: {
      customerId: customer6.id,
      amount: 50000,
      interestRate: 12,
      tenure: 12,
      emi: 5500,
      outstanding: 35000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-01-15'),
      agentId: agent5.id,
      tenantId: chennaiTenant.id,
    }
  });

  const loan7 = await prisma.loan.create({
    data: {
      customerId: customer7.id,
      amount: 40000,
      interestRate: 12,
      tenure: 12,
      emi: 4200,
      outstanding: 28000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-01-20'),
      endDate: new Date('2025-01-20'),
      agentId: agent5.id,
      tenantId: chennaiTenant.id,
    }
  });

  const loan8 = await prisma.loan.create({
    data: {
      customerId: customer8.id,
      amount: 35000,
      interestRate: 12,
      tenure: 12,
      emi: 3800,
      outstanding: 22000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-02-01'),
      agentId: agent6.id,
      tenantId: chennaiTenant.id,
    }
  });

  const loan9 = await prisma.loan.create({
    data: {
      customerId: customer9.id,
      amount: 80000,
      interestRate: 12,
      tenure: 12,
      emi: 8500,
      outstanding: 70000,
      loanType: 'monthly',
      status: 'defaulted',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2025-02-15'),
      agentId: agent7.id,
      tenantId: chennaiTenant.id,
    }
  });

  const loan10 = await prisma.loan.create({
    data: {
      customerId: customer10.id,
      amount: 60000,
      interestRate: 12,
      tenure: 12,
      emi: 6200,
      outstanding: 45000,
      loanType: 'monthly',
      status: 'active',
      startDate: new Date('2024-02-10'),
      endDate: new Date('2025-02-10'),
      agentId: agent6.id,
      tenantId: chennaiTenant.id,
    }
  });

  console.log('Loans created successfully');

  // Create Collections
  console.log('Creating collections...');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Today's collections
  await prisma.collection.create({
    data: {
      loanId: loan1.id,
      customerId: customer1.id,
      amount: 5000,
      method: 'cash',
      status: 'pending',
      dueDate: today,
      agentId: agent1.id,
      tenantId: mumbaiTenant.id,
      notes: 'Prefers evening visits',
    }
  });

  await prisma.collection.create({
    data: {
      loanId: loan2.id,
      customerId: customer2.id,
      amount: 12000,
      method: 'upi',
      status: 'collected',
      dueDate: today,
      collectedDate: today,
      collectedAmount: 12000,
      agentId: agent1.id,
      tenantId: mumbaiTenant.id,
    }
  });

  await prisma.collection.create({
    data: {
      loanId: loan3.id,
      customerId: customer3.id,
      amount: 8500,
      method: 'cash',
      status: 'partial',
      dueDate: today,
      collectedDate: today,
      collectedAmount: 5000,
      agentId: agent2.id,
      tenantId: mumbaiTenant.id,
      notes: 'Paid ₹5000, balance ₹3500',
    }
  });

  await prisma.collection.create({
    data: {
      loanId: loan4.id,
      customerId: customer4.id,
      amount: 15000,
      method: 'bank',
      status: 'failed',
      dueDate: today,
      agentId: agent3.id,
      tenantId: mumbaiTenant.id,
      notes: 'Customer not available, try tomorrow',
    }
  });

  await prisma.collection.create({
    data: {
      loanId: loan5.id,
      customerId: customer5.id,
      amount: 25000,
      method: 'upi',
      status: 'pending',
      dueDate: today,
      agentId: agent2.id,
      tenantId: mumbaiTenant.id,
    }
  });

  // Yesterday's collections
  await prisma.collection.create({
    data: {
      loanId: loan6.id,
      customerId: customer6.id,
      amount: 5500,
      method: 'upi',
      status: 'collected',
      dueDate: yesterday,
      collectedDate: yesterday,
      collectedAmount: 5500,
      agentId: agent5.id,
      tenantId: chennaiTenant.id,
    }
  });

  await prisma.collection.create({
    data: {
      loanId: loan7.id,
      customerId: customer7.id,
      amount: 4200,
      method: 'cash',
      status: 'collected',
      dueDate: yesterday,
      collectedDate: yesterday,
      collectedAmount: 4200,
      agentId: agent5.id,
      tenantId: chennaiTenant.id,
    }
  });

  await prisma.collection.create({
    data: {
      loanId: loan8.id,
      customerId: customer8.id,
      amount: 3800,
      method: 'bank',
      status: 'collected',
      dueDate: yesterday,
      collectedDate: yesterday,
      collectedAmount: 3800,
      agentId: agent6.id,
      tenantId: chennaiTenant.id,
    }
  });

  // Two days ago collections
  await prisma.collection.create({
    data: {
      loanId: loan9.id,
      customerId: customer9.id,
      amount: 8500,
      method: 'cash',
      status: 'failed',
      dueDate: twoDaysAgo,
      agentId: agent7.id,
      tenantId: chennaiTenant.id,
      notes: 'Customer unavailable',
    }
  });

  await prisma.collection.create({
    data: {
      loanId: loan10.id,
      customerId: customer10.id,
      amount: 6200,
      method: 'upi',
      status: 'collected',
      dueDate: twoDaysAgo,
      collectedDate: twoDaysAgo,
      collectedAmount: 6200,
      agentId: agent6.id,
      tenantId: chennaiTenant.id,
    }
  });

  console.log('Collections created successfully');

  // Create Customer Users
  console.log('Creating customer users...');
  await prisma.user.create({
    data: {
      email: 'rajesh@example.com',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      password: await bcrypt.hash('customer123', 10),
      role: 'customer',
      tenantId: mumbaiTenant.id,
      customerId: customer1.id,
    }
  });

  await prisma.user.create({
    data: {
      email: 'priya.s@example.com',
      name: 'Priya Sharma',
      phone: '+91 87654 32109',
      password: await bcrypt.hash('customer123', 10),
      role: 'customer',
      tenantId: mumbaiTenant.id,
      customerId: customer2.id,
    }
  });

  await prisma.user.create({
    data: {
      email: 'mohammed@example.com',
      name: 'Mohammed Ali',
      phone: '+91 76543 21098',
      password: await bcrypt.hash('customer123', 10),
      role: 'customer',
      tenantId: mumbaiTenant.id,
      customerId: customer3.id,
    }
  });

  await prisma.user.create({
    data: {
      email: 'ravi@example.com',
      name: 'Ravi Kumar',
      phone: '+91 98765 43214',
      password: await bcrypt.hash('customer123', 10),
      role: 'customer',
      tenantId: chennaiTenant.id,
      customerId: customer6.id,
    }
  });

  console.log('Customer users created successfully');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Tenants: 5 (Mumbai, Delhi, Bangalore, Chennai, Kolkata)`);
  console.log(`- Tenant Settings: 5 (all tenants configured)`);
  console.log(`- Users: 9 total`);
  console.log(`  • 1 Super Admin`);
  console.log(`  • 1 Admin (Mumbai)`);
  console.log(`  • 3 Agents (with login)`);
  console.log(`  • 4 Customers (with login)`);
  console.log(`- Agents: 7 total`);
  console.log(`- Customers: 10`);
  console.log(`- Loans: 10`);
  console.log(`- Collections: 10`);
  
  console.log('\n🔐 Default Credentials:');
  console.log('\n👑 Super Admin:');
  console.log('   Email: admin@loanops.com');
  console.log('   Password: admin123');
  console.log('   Access: All tenants, system analytics, billing');
  
  console.log('\n👨‍💼 Admin:');
  console.log('   Email: mumbai.admin@loanops.com');
  console.log('   Password: admin123');
  console.log('   Access: Mumbai tenant only');
  
  console.log('\n🚴 Agents:');
  console.log('   Email: priya@loan.com / Password: agent123 (Mumbai)');
  console.log('   Email: amit@loan.com / Password: agent123 (Mumbai)');
  console.log('   Email: ramesh@loan.com / Password: agent123 (Chennai)');
  
  console.log('\n👥 Customers:');
  console.log('   Email: rajesh@example.com / Password: customer123');
  console.log('   Email: priya.s@example.com / Password: customer123');
  console.log('   Email: mohammed@example.com / Password: customer123');
  console.log('   Email: ravi@example.com / Password: customer123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
